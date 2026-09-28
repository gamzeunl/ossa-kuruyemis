import { createHash } from "node:crypto";
import type { InvoiceType } from "@/generated/prisma/client";

export interface OrderFingerprintItem {
  variantId: string;
  quantity: number;
}

export interface OrderFingerprintAddress {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  addressLabel: string;
}

export type OrderFingerprintInvoice =
  | { invoiceType: Extract<InvoiceType, "INDIVIDUAL"> }
  | {
      invoiceType: Extract<InvoiceType, "CORPORATE">;
      companyName: string;
      taxOffice: string;
      taxNumber: string;
    };

export interface OrderFingerprintInput {
  /** Girişliyse `userId`, misafirse checkout e-postası — kimlik ayırt edicisi. */
  identityKey: string;
  items: OrderFingerprintItem[];
  address: OrderFingerprintAddress;
  billingAddress: OrderFingerprintAddress;
  invoice: OrderFingerprintInvoice;
}

/**
 * Bir sipariş isteğinin sunucuda DOĞRULANMIŞ verilerden hesaplanan parmak
 * izi — aynı `idempotencyKey`'in farklı sepet/adres içeriğiyle yeniden
 * kullanılıp kullanılmadığını tespit etmek için. Fiyat/toplam hiçbir zaman
 * bu hesaba dahil edilmez (client'tan gelen hiçbir para değeri kullanılmaz).
 * Kalemler `variantId`'ye göre sıralanır ki sepetteki sıralama farkı farklı
 * bir fingerprint üretmesin.
 */
export function computeOrderFingerprint(input: OrderFingerprintInput): string {
  const sortedItems = [...input.items]
    .sort((a, b) => a.variantId.localeCompare(b.variantId))
    .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));

  const payload = JSON.stringify({
    identityKey: input.identityKey,
    items: sortedItems,
    address: input.address,
    billingAddress: input.billingAddress,
    invoice: input.invoice,
  });

  return createHash("sha256").update(payload).digest("hex");
}
