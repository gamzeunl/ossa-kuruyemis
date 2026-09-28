import { z } from "zod";
import { ProductStatus } from "@/generated/prisma/client";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Fiyat/indirim alanları burada yalnızca "boş değil" olarak doğrulanır — sayısal/çapraz-alan kuralları `validateVariantPriceInput` içindedir (bkz. `product-pricing.ts`). */
export const productVariantFormSchema = z.object({
  name: z.string().trim().min(1, "Varyant adı zorunludur.").max(120, "Varyant adı en fazla 120 karakter olabilir."),
  sku: z.string().trim().min(1, "SKU zorunludur.").max(64, "SKU en fazla 64 karakter olabilir."),
  weightGram: z.string().trim().optional(),
  price: z.string().trim().min(1, "Normal fiyat zorunludur."),
  discountPrice: z.string().trim().optional(),
  discountStartsAt: z.string().trim().optional(),
  discountEndsAt: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type ProductVariantFormSchema = z.infer<typeof productVariantFormSchema>;

/** Ürün oluşturma formunun tek doğrulama kaynağı (yönetim). `isRecommended`/`newBadgeOverride` burada YOK — mevcut update-action deseniyle aynı şekilde Zod dışında okunur. */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Ürün adı zorunludur.").max(200, "Ürün adı en fazla 200 karakter olabilir."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug zorunludur.")
    .max(200)
    .regex(slugPattern, "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. kavrulmus-findik)."),
  shortDescription: z.string().trim().max(300, "Kısa açıklama en fazla 300 karakter olabilir.").optional(),
  description: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, "Kategori seçilmelidir."),
  status: z.enum(ProductStatus),
  metaTitle: z.string().trim().max(200).optional(),
  metaDescription: z.string().trim().max(300).optional(),
  variants: z.array(productVariantFormSchema).min(1, "En az bir varyant eklemelisiniz."),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;

/**
 * Ürün DÜZENLEME formunun (`/yonetim/urunler/[id]`) temel alan doğrulaması —
 * varyantlar `productVariantFormSchema` ile satır satır ayrıca doğrulanır
 * (bkz. `admin-products.ts::parseUpdateVariantRow`), burada TEKRAR edilmez.
 */
export const productUpdateFormSchema = z.object({
  name: z.string().trim().min(1, "Ürün adı zorunludur.").max(200, "Ürün adı en fazla 200 karakter olabilir."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug zorunludur.")
    .max(200)
    .regex(slugPattern, "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. kavrulmus-findik)."),
  categoryId: z.string().trim().min(1, "Kategori seçilmelidir."),
  status: z.enum(ProductStatus),
  metaTitle: z.string().trim().max(200, "Meta başlık en fazla 200 karakter olabilir.").optional(),
  metaDescription: z.string().trim().max(300, "Meta açıklama en fazla 300 karakter olabilir.").optional(),
});

export type ProductUpdateFormSchema = z.infer<typeof productUpdateFormSchema>;
