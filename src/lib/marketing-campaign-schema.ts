import { z } from "zod";

/**
 * Kampanya formunun YAPISAL doğrulama kaynağı — `bundle-offer-schema.ts`/
 * `featured-pick-schema.ts` ile aynı desen. `startsAt`/`endsAt` (görevin
 * "gerçek başlangıç ve bitiş tarihi olsun" isteği gereği) BURADA zorunludur —
 * diğer iki formdan farkı bu. `isActive`/`showOnHomepage`/`showPopup`
 * checkbox'ları, mevcut banner/featured-pick deseninde olduğu gibi Zod
 * dışında (`formData.get(...) === "on"`) ele alınır. Seçilen varyantlar
 * (`variantIds`) ayrı, dizi bazlı bir alandır — en az 1 varyant zorunludur.
 */
export const marketingCampaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Kampanya adı zorunludur.").max(160),
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY"], { message: "Geçerli bir kampanya türü seçin." }),
    startsAt: z.string().trim().min(1, "Başlangıç tarihi zorunludur."),
    endsAt: z.string().trim().min(1, "Bitiş tarihi zorunludur."),
    headline: z.string().trim().max(200).optional(),
    description: z.string().trim().max(500).optional(),
    sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
    variantIds: z.array(z.string().trim().min(1)).min(1, "En az bir ürün/varyant seçmelisiniz."),
  })
  .refine((data) => new Date(data.startsAt) < new Date(data.endsAt), {
    message: "Bitiş tarihi başlangıç tarihinden sonra olmalı.",
    path: ["endsAt"],
  });

export type MarketingCampaignFormSchema = z.infer<typeof marketingCampaignFormSchema>;
