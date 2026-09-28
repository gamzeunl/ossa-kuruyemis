import { z } from "zod";

/** Etkinlik kartı (Kına/Düğün) formunun tek doğrulama kaynağı. `isActive` ve görsel dosyası action içinde ele alınır. */
export const eventCardFormSchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunludur.").max(120, "Başlık en fazla 120 karakter olabilir."),
  description: z
    .string()
    .trim()
    .min(1, "Açıklama zorunludur.")
    .max(400, "Açıklama en fazla 400 karakter olabilir."),
  buttonLabel: z.string().trim().min(1, "Buton metni zorunludur.").max(60, "Buton metni en fazla 60 karakter olabilir."),
  buttonHref: z.string().trim().min(1, "Buton linki zorunludur.").max(500, "Buton linki en fazla 500 karakter olabilir."),
  imageAlt: z.string().trim().max(200, "Alt metin en fazla 200 karakter olabilir.").optional(),
  sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
});

export type EventCardFormSchema = z.infer<typeof eventCardFormSchema>;
