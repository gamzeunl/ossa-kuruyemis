import { z } from "zod";

/**
 * Ürün yorumu gönderim formunun tek doğrulama kaynağı — hem client (hızlı geri
 * bildirim) hem server action (yetkili doğrulama) aynı şemayı kullanır.
 * `productId`/`userId` bilinçli olarak bu şemada YOK — `productId` ayrı
 * doğrulanır (ürünün var/yayında olduğu DB'den kontrol edilir), `userId` hiçbir
 * zaman client'tan alınmaz, oturumdan gelir (bkz. `src/actions/reviews.ts`).
 */
export const reviewFormSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.coerce.number().int("Puan 1-5 arasında bir tam sayı olmalı.").min(1).max(5),
  title: z.string().trim().max(120, "Başlık en fazla 120 karakter olabilir.").optional(),
  content: z
    .string()
    .trim()
    .min(10, "Yorumunuzu en az 10 karakter yazın.")
    .max(2000, "Yorum en fazla 2000 karakter olabilir."),
  displayName: z
    .string()
    .trim()
    .min(1, "Görünen ad zorunludur.")
    .max(80, "Görünen ad en fazla 80 karakter olabilir."),
  /** Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz. */
  website: z.string(),
});

export type ReviewFormSchema = z.infer<typeof reviewFormSchema>;
