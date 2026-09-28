"use server";

import { z } from "zod";
import { InvoiceType } from "@/generated/prisma/client";
import { mapCheckoutFieldsToAddressInput } from "@/lib/checkout-address-mapping";
import { checkoutSchema } from "@/lib/checkout-schema";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveEmailProvider } from "@/server/providers/email-provider";
import { createAddress } from "@/server/repositories/address-repository";
import {
  createDraftOrder,
  type CreateDraftOrderFailureReason,
  type DraftOrderInvoice,
} from "@/server/repositories/order-repository";
import { sendOrderEmail } from "@/server/services/order-email-service";
import { getShippingSettings } from "@/server/services/site-setting-service";

export type CheckoutActionResult =
  | { ok: true; orderNumber: string; resultAccessToken: string }
  | { ok: false; message: string };

interface CheckoutItemInput {
  variantId: string;
  quantity: number;
}

const idempotencyKeySchema = z.string().trim().uuid();

const FAILURE_MESSAGES: Record<CreateDraftOrderFailureReason, string> = {
  EMPTY_CART: "Sepetiniz boş.",
  INVALID_QUANTITY: "Sepetinizdeki bir ürün adedi geçersiz.",
  ITEM_NOT_FOUND: "Sepetinizdeki bir ürün artık bulunamıyor. Lütfen sepetinizi güncelleyin.",
  PRODUCT_UNAVAILABLE: "Sepetinizdeki bir ürün artık satışta değil. Lütfen sepetinizi güncelleyin.",
  INSUFFICIENT_STOCK: "Sepetinizdeki bir ürün için yeterli stok kalmadı.",
  FINGERPRINT_MISMATCH:
    "Bu sipariş isteği daha önce farklı bilgilerle gönderilmiş. Lütfen ödeme adımını yenileyin.",
};

function readAddressFromFormData(formData: FormData, prefix: string) {
  return {
    firstName: String(formData.get(`${prefix}firstName`) ?? ""),
    lastName: String(formData.get(`${prefix}lastName`) ?? ""),
    phone: String(formData.get(`${prefix}phone`) ?? ""),
    city: String(formData.get(`${prefix}city`) ?? ""),
    district: String(formData.get(`${prefix}district`) ?? ""),
    neighborhood: String(formData.get(`${prefix}neighborhood`) ?? ""),
    addressLine: String(formData.get(`${prefix}addressLine`) ?? ""),
    addressLabel: String(formData.get(`${prefix}addressLabel`) ?? ""),
  };
}

/**
 * Sepetten GERÇEK bir sipariş taslağı (`status: PENDING`) oluşturur. Canlı
 * ödeme entegrasyonu olmadığından asla "ödendi" mesajı verilmez — başarı
 * sonucu yalnızca talebin alındığını, ödemenin henüz tamamlanmadığını belirtir.
 * `items` client'tan yalnızca `variantId`+`quantity` olarak alınır; fiyat/isim/
 * toplam gibi hiçbir alan client'tan okunmaz (`createDraftOrder` bunları DB'den
 * yeniden hesaplar). `idempotencyKey` client'ta üretilir (`crypto.randomUUID()`)
 * ve YALNIZCA tekrar-gönderim tespiti için kullanılır — fiyat/güvenlik kararı
 * için hiçbir zaman kullanılmaz.
 */
