import { EmailSendStatus, type OrderStatus } from "@/generated/prisma/client";
import { renderOrderEmail, type OrderEmailData, type OrderEmailType } from "@/emails/order-emails";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";
import type { EmailProvider } from "@/server/providers/email-provider";
import { prisma } from "@/server/db/prisma";
import {
  findLatestEmailLogsForOrder,
  findOrderForEmail,
  type OrderEmailRow,
} from "@/server/repositories/order-repository";

/** Aynı `(orderId, type)` için art arda kontrolsüz gönderimi engeller — hem otomatik tetikleme hem admin "yeniden gönder" bu tek noktadan geçer. */
export const RESEND_COOLDOWN_MS = 60_000;

/** Durum-güdümlü otomatik tetikleme için `OrderStatus → OrderEmailType` eşlemesi. `PAID` vb. ödeme-güdümlü durumlar kasıtlı olarak eşlemede YOK. */
export const ORDER_STATUS_TO_EMAIL_TYPE: Partial<Record<OrderStatus, OrderEmailType>> = {
  CONFIRMED: "STATUS_CONFIRMED",
  PROCESSING: "STATUS_PROCESSING",
  SHIPPED: "STATUS_SHIPPED",
  DELIVERED: "STATUS_DELIVERED",
  CANCELLED: "STATUS_CANCELLED",
};

export type SendOrderEmailFailureReason =
  | "PROVIDER_NOT_CONFIGURED"
  | "ORDER_NOT_FOUND"
  | "ALREADY_SENT"
  | "RATE_LIMITED"
  | "SEND_FAILED";

export type SendOrderEmailResult = { ok: true } | { ok: false; reason: SendOrderEmailFailureReason };

export interface SendOrderEmailOptions {
  orderId: string;
  type: OrderEmailType;
  /** `resolveEmailProvider()` sonucu — `null` ise sağlayıcı yapılandırılmamıştır, gönderim sessizce atlanır. */
  emailProvider: EmailProvider | null;
  /** Admin "yeniden gönder" akışı — zaten `SENT` bir kayıt olsa dahi (cooldown dışındaysa) tekrar gönderir. */
  force?: boolean;
}

function buildOrderEmailData(order: OrderEmailRow): OrderEmailData {
  const address = parseOrderAddressSnapshot(order.shippingAddressSnapshot);
  const customerName = address ? `${address.firstName} ${address.lastName}` : "Değerli Müşterimiz";

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName,
    status: order.status,
    items: order.items.map((item) => ({ productName: item.productName, quantity: item.quantity })),
    subtotal: order.subtotal.toString(),
    shippingTotal: order.shippingTotal !== null ? order.shippingTotal.toString() : null,
    shippingPriceStatus: order.shippingPriceStatus,
    grandTotal: order.grandTotal.toString(),
    totalStatus: order.totalStatus,
  };
}

/**
 * Bir sipariş/durum bildirim e-postası gönderir — TEK, paylaşılan giriş
 * noktası (otomatik tetikleme hem admin "yeniden gönder" bunu kullanır).
 * Bu fonksiyon ASLA throw ETMEZ: sağlayıcı yoksa, sipariş bulunamazsa, hız
 * sınırına takılırsa veya gönderim sağlayıcı tarafında başarısız/throw
 * ederse `{ok:false, reason}` döner — çağıran taraf (checkout/durum
 * güncelleme) bu sonucu sipariş işleminin başarısını ETKİLEMEDEN yok sayar
 * (bkz. `docs/PROJECT_SCOPE.md` §12).
 */
export async function sendOrderEmail(options: SendOrderEmailOptions): Promise<SendOrderEmailResult> {
  const { orderId, type, emailProvider, force = false } = options;

  if (!emailProvider) {
    return { ok: false, reason: "PROVIDER_NOT_CONFIGURED" };
  }

  const order = await findOrderForEmail(orderId);
  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }

  const latestLogs = await findLatestEmailLogsForOrder(orderId);
  const lastLog = latestLogs.get(type);

  if (lastLog) {
    const elapsedMs = Date.now() - lastLog.createdAt.getTime();
    if (elapsedMs < RESEND_COOLDOWN_MS) {
      return { ok: false, reason: "RATE_LIMITED" };
    }
    if (!force && lastLog.status === EmailSendStatus.SENT) {
      return { ok: false, reason: "ALREADY_SENT" };
    }
  }

  const rendered = renderOrderEmail(type, buildOrderEmailData(order));

  try {
    const sendResult = await emailProvider.sendEmail({
      to: order.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    await prisma.orderEmailLog.create({
      data: {
        orderId,
        type,
        status: sendResult.ok ? EmailSendStatus.SENT : EmailSendStatus.FAILED,
        recipient: order.email,
        errorMessage: sendResult.ok ? null : (sendResult.error ?? "Bilinmeyen hata"),
      },
    });

    return sendResult.ok ? { ok: true } : { ok: false, reason: "SEND_FAILED" };
  } catch (error) {
    await prisma.orderEmailLog.create({
      data: {
        orderId,
        type,
        status: EmailSendStatus.FAILED,
        recipient: order.email,
        errorMessage: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
    });
    return { ok: false, reason: "SEND_FAILED" };
  }
}
