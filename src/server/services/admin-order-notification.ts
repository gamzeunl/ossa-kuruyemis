import "server-only";

import { prisma } from "@/server/db/prisma";
import { serverEnv } from "@/config/env";
import { resolveEmailProvider } from "@/server/providers/email-provider";
import { findOrderForEmail } from "@/server/repositories/order-repository";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";

const NOTIFICATION_EMAIL = serverEnv.ORDER_NOTIFICATION_EMAIL;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function notifyAdminNewOrder(orderId: string): Promise<void> {
  try {
    const provider = resolveEmailProvider();

    if (!provider || !serverEnv.EMAIL_FROM || !NOTIFICATION_EMAIL) {
      console.error("Sipariş bildirimi: e-posta sağlayıcısı yapılandırılmamış.");
      return;
    }

    const order = await findOrderForEmail(orderId);

    if (!order || order.status !== "PAID") {
      return;
    }

    // Benzersiz indeks sayesinde yalnızca bir işlem gönderimi sahiplenebilir.
    // Önce kayıt oluşturulur; gönderimden sonra durum güncellenir.
    let notificationId: string;

    try {
      const notification = await prisma.orderEmailLog.create({
        data: {
          orderId,
          type: "ADMIN_NEW_ORDER",
          status: "SENDING",
          recipient: NOTIFICATION_EMAIL,
        },
      });

      notificationId = notification.id;
    } catch (error) {
      // Sadece benzersizlik ihlalini normal mükerrer callback say.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return;
      }
      throw error;
    }

    const address = parseOrderAddressSnapshot(
      order.shippingAddressSnapshot,
    );

    const customerName = address
      ? `${address.firstName} ${address.lastName}`
      : "Belirtilmedi";

    const addressText = address
      ? `${address.neighborhood}, ${address.addressLine}, ${address.district}/${address.city}`
      : "Adres bilgisi bulunamadı";

    const products = order.items
      .map((item) => `${item.productName} x ${item.quantity}`)
      .join("\n");

    const text = [
      "OSSA Kuruyemiş - Yeni Ödenmiş Sipariş",
      "",
      `Sipariş No: ${order.orderNumber}`,
      `Müşteri: ${customerName}`,
      `E-posta: ${order.email}`,
      `Telefon: ${address?.phone ?? "Belirtilmedi"}`,
      "",
      "Ürünler:",
      products,
      "",
      `Toplam: ${order.grandTotal.toString()} TL`,
      `Teslimat Adresi: ${addressText}`,
      "Ödeme Durumu: Başarılı",
    ].join("\n");

    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>OSSA Kuruyemiş - Yeni Sipariş</h2>
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(text)}</pre>
    </div>`;

    const result = await provider.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `Yeni Sipariş: ${order.orderNumber}`,
      html,
      text,
    });

    await prisma.orderEmailLog.update({
      where: { id: notificationId },
      data: {
        status: result.ok ? "SENT" : "FAILED",
        errorMessage: result.ok ? null : result.error ?? "Gönderim başarısız",
      },
    });

    if (!result.ok) {
      console.error("Sipariş bildirimi gönderilemedi:", result.error);
    }
  } catch (error) {
    console.error(
      "Sipariş bildirimi hatası:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );
  }
}
