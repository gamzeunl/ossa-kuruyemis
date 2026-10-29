import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { IyzicoPaymentResult } from "./iyzico-checkout-retrieve";
import { verifyIyzicoCheckoutSignature } from "./iyzico-signature";

type ExpectedPayment = {
  conversationId: string;
  token: string;
  amount: Prisma.Decimal;
  currency: string;
  basketId: string;
  secretKey: string;
};

export function verifyIyzicoPayment(
  result: IyzicoPaymentResult,
  expected: ExpectedPayment,
): string {
  verifyIyzicoCheckoutSignature(result, expected.secretKey);

  if (result.basketId !== expected.basketId) {
    throw new Error("iyzico sepet kimliği siparişle eşleşmiyor.");
  }

  if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
    throw new Error("iyzico ödemeyi başarılı olarak doğrulamadı.");
  }

  if (!result.conversationId || result.conversationId !== expected.conversationId) {
    throw new Error("iyzico işlem kimliği eşleşmiyor.");
  }

  if (!result.token || result.token !== expected.token) {
    throw new Error("iyzico ödeme token'ı eşleşmiyor.");
  }

  if (result.currency !== expected.currency || expected.currency !== "TRY") {
    throw new Error("iyzico ödeme para birimi eşleşmiyor.");
  }

  if (result.paidPrice === undefined || result.paidPrice === null) {
    throw new Error("iyzico ödeme tutarı eksik.");
  }

  let paidPrice: Prisma.Decimal;

  try {
    paidPrice = new Prisma.Decimal(result.paidPrice);
  } catch {
    throw new Error("iyzico geçersiz ödeme tutarı döndürdü.");
  }

  if (!paidPrice.equals(expected.amount)) {
    throw new Error("iyzico tahsilat tutarı siparişle eşleşmiyor.");
  }

  if (result.price === undefined || result.price === null) {
    throw new Error("iyzico sepet tutarı eksik.");
  }

  let basketPrice: Prisma.Decimal;

  try {
    basketPrice = new Prisma.Decimal(result.price);
  } catch {
    throw new Error("iyzico geçersiz sepet tutarı döndürdü.");
  }

  if (!basketPrice.equals(expected.amount)) {
    throw new Error("iyzico sepet tutarı siparişle eşleşmiyor.");
  }

  if (!result.paymentId || !String(result.paymentId).trim()) {
    throw new Error("iyzico ödeme kimliği eksik.");
  }

  return String(result.paymentId);
}
