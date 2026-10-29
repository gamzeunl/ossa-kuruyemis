import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";
import { validateIyzicoAmount } from "./iyzico-amount";

type CheckoutOrder = {
  id: string;
  orderNumber: string;
  email: string;
  phone: string;
  currency: string;
  grandTotal: Prisma.Decimal;
  shippingTotal: Prisma.Decimal | null;
  items: {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    lineTotal: Prisma.Decimal;
  }[];
  shippingAddressSnapshot: Prisma.JsonValue;
  billingAddressSnapshot: Prisma.JsonValue;
};

export function buildIyzicoCheckoutData(
  order: CheckoutOrder,
  clientIp: string,
  identityNumber: string,
) {
  if (!clientIp || clientIp === "unknown") {
    throw new Error("Geçerli müşteri IP adresi gerekli.");
  }
  if (order.currency !== "TRY") {
    throw new Error("iyzico için yalnızca TRY destekleniyor.");
  }

  if (!/^\d{11}$/.test(identityNumber)) {
    throw new Error("Geçerli bir T.C. kimlik numarası gereklidir.");
  }

  const paidPrice = validateIyzicoAmount(order);

  if (!order.email.trim() || !order.phone.trim()) {
    throw new Error("Ödeme için müşteri iletişim bilgileri eksik.");
  }

  const shipping = parseOrderAddressSnapshot(
    order.shippingAddressSnapshot,
  );
  const billing = parseOrderAddressSnapshot(
    order.billingAddressSnapshot,
  );

  if (!shipping || !billing) {
    throw new Error("Sipariş adres bilgileri geçersiz.");
  }

  if (order.items.length === 0) {
    throw new Error("Siparişte ürün bulunamadı.");
  }

  const basketItems = order.items.map((item) => {
    if (item.quantity <= 0 || item.lineTotal.lte(0)) {
      throw new Error("Siparişte geçersiz ürün tutarı var.");
    }

    return {
      id: item.id,
      name: `${item.productName} ${item.variantName}`.trim(),
      category1: "Kuruyemiş",
      itemType: "PHYSICAL",
      price: item.lineTotal.toFixed(2),
    };
  });

  if (order.shippingTotal && order.shippingTotal.gt(0)) {
    basketItems.push({
      id: `shipping-${order.id}`,
      name: "Kargo hizmeti",
      category1: "Kargo",
      itemType: "VIRTUAL",
      price: order.shippingTotal.toFixed(2),
    });
  }

  const price = basketItems
    .reduce(
      (sum, item) => sum.add(new Prisma.Decimal(item.price)),
      new Prisma.Decimal(0),
    )
    .toFixed(2);

  if (price !== paidPrice) {
    throw new Error("iyzico sepet toplamı tahsilat tutarıyla eşleşmiyor.");
  }

  return {
    paidPrice,
    price,
    basketItems,
    buyer: {
      id: order.id,
      name: billing.firstName,
      surname: billing.lastName,
      gsmNumber: order.phone,
      email: order.email,
      identityNumber,
      ip: clientIp,
      registrationAddress: billing.addressLine,
      city: billing.city,
      country: "Turkey",
    },
    shippingAddress: {
      contactName: `${shipping.firstName} ${shipping.lastName}`,
      city: shipping.city,
      country: "Turkey",
      address: [
        shipping.neighborhood,
        shipping.addressLine,
        shipping.district,
      ].filter(Boolean).join(", "),
    },
    billingAddress: {
      contactName: `${billing.firstName} ${billing.lastName}`,
      city: billing.city,
      country: "Turkey",
      address: [
        billing.neighborhood,
        billing.addressLine,
        billing.district,
      ].filter(Boolean).join(", "),
    },
  };
}
