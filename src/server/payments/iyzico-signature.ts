import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";

type SignedCheckoutResult = {
  signature?: string;
  paymentStatus?: string;
  paymentId?: string;
  currency?: string;
  basketId?: string;
  conversationId?: string;
  paidPrice?: string | number;
  price?: string | number;
  token?: string;
};

function normalizePrice(value: string | number): string {
  const decimal = new Prisma.Decimal(value);

  if (!decimal.isFinite() || decimal.isNegative()) {
    throw new Error("Geçersiz iyzico tutarı.");
  }

  return decimal.toString();
}

export function verifyIyzicoCheckoutSignature(
  result: SignedCheckoutResult,
  secretKey: string,
): void {
  if (!secretKey || !result.signature || !/^[a-fA-F0-9]{64}$/.test(result.signature)) {
    throw new Error("iyzico imzası eksik veya geçersiz.");
  }

  const fields = [
    result.paymentStatus,
    result.paymentId,
    result.currency,
    result.basketId,
    result.conversationId,
    result.token,
  ];

  if (
    fields.some((value) => typeof value !== "string" || !value.trim()) ||
    result.paidPrice == null ||
    result.price == null
  ) {
    throw new Error("iyzico imza alanları eksik.");
  }

  const payload = [
    result.paymentStatus,
    result.paymentId,
    result.currency,
    result.basketId,
    result.conversationId,
    normalizePrice(result.paidPrice),
    normalizePrice(result.price),
    result.token,
  ].join(":");

  const calculated = createHmac("sha256", secretKey)
    .update(payload)
    .digest();

  const received = Buffer.from(result.signature, "hex");

  if (
    received.length !== calculated.length ||
    !timingSafeEqual(received, calculated)
  ) {
    throw new Error("iyzico ödeme yanıtının imzası doğrulanamadı.");
  }
}
