import { z } from "zod";

/**
 * `Order.shippingAddressSnapshot`/`billingAddressSnapshot` (Json) alanının
 * beklenen şekli — sipariş oluşturulduğu andaki teslimat bilgilerinin
 * değişmez kopyası. JSON alanı Prisma tarafında tipsiz olduğundan okuma
 * noktasında (admin liste/detay, müşteri sonuç sayfaları) bu şema ile
 * doğrulanır; beklenmeyen şekilde `null` döner (asla `any` ile geçilmez).
 */
export const orderAddressSnapshotSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  city: z.string(),
  district: z.string(),
  neighborhood: z.string(),
  addressLine: z.string(),
  addressLabel: z.string(),
});

export type OrderAddressSnapshot = z.infer<typeof orderAddressSnapshotSchema>;

export function parseOrderAddressSnapshot(value: unknown): OrderAddressSnapshot | null {
  const result = orderAddressSnapshotSchema.safeParse(value);
  return result.success ? result.data : null;
}
