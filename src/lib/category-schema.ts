import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Kategori formunun tek doğrulama kaynağı (yönetim). `isActive` mevcut admin-form desenleriyle aynı şekilde Zod dışında okunur. */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Kategori adı zorunludur.").max(120, "Kategori adı en fazla 120 karakter olabilir."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug zorunludur.")
    .max(160)
    .regex(slugPattern, "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. kuru-meyveler)."),
  description: z.string().trim().max(500, "Açıklama en fazla 500 karakter olabilir.").optional(),
  imageAlt: z.string().trim().max(200, "Alt metin en fazla 200 karakter olabilir.").optional(),
  sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
});

export type CategoryFormSchema = z.infer<typeof categoryFormSchema>;
