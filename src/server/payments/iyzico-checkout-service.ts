import "server-only";

import { randomUUID } from "node:crypto";
import { resolvePaymentClientIp } from "@/lib/payment-client-ip";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { validateOrderForIyzico } from "./iyzico-checkout-validation";
import { retrieveIyzicoPayment } from "./iyzico-checkout-retrieve";
import { finalizeIyzicoPayment } from "./iyzico-finalize";

export async function createIyzicoPaymentAttempt(orderId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${orderId}
      FOR UPDATE
    `;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, paymentAttempts: true },
    });

    if (!order) {
      throw new Error("Sipariş bulunamadı.");
    }

    const amount = validateOrderForIyzico(order);

    await tx.$queryRaw`
      SELECT id FROM "StockReservation"
      WHERE "orderId" = ${order.id}
      ORDER BY id
      FOR UPDATE
    `;

    const reservations = await tx.stockReservation.findMany({
      where: { orderId: order.id },
      select: {
        variantId: true,
        quantity: true,
        status: true,
        expiresAt: true,
      },
    });

    const now = new Date();

    if (
      reservations.length === 0 ||
      reservations.some(
        (reservation) =>
          reservation.status !== "ACTIVE" ||
          reservation.expiresAt <= now,
      )
    ) {
      throw new Error(
        "Stok rezervasyonu geçersiz veya süresi dolmuş. Yeni sipariş oluşturulmalı.",
      );
    }

    const ordered = new Map<string, number>();
    for (const item of order.items) {
      if (!item.variantId) {
        throw new Error("Sipariş ürününün varyant bilgisi eksik.");
      }

      ordered.set(
        item.variantId,
        (ordered.get(item.variantId) ?? 0) + item.quantity,
      );
    }

    const reserved = new Map<string, number>();
    for (const reservation of reservations) {
      reserved.set(
        reservation.variantId,
        (reserved.get(reservation.variantId) ?? 0) + reservation.quantity,
      );
    }

    if (
      ordered.size !== reserved.size ||
      [...ordered].some(
        ([variantId, quantity]) => reserved.get(variantId) !== quantity,
      )
    ) {
      throw new Error(
        "Sipariş ürünleri ile stok rezervasyonları eşleşmiyor.",
      );
    }

    if (order.paymentAttempts.some(
      (attempt) =>
        attempt.status === "INITIATED" ||
        attempt.status === "CALLBACK_RECEIVED" ||
        attempt.status === "VERIFIED",
    )) {
      throw new Error("Bu sipariş için mevcut bir ödeme işlemi bulunuyor.");
    }

    if (
      order.paymentAttempts.some(
        (attempt) => attempt.status !== "FAILED",
      )
    ) {
      throw new Error(
        "Önceki ödeme denemesi kesin olarak sonuçlanmadan yeni ödeme başlatılamaz.",
      );
    }

    const attemptNumber =
      Math.max(0, ...order.paymentAttempts.map((a) => a.attemptNumber)) + 1;

    const conversationId = randomUUID();

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "iyzico",
        status: "PENDING",
        amount: new Prisma.Decimal(amount),
        currency: "TRY",
        conversationId,
      },
    });

    const attempt = await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        paymentId: payment.id,
        attemptNumber,
        status: "INITIATED",
        conversationId,
        requestedAmount: new Prisma.Decimal(amount),
      },
    });

    await tx.order.updateMany({
      where: {
        id: order.id,
        status: {
          in: ["PENDING", "PAYMENT_FAILED"],
        },
      },
      data: {
        status: "PAYMENT_PROCESSING",
      },
    }).then((result) => {
      if (result.count !== 1) {
        throw new Error("Sipariş ödeme işlemine geçirilemedi.");
      }
    });

    return {
      orderId: order.id,
      conversationId,
      paymentId: payment.id,
      attemptId: attempt.id,
    };
  });
}

export async function failIyzicoPaymentAttempt(
  attemptId: string,
  reason: string,
) {
  await prisma.$transaction(async (tx) => {
    const initial = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
      select: { orderId: true },
    });

    if (!initial) return;

    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${initial.orderId}
      FOR UPDATE
    `;

    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
    });

    if (
      !attempt ||
      attempt.status !== "INITIATED" ||
      attempt.providerToken !== null
    ) {
      return;
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "FAILED",
        failureReason: reason.slice(0, 500),
      },
    });

    if (attempt.paymentId) {
      await tx.payment.updateMany({
        where: {
          id: attempt.paymentId,
          status: "PENDING",
        },
        data: { status: "FAILED" },
      });
    }

    const updated = await tx.order.updateMany({
      where: {
        id: attempt.orderId,
        status: "PAYMENT_PROCESSING",
      },
      data: { status: "PAYMENT_FAILED" },
    });

    // Ödeme sonucu belirsizken stok serbest bırakılmaz.
  });
}