export async function createOrderAction(
  formData: FormData,
  items: CheckoutItemInput[],
  idempotencyKey: string,
): Promise<CheckoutActionResult> {
  // Girişsiz kullanıcı da sipariş verebilir (misafir siparişi) — kimlik erken
  // çözülür ki hız sınırlama anahtarı (userId varsa onunla, yoksa IP ile)
  // gerçek doğrulama/DB işinden ÖNCE uygulanabilsin.
  const user = await betterAuthProvider.getCurrentUser();
  const identity = user ? `user:${user.id}` : `ip:${await getClientIp()}`;
  const rateLimitCheck = await checkRateLimit(`checkout:${identity}`, RATE_LIMIT_POLICIES.checkoutByIdentity);
  if (!rateLimitCheck.ok) {
    const minutes = Math.ceil((rateLimitCheck.retryAfterSeconds ?? 60) / 60);
    return { ok: false, message: `Çok fazla sipariş denemesi yapıldı. Lütfen ${minutes} dakika sonra tekrar deneyin.` };
  }

  const billingSameAsShipping = formData.get("billingSameAsShipping") === "on";
  const invoiceTypeRaw = String(formData.get("invoiceType") ?? "");

  const raw = {
    email: String(formData.get("email") ?? ""),
    shippingAddress: readAddressFromFormData(formData, ""),
    billingSameAsShipping,
    billingAddress: billingSameAsShipping ? undefined : readAddressFromFormData(formData, "billing_"),
    invoice:
      invoiceTypeRaw === "CORPORATE"
        ? {
            invoiceType: "CORPORATE" as const,
            companyName: String(formData.get("companyName") ?? ""),
            taxOffice: String(formData.get("taxOffice") ?? ""),
            taxNumber: String(formData.get("taxNumber") ?? ""),
          }
        : { invoiceType: "INDIVIDUAL" as const },
  };

  // Server-taraf Zod doğrulaması TEK güvenilir kaynaktır — client'taki aynı
  // şema yalnızca UX içindir, burada tekrar (ve bağımsız olarak) çalıştırılır.
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Girdi doğrulanamadı. Lütfen alanları kontrol edin." };
  }

  const parsedKey = idempotencyKeySchema.safeParse(idempotencyKey);
  if (!parsedKey.success) {
    return { ok: false, message: "Girdi doğrulanamadı. Lütfen sayfayı yenileyip tekrar deneyin." };
  }

  const sanitizedItems = items
    .filter((item) => typeof item.variantId === "string" && item.variantId.length > 0)
    .map((item) => ({ variantId: item.variantId, quantity: Math.trunc(Number(item.quantity)) }));

  const billingAddress = parsed.data.billingSameAsShipping
    ? parsed.data.shippingAddress
    : parsed.data.billingAddress!;

  const invoice: DraftOrderInvoice =
    parsed.data.invoice.invoiceType === "CORPORATE"
      ? {
          invoiceType: InvoiceType.CORPORATE,
          companyName: parsed.data.invoice.companyName,
          taxOffice: parsed.data.invoice.taxOffice,
          taxNumber: parsed.data.invoice.taxNumber,
        }
      : { invoiceType: InvoiceType.INDIVIDUAL };

  // `user` yukarıda (hız sınırlama kimliği için) zaten çözüldü — `Order.userId`
  // HER ZAMAN bu sunucu-taraf oturumdan gelir, client'tan asla alınmaz.

  try {
    const shippingSettings = await getShippingSettings();
    const result = await createDraftOrder(
      {
        userId: user?.id ?? null,
        email: parsed.data.email,
        phone: parsed.data.shippingAddress.phone,
        items: sanitizedItems,
        shippingAddress: parsed.data.shippingAddress,
        billingAddress,
        invoice,
        idempotencyKey: parsedKey.data,
      },
      shippingSettings,
    );

    if (!result.ok) {
      return { ok: false, message: FAILURE_MESSAGES[result.reason] };
    }

    // Best-effort: e-posta sonucu (sağlayıcı yapılandırılmamış/başarısız/hız
    // sınırı dahil) checkout başarısını hiçbir şekilde etkilemez (bkz.
    // docs/PROJECT_SCOPE.md §12). `sendOrderEmail` zaten throw etmez; try/catch
    // yalnızca savunma amaçlıdır.
    try {
      await sendOrderEmail({
        orderId: result.orderId,
        type: "ORDER_RECEIVED",
        emailProvider: resolveEmailProvider(),
      });
    } catch {
      // Sipariş zaten oluşturuldu — bildirim hatası akışı bozmaz.
    }

    // Best-effort: "Bu adresi adreslerime kaydet" — SİPARİŞ oluşturma
    // transaction'ının TAMAMEN DIŞINDA, ayrık bir yazma. Başarısız olsa dahi
    // sipariş sonucunu ASLA etkilemez (e-posta gönderimiyle AYNI desen).
    if (user && formData.get("saveAddress") === "on") {
      try {
        await createAddress(user.id, mapCheckoutFieldsToAddressInput(parsed.data.shippingAddress));
      } catch {
        // Sipariş zaten oluşturuldu — adres kaydı hatası akışı bozmaz.
      }
    }

    return { ok: true, orderNumber: result.orderNumber, resultAccessToken: result.resultAccessToken };
  } catch {
    return { ok: false, message: "Siparişiniz oluşturulamadı. Lütfen daha sonra tekrar deneyin." };
  }
}
