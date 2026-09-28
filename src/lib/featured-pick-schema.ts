import { z } from "zod";

/** "Ayın Favorileri" (editoryal ürün seçkisi) formunun doğrulama kaynağı. `isActive` checkbox, banner deseninde olduğu gibi Zod dışında ele alınır. */
export const featuredPickFormSchema = z
  .object({
    productId: z.string().trim().min(1, "Ürün seçmelisiniz."),
    sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) {
        return true;
      }
      return new Date(data.startsAt) <= new Date(data.endsAt);
    },
    { message: "Bitiş tarihi başlangıç tarihinden önce olamaz.", path: ["endsAt"] },
  );

export type FeaturedPickFormSchema = z.infer<typeof featuredPickFormSchema>;
