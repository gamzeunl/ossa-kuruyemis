import { z } from "zod";

export const HOMEPAGE_SELECTION_MAX_PRODUCTS = 4;

/** "OSSA'dan Seçtiklerimiz" formunun tek doğrulama kaynağı. `isActive`, kapak görseli ve ürün seçimleri action içinde ayrıca ele alınır. */
export const homepageSelectionFormSchema = z.object({
  eyebrow: z.string().trim().max(60, "Üst etiket en fazla 60 karakter olabilir.").optional(),
  title: z.string().trim().min(1, "Başlık zorunludur.").max(120, "Başlık en fazla 120 karakter olabilir."),
  description: z.string().trim().max(400, "Açıklama en fazla 400 karakter olabilir.").optional(),
  ctaLabel: z.string().trim().min(1, "Buton metni zorunludur.").max(60, "Buton metni en fazla 60 karakter olabilir."),
  ctaHref: z.string().trim().min(1, "Buton linki zorunludur.").max(500, "Buton linki en fazla 500 karakter olabilir."),
  imageAlt: z.string().trim().max(200, "Alt metin en fazla 200 karakter olabilir.").optional(),
});

export type HomepageSelectionFormSchema = z.infer<typeof homepageSelectionFormSchema>;
