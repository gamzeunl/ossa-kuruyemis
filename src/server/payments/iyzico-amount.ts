import "server-only";

import { Prisma } from "@/generated/prisma/client";

type PaymentAmounts = {
  grandTotal: Prisma.Decimal;
  shippingTotal: Prisma.Decimal | null;
  items: {
    lineTotal: Prisma.Decimal;
  }[];
};

export function validateIyzicoAmount(order: PaymentAmounts): string {
  if (order.shippingTotal === null) {
    throw new Error("Kargo ücreti henüz kesinleşmemiş.");
  }

  const itemsTotal = order.items.reduce(
    (total, item) => total.add(item.lineTotal),
    new Prisma.Decimal(0),
  );

  const expectedTotal = itemsTotal.add(order.shippingTotal);

  if (!expectedTotal.equals(order.grandTotal)) {
    throw new Error("Sipariş toplamı ile ürün ve kargo tutarları eşleşmiyor.");
  }

  if (order.grandTotal.lte(0)) {
    throw new Error("Ödeme tutarı sıfırdan büyük olmalıdır.");
  }

  return order.grandTotal.toFixed(2);
}
