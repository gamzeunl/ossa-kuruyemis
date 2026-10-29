import "server-only";

import { prisma } from "@/server/db/prisma";
import { consumeReservationsForOrder } from "@/server/repositories/inventory-repository";
import { retrieveIyzicoPayment } from "./iyzico-checkout-retrieve";
import { verifyIyzicoPayment } from "./iyzico-payment-verification";
import { serverEnv } from "@/config/env";
import { notifyAdminNewOrder } from "@/server/services/admin-order-notification";

export async function finalizeIyzicoPayment(token: string) {
  if (!token || token.length > 512) {
    throw new Error("Geçersiz ödeme token'ı.");
  }

  const attempt = await prisma.paymentAttempt.findFirst({
    where: { providerToken: token },
    include: { payment: true, order: true },
  });

  if (!attempt || !attempt.payment) {
    throw new Error("Ödeme denemesi bulunamadı.");
  }

  const result = await retrieveIyzicoPayment(token, attempt.conversationId);

  const providerPaymentId = verifyIyzicoPayment(result, {
    conversationId: attempt.conversationId,
    token,
    amount: attempt.requestedAmount,
    currency: attempt.payment.currency,
    basketId: attempt.orderId,
    secretKey: serverEnv.IYZICO_SECRET_KEY!,
  });

  // Sağlayıcı ödeme kimliği mevcut başarılı tahsilatla çelişirse
  // inceleme işaretini hata fırlatılmadan önce kalıcılaştır.
  if (
    attempt.payment.status === "SUCCEEDED" &&
    attempt.payment.providerPaymentId !== providerPaymentId
  ) {
    await prisma.payment.update({
      where: { id: attempt.payment.id },
      data: { requiresManualReview: true },
    });
    throw new Error("Ödeme kimliği uyuşmazlığı; manuel kontrol gerekli.");
  }

  // Aşama 1: Doğrulanmış tahsilatı stok işleminden bağımsız kalıcılaştır.
  const recorded = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${attempt.orderId}
      FOR UPDATE
    `;

    const current = await tx.paymentAttempt.findUnique({
      where: { id: attempt.id },
      include: { payment: true, order: true },
    });

    if (!current || !current.payment) {
      throw new Error("Ödeme kaydı bulunamadı.");
    }

    if (
      current.providerToken !== token ||
      current.conversationId !== attempt.conversationId ||
      !current.requestedAmount.equals(attempt.requestedAmount) ||
      current.payment.id !== attempt.paymentId
    ) {
      throw new Error("Ödeme kaydı doğrulama sırasında değişti.");
    }

    if (
      !current.payment.amount.equals(current.requestedAmount) ||
      !current.order.grandTotal.equals(current.requestedAmount)
    ) {
      throw new Error("Sipariş ve ödeme tutarları eşleşmiyor.");
    }

    if (
      current.payment.status === "SUCCEEDED" &&
      current.payment.providerPaymentId !== providerPaymentId
    ) {
      throw new Error("Ödeme kimliği uyuşmazlığı; manuel kontrol gerekli.");
    }

    if (
      current.status === "VERIFIED" &&
      current.payment.status === "SUCCEEDED" &&
      current.order.status === "PAID" &&
      current.payment.providerPaymentId === providerPaymentId &&
      !current.payment.requiresManualReview
    ) {
      return {
        orderNumber: current.order.orderNumber,
        alreadyProcessed: true,
      };
    }

    if (
      current.order.status !== "PAYMENT_PROCESSING" ||
      !(
        (current.status === "INITIATED" &&
          current.payment.status === "PENDING") ||
        (current.status === "VERIFIED" &&
          current.payment.status === "SUCCEEDED" &&
          current.payment.providerPaymentId === providerPaymentId)
      )
    ) {
      throw new Error("Ödeme beklenmeyen durumda; manuel kontrol gerekli.");
    }

    await tx.payment.update({
      where: { id: current.payment.id },
      data: {
        status: "SUCCEEDED",
        providerPaymentId,
        requiresManualReview: true,
      },
    });

    await tx.paymentAttempt.update({
      where: { id: current.id },
      data: { status: "VERIFIED" },
    });

    return {
      orderNumber: current.order.orderNumber,
      alreadyProcessed: false,
    };
  });

  if (recorded.alreadyProcessed) {
    return recorded;
  }

  // Aşama 2: Stok ve sipariş güncellemesi atomik çalışır.
  // Hata olursa bu transaction geri alınır; başarılı tahsilat ve
  // requiresManualReview=true önceki transaction'da korunur.
  const finalized = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${attempt.orderId}
      FOR UPDATE
    `;

    const current = await tx.paymentAttempt.findUnique({
      where: { id: attempt.id },
      include: { payment: true, order: true },
    });

    if (!current || !current.payment) {
      throw new Error("Ödeme kaydı bulunamadı.");
    }

    if (
      current.providerToken !== token ||
      current.status !== "VERIFIED" ||
      current.payment.status !== "SUCCEEDED" ||
      current.payment.providerPaymentId !== providerPaymentId
    ) {
      throw new Error("Ödeme kesinleştirme ön koşulları sağlanmadı.");
    }

    if (
      current.order.status === "PAID" &&
      !current.payment.requiresManualReview
    ) {
      return {
        orderNumber: current.order.orderNumber,
        alreadyProcessed: true,
      };
    }

    if (
      current.order.status !== "PAYMENT_PROCESSING" ||
      !current.payment.requiresManualReview
    ) {
      throw new Error("Sipariş manuel inceleme gerektiriyor.");
    }

    await consumeReservationsForOrder(current.orderId, tx);

    await tx.order.update({
      where: { id: current.orderId },
      data: { status: "PAID" },
    });

    await tx.payment.update({
      where: { id: current.payment.id },
      data: { requiresManualReview: false },
    });

    return {
      orderNumber: current.order.orderNumber,
      alreadyProcessed: false,
    };
  });

  // E-posta yalnızca başarılı ödeme transaction'ından sonra gönderilir.
  // Bildirim hatası ödeme sonucunu değiştirmez.
  await notifyAdminNewOrder(attempt.orderId);

  return finalized;
}
