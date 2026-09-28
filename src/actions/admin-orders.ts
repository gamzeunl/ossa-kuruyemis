"use server";

import { revalidatePath } from "next/cache";
import type { OrderEmailType } from "@/emails/order-emails";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveEmailProvider } from "@/server/providers/email-provider";
import {
  cancelOrder,
  finalizeOrderShipping,
  updateOrderStatus,
  type CancelOrderFailureReason,
  type FinalizeShippingFailureReason,
  type UpdateOrderStatusFailureReason,
} from "@/server/repositories/order-repository";
import {
  ORDER_STATUS_TO_EMAIL_TYPE,
  sendOrderEmail,
  type SendOrderEmailFailureReason,
} from "@/server/services/order-email-service";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

const RESEND_EMAIL_FAILURE_MESSAGES: Record<SendOrderEmailFailureReason, string> = {
  PROVIDER_NOT_CONFIGURED: "E-posta sağlayıcısı yapılandırılmamış.",
  ORDER_NOT_FOUND: "Sipariş bulunamadı.",
  ALREADY_SENT: "Bu e-posta zaten gönderildi.",
  RATE_LIMITED: "Çok sık deneme yapıldı. Lütfen bir dakika sonra tekrar deneyin.",
  SEND_FAILED: "E-posta gönderilemedi.",
};

/**
 * Durum değişikliğine karşılık gelen bildirim e-postasını best-effort
 * gönderir — sonuç ne olursa olsun (sağlayıcı yok/başarısız/hız sınırı
 * dahil) admin işleminin başarısını ETKİLEMEZ (bkz. docs/PROJECT_SCOPE.md §12).
 */
async function triggerStatusEmail(orderId: string, newStatus: OrderStatus): Promise<void> {
  const type = ORDER_STATUS_TO_EMAIL_TYPE[newStatus];
  if (!type) {
    return;
  }
  try {
    await sendOrderEmail({ orderId, type, emailProvider: resolveEmailProvider() });
  } catch {
    // best-effort — çağıran taraf zaten başarılı durum güncellemesini döndürdü.
  }
}

const STATUS_FAILURE_MESSAGES: Record<UpdateOrderStatusFailureReason, string> = {
  ORDER_NOT_FOUND: "Sipariş bulunamadı.",
  INVALID_TRANSITION: "Bu durum geçişine izin verilmiyor.",
};

const CANCEL_FAILURE_MESSAGES: Record<CancelOrderFailureReason, string> = {
  ORDER_NOT_FOUND: "Sipariş bulunamadı.",
  INVALID_TRANSITION: "Bu sipariş artık iptal edilemez.",
};

const SHIPPING_FAILURE_MESSAGES: Record<FinalizeShippingFailureReason, string> = {
  ORDER_NOT_FOUND: "Sipariş bulunamadı.",
  NOT_PENDING: "Bu siparişin kargo ücreti zaten netleşmiş.",
  INVALID_AMOUNT: "Kargo ücreti pozitif bir tutar olmalı.",
};

/**
 * Sipariş durumunu değiştirir — yalnızca `canTransitionOrderStatus` (bkz.
 * `order-status.ts`) true dönen hedeflere izin verilir; `PENDING→PAID` gibi
 * ödeme-güdümlü geçişler bu fazda hiçbir zaman admin'den yapılamaz (izin
 * listesi zaten boş). AuditLog'a yalnızca önceki/yeni durum yazılır, müşteri
 * kişisel verisi kopyalanmaz.
 */
export async function updateOrderStatusAction(
  orderId: string,
  to: OrderStatus,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const result = await updateOrderStatus(orderId, to);
  if (!result.ok) {
    return { ok: false, message: STATUS_FAILURE_MESSAGES[result.reason] };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "ORDER_STATUS_CHANGED",
    entityType: "Order",
    entityId: orderId,
    metadata: { previousStatus: result.previousStatus, newStatus: result.newStatus },
  });

  await triggerStatusEmail(orderId, result.newStatus);

  revalidatePath("/yonetim/siparisler");
  revalidatePath(`/yonetim/siparisler/${orderId}`);
  return { ok: true };
}

/**
 * Bir siparişi iptal eder. Stok bu aşamada hiç düşülmediğinden bir stok iade
 * hareketi oluşturulmaz (bkz. plan — bilinen sınır). Neden isteğe bağlıdır;
 * verilirse yalnızca AuditLog metadata'sına yazılır, Order üzerinde ayrı bir
 * kolon tutulmaz.
 */
export async function cancelOrderAction(
  orderId: string,
  reason: string | null,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const result = await cancelOrder(orderId);
  if (!result.ok) {
    return { ok: false, message: CANCEL_FAILURE_MESSAGES[result.reason] };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "ORDER_CANCELLED",
    entityType: "Order",
    entityId: orderId,
    metadata: {
      previousStatus: result.previousStatus,
      ...(reason ? { reason } : {}),
    },
  });

  await triggerStatusEmail(orderId, OrderStatus.CANCELLED);

  revalidatePath("/yonetim/siparisler");
  revalidatePath(`/yonetim/siparisler/${orderId}`);
  return { ok: true };
}

/**
 * Kargo ücreti bilinmeyen bir siparişte yönetici gerçek ücreti netleştirir.
 * `subtotal` her zaman DB'den okunur, `grandTotal` sunucuda yeniden hesaplanır
 * — client'tan tutar ALINMAZ; yalnızca "ücretsiz" (mode=FREE) veya "sabit
 * ücret" (mode=FIXED + pozitif tutar) seçimi alınır.
 */
export async function finalizeOrderShippingAction(
  orderId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const mode = String(formData.get("mode") ?? "");
  if (mode !== "FREE" && mode !== "FIXED") {
    return { ok: false, message: "Geçerli bir kargo seçeneği belirtin." };
  }

  let result;
  if (mode === "FREE") {
    result = await finalizeOrderShipping(orderId, { mode: "FREE" });
  } else {
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const parsedAmount = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return { ok: false, message: SHIPPING_FAILURE_MESSAGES.INVALID_AMOUNT };
    }
    result = await finalizeOrderShipping(orderId, {
      mode: "FIXED",
      amount: new Prisma.Decimal(amountRaw),
    });
  }

  if (!result.ok) {
    return { ok: false, message: SHIPPING_FAILURE_MESSAGES[result.reason] };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "ORDER_SHIPPING_FINALIZED",
    entityType: "Order",
    entityId: orderId,
    metadata: { shippingTotal: result.shippingTotal.toString(), grandTotal: result.grandTotal.toString() },
  });

  revalidatePath("/yonetim/siparisler");
  revalidatePath(`/yonetim/siparisler/${orderId}`);
  return { ok: true };
}

/**
 * Bir sipariş/durum e-postasını admin isteğiyle yeniden gönderir —
 * `sendOrderEmail`'in TEK hız-sınırlama noktasından geçer (`force:true`
 * "zaten gönderildi" kontrolünü atlar, ama cooldown'u ATLAMAZ) — aynı
 * e-postanın art arda kontrolsüz gönderilmesi böylece engellenir.
 */
export async function resendOrderEmailAction(
  orderId: string,
  type: OrderEmailType,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const result = await sendOrderEmail({
    orderId,
    type,
    emailProvider: resolveEmailProvider(),
    force: true,
  });

  if (!result.ok) {
    return { ok: false, message: RESEND_EMAIL_FAILURE_MESSAGES[result.reason] };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "ORDER_EMAIL_RESENT",
    entityType: "Order",
    entityId: orderId,
    metadata: { type },
  });

  revalidatePath(`/yonetim/siparisler/${orderId}`);
  return { ok: true };
}
