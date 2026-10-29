import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { validateIyzicoAmount } from "./iyzico-amount";

type CheckoutOrder = {
  status: string;
  totalStatus: string;
  currency: string;
  grandTotal: Prisma.Decimal;
  shippingTotal: Prisma.Decimal | null;
  items: {
    lineTotal: Prisma.Decimal;
  }[];
};

export function validateOrderForIyzico(order: CheckoutOrder) {
  if (
    order.status !== "PENDING" &&
    order.status !== "PAYMENT_FAILED"
  ) {
    throw new Error("Bu sipariş ödeme başlatmaya uygun değil.");
  }

  if (order.totalStatus !== "FINAL") {
    throw new Error("Siparişin toplam tutarı henüz kesinleşmedi.");
  }

  if (order.currency !== "TRY") {
    throw new Error("Yalnızca Türk lirası ile ödeme yapılabilir.");
  }

  return validateIyzicoAmount(order);
}
