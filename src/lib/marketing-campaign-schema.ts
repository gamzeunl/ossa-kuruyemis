
import { z } from "zod";

export const marketingCampaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Kampanya adı zorunludur.").max(160),

    type: z.enum(["DAILY", "WEEKLY", "MONTHLY"], {
      message: "Geçerli bir kampanya türü seçin.",
    }),

    startsAt: z.string().trim().min(1, "Başlangıç tarihi zorunludur."),

    endsAt: z.string().trim().min(1, "Bitiş tarihi zorunludur."),

    headline: z.string().trim().max(200).optional(),

    description: z.string().trim().max(500).optional(),

    sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),

    variantIds: z
      .array(z.string().trim().min(1))
      .min(1, "En az bir ürün/varyant seçmelisiniz."),

    campaignPrices: z.record(z.string(), z.string()).default({}),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start >= end
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Bitiş tarihi başlangıç tarihinden sonra olmalı.",
        path: ["endsAt"],
      });
    }

    if (new Set(data.variantIds).size !== data.variantIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Aynı ürün/varyant birden fazla seçilemez.",
        path: ["variantIds"],
      });
    }

    for (const variantId of data.variantIds) {
      const rawPrice = data.campaignPrices[variantId]?.trim();

      if (!rawPrice) {
        ctx.addIssue({
          code: "custom",
          message: "Seçilen her ürün/varyant için kampanyalı fiyat girilmelidir.",
          path: ["campaignPrices", variantId],
        });
        continue;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(rawPrice)) {
        ctx.addIssue({
          code: "custom",
          message: "Kampanyalı fiyat geçerli bir tutar olmalıdır.",
          path: ["campaignPrices", variantId],
        });
        continue;
      }

      const price = Number(rawPrice);

      if (!Number.isFinite(price) || price <= 0 || price > 9999999999.99) {
        ctx.addIssue({
          code: "custom",
          message: "Kampanyalı fiyat sıfırdan büyük ve geçerli bir tutar olmalıdır.",
          path: ["campaignPrices", variantId],
        });
      }
    }
  });

export type MarketingCampaignFormSchema = z.infer<
  typeof marketingCampaignFormSchema
>;