/**
 * `failIyzicoPaymentAttempt` bilinçli olarak `providerToken` yazılmış bir
 * denemeye DOKUNMAZ — token varsa iyzico'da gerçek bir tahsilat oluşmuş
 * olabilir ve onu körlemesine FAILED yapmak parayı kaybetmek demektir.
 *
 * Bu fonksiyon yalnızca sağlayıcıya SORULUP "bu token ile ödeme alınmadı"
 * yanıtı kesinleştikten sonra çağrılır (bkz. reconcilePendingIyzicoAttempts).
 */
async function failVerifiedUnpaidAttempt(attemptId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    const initial = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
      select: { orderId: true },
    });

    if (!initial) return;

    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${initial.orderId}
      FOR UPDATE
    `;

    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
    });

    // VERIFIED bir deneme asla geri alınmaz — ödeme alınmış demektir.
    if (
      !attempt ||
      (attempt.status !== "INITIATED" && attempt.status !== "CALLBACK_RECEIVED")
    ) {
      return;
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: "FAILED", failureReason: reason.slice(0, 500) },
    });

    if (attempt.paymentId) {
      await tx.payment.updateMany({
        where: { id: attempt.paymentId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    await tx.order.updateMany({
      where: { id: attempt.orderId, status: "PAYMENT_PROCESSING" },
      data: { status: "PAYMENT_FAILED" },
    });

    // Ödeme sonucu netleşse de stok rezervasyonu KORUNUR — müşteri aynı
    // siparişi tekrar denediğinde ürünler hâlâ ayrılmış olmalıdır.
  });
}

export class OrderAlreadyPaidError extends Error {
  constructor(readonly orderNumber: string) {
    super("Bu sipariş için ödeme zaten alınmış.");
    this.name = "OrderAlreadyPaidError";
  }
}

/**
 * Yeni bir tahsilat başlatmadan ÖNCE, sipariş üzerinde yarım kalmış
 * (`INITIATED`/`CALLBACK_RECEIVED`) denemeleri iyzico'ya sorarak kapatır.
 *
 * Bu, "önceki denemede oluşmuş siparişin tekrar tahsil edilmesi" riskine
 * karşı asıl korumadır: token'ı olan bir deneme gerçekten ödenmişse yeni
 * ödeme formu AÇILMAZ, mevcut tahsilat kesinleştirilir. Durum kesin olarak
 * belirlenemezse (ağ hatası, 3DS ortasında kalmış işlem) hiçbir şey
 * FAILED yapılmaz ve hata fırlatılır — şüphede ASLA ikinci kez tahsil
 * edilmez.
 */
export async function reconcilePendingIyzicoAttempts(
  orderId: string,
): Promise<{ alreadyPaid: boolean; orderNumber: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, status: true },
  });

  if (!order) {
    throw new Error("Sipariş bulunamadı.");
  }

  if (order.status === "PAID") {
    return { alreadyPaid: true, orderNumber: order.orderNumber };
  }

  const openAttempts = await prisma.paymentAttempt.findMany({
    where: {
      orderId,
      status: { in: ["INITIATED", "CALLBACK_RECEIVED"] },
    },
    select: { id: true, providerToken: true, conversationId: true },
    orderBy: { attemptNumber: "asc" },
  });

  for (const attempt of openAttempts) {
    if (!attempt.providerToken) {
      // iyzico ödeme formu hiç oluşmadı → tahsilat teknik olarak imkânsız.
      await failIyzicoPaymentAttempt(
        attempt.id,
        "Ödeme formu oluşturulamadan yarım kalan deneme kapatıldı.",
      );
      continue;
    }

    const result = await retrieveIyzicoPayment(
      attempt.providerToken,
      attempt.conversationId,
    );

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      // Para GERÇEKTEN alınmış. İmza + tutar doğrulaması `finalizeIyzicoPayment`
      // içinde yapılır; başarılıysa sipariş PAID olur ve yeni tahsilat açılmaz.
      await finalizeIyzicoPayment(attempt.providerToken);
      return { alreadyPaid: true, orderNumber: order.orderNumber };
    }

    const providerSaysUnpaid =
      result.status === "failure" ||
      (result.status === "success" && result.paymentStatus === "FAILURE");

    if (!providerSaysUnpaid) {
      // 3DS ortasında kalmış/bilinmeyen durum — ikinci tahsilat riski var.
      throw new Error(
        "Bu sipariş için devam eden bir ödeme işlemi var. Lütfen birkaç dakika " +
          "sonra sipariş durumunuzu kontrol edin; yeniden ödeme başlatmayın.",
      );
    }

    await failVerifiedUnpaidAttempt(
      attempt.id,
      result.errorMessage?.slice(0, 500) ??
        "iyzico bu deneme için ödeme alınmadığını bildirdi.",
    );
  }

  return { alreadyPaid: false, orderNumber: order.orderNumber };
}

export async function saveIyzicoCheckoutToken(
  attemptId: string,
  conversationId: string,
  token: string,
) {
  if (!token.trim()) {
    throw new Error("iyzico ödeme token'ı boş olamaz.");
  }

  await prisma.$transaction(async (tx) => {
    const initial = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
      select: { orderId: true },
    });

    if (!initial) {
      throw new Error("Ödeme denemesi bulunamadı.");
    }

    await tx.$queryRaw`
      SELECT id FROM "Order"
      WHERE id = ${initial.orderId}
      FOR UPDATE
    `;

    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.conversationId !== conversationId) {
      throw new Error("Ödeme denemesi bulunamadı veya eşleşmiyor.");
    }

    if (attempt.status !== "INITIATED") {
      throw new Error("Ödeme denemesi uygun durumda değil.");
    }

    if (attempt.providerToken && attempt.providerToken !== token) {
      throw new Error("Ödeme denemesinin farklı bir token'ı bulunuyor.");
    }

    await tx.paymentAttempt.update({
      where: { id: attemptId },
      data: { providerToken: token },
    });
  });
}

export async function completeIyzicoCheckoutInitialization(
  attemptId: string,
  conversationId: string,
  response: {
    token?: string;
    conversationId?: string;
    paymentPageUrl?: string;
    checkoutFormContent?: string;
  },
) {
  if (response.conversationId !== conversationId) {
    throw new Error("iyzico conversationId eşleşmiyor.");
  }

  if (!response.token) {
    throw new Error("iyzico ödeme token'ı eksik.");
  }

  await saveIyzicoCheckoutToken(
    attemptId,
    conversationId,
    response.token,
  );

  return {
    token: response.token,
    paymentPageUrl: response.paymentPageUrl ?? null,
    checkoutFormContent: response.checkoutFormContent ?? null,
  };
}

import { buildIyzicoCheckoutData } from "./iyzico-checkout-data";
import { initializeIyzicoCheckout } from "./iyzico-checkout-api";

export async function startIyzicoCheckout(
  orderId: string,
  resultAccessToken: string,
  identityNumber: string,
) {
  if (!resultAccessToken || resultAccessToken.length < 20) {
    throw new Error("Geçersiz sipariş erişim anahtarı.");
  }

  // `getClientIp()` proxy başlığı yoksa "unknown" döner (throw etmez) —
  // yerel geliştirmede checkout'u tamamen bloke eden durum buydu.
  // `resolvePaymentClientIp` production'da gerçek IP'yi ZORUNLU tutar,
  // diğer ortamlarda loopback'e düşer (bkz. src/lib/payment-client-ip.ts).
  const clientIp = await resolvePaymentClientIp();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.resultAccessToken !== resultAccessToken) {
    throw new Error("Sipariş bulunamadı veya erişim yetkisi yok.");
  }

  // Mutabakat `validateOrderForIyzico`dan ÖNCE çalışmalıdır: yarım kalmış bir
  // deneme siparişi `PAYMENT_PROCESSING`'de bıraktığında doğrulama onu
  // "ödemeye uygun değil" diye reddeder ve sipariş bir daha asla
  // kurtarılamazdı. Önce iyzico'ya sorup durumu netleştiriyoruz.
  const reconciled = await reconcilePendingIyzicoAttempts(order.id);

  if (reconciled.alreadyPaid) {
    throw new OrderAlreadyPaidError(reconciled.orderNumber);
  }

  const freshOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true },
  });

  if (!freshOrder) {
    throw new Error("Sipariş bulunamadı veya erişim yetkisi yok.");
  }

  validateOrderForIyzico(freshOrder);

  const reservations = await prisma.stockReservation.findMany({
    where: { orderId: freshOrder.id },
    select: {
      variantId: true,
      quantity: true,
      status: true,
      expiresAt: true,
    },
  });

  const now = new Date();

  if (
    reservations.length === 0 ||
    reservations.some(
      (reservation) =>
        reservation.status !== "ACTIVE" ||
        reservation.expiresAt <= now,
    )
  ) {
    throw new Error(
      "Siparişin stok rezervasyonu geçersiz veya süresi dolmuş. Lütfen yeniden sipariş oluşturun.",
    );
  }

  const reservedQuantities = new Map<string, number>();

  for (const reservation of reservations) {
    reservedQuantities.set(
      reservation.variantId,
      (reservedQuantities.get(reservation.variantId) ?? 0) +
        reservation.quantity,
    );
  }

  const orderedQuantities = new Map<string, number>();

  for (const item of freshOrder.items) {
    if (!item.variantId) {
      throw new Error(
        "Siparişte varyant bilgisi eksik. Ödeme başlatılamaz.",
      );
    }

    orderedQuantities.set(
      item.variantId,
      (orderedQuantities.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  if (
    reservedQuantities.size !== orderedQuantities.size ||
    [...orderedQuantities].some(
      ([variantId, quantity]) =>
        reservedQuantities.get(variantId) !== quantity,
    )
  ) {
    throw new Error("Sipariş ürünleri ile stok rezervasyonları eşleşmiyor.");
  }

  const checkoutData = buildIyzicoCheckoutData(freshOrder, clientIp, identityNumber);

  // Callback ve sipariş kesinleştirme test edilene kadar ödeme kapalı.
  if (process.env.IYZICO_CHECKOUT_ENABLED !== "true") {
    throw new Error("iyzico ödeme başlatma henüz etkinleştirilmedi.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("Site adresi yapılandırılmamış.");
  }

  const origin = new URL(siteUrl);
  if (origin.protocol !== "https:") {
    throw new Error("iyzico callback için HTTPS adresi gerekli.");
  }

  const attempt = await createIyzicoPaymentAttempt(freshOrder.id);

  // `createIyzicoPaymentAttempt` siparişi ZATEN `PAYMENT_PROCESSING`'e aldı.
  // Buradan sonra atılan her hata, temizlenmezse siparişi kalıcı olarak o
  // durumda bırakır: yeni deneme `validateOrderForIyzico`ya takılır, stok
  // rezervasyonu asla çözülmez ve müşteri aynı hatayı sonsuza dek görür.
  let response;

  try {
    response = await initializeIyzicoCheckout({
      locale: "tr",
      conversationId: attempt.conversationId,
      price: checkoutData.price,
      paidPrice: checkoutData.paidPrice,
      currency: "TRY",
      basketId: freshOrder.id,
      paymentGroup: "PRODUCT",
      callbackUrl: new URL(
        "/api/payments/iyzico/callback",
        origin,
      ).toString(),
      buyer: checkoutData.buyer,
      shippingAddress: checkoutData.shippingAddress,
      billingAddress: checkoutData.billingAddress,
      basketItems: checkoutData.basketItems,
    });
  } catch (error) {
    // iyzico ödeme formunu HİÇ oluşturmadı → tahsilat riski yok, deneme
    // güvenle FAILED yapılır ve sipariş `PAYMENT_FAILED` ile tekrar
    // denenebilir hale gelir. Stok rezervasyonu KASITLI olarak korunur.
    await failIyzicoPaymentAttempt(
      attempt.attemptId,
      error instanceof Error ? error.message : "iyzico ödeme formu başlatılamadı.",
    );
    throw error;
  }

  try {
    return await completeIyzicoCheckoutInitialization(
      attempt.attemptId,
      attempt.conversationId,
      response,
    );
  } catch (error) {
    // Form oluştu ama token kaydedilemedi. `failIyzicoPaymentAttempt`
    // yalnızca `providerToken === null` iken FAILED yapar; token yazılmışsa
    // deneme INITIATED kalır ve callback/mutabakat yolu onu kesinleştirir —
    // yani bu dal asla ödenmiş bir tahsilatı kaybetmez.
    await failIyzicoPaymentAttempt(
      attempt.attemptId,
      error instanceof Error ? error.message : "iyzico ödeme formu doğrulanamadı.",
    );
    throw error;
  }
}
