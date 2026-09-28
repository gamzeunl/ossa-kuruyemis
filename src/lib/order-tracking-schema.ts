import { z } from "zod";

/**
 * Public sipariş takibi formu — yalnızca UX doğrulaması. Gerçek eşleştirme
 * (`orderNumber` + e-posta/telefon) her zaman sunucuda,
 * `order-tracking-service.ts` içinde yeniden yapılır; buradaki doğrulama
 * hiçbir güvenlik kararı vermez, yalnızca boş/aşırı uzun girdiyi eler.
 */
export const orderTrackingSchema = z.object({
  orderNumber: z.string().trim().min(1, "Sipariş numarası zorunludur.").max(40),
  contact: z.string().trim().min(1, "E-posta veya telefon zorunludur.").max(150),
});

export type OrderTrackingInput = z.infer<typeof orderTrackingSchema>;
