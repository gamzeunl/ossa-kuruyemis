import type { CategorySummary } from "@/types/catalog";

/**
 * Bazı kategorilerin veritabanı adı ("Kampanyalı Paketler") müşteri arayüzünde
 * farklı bir etiketle gösterilir. Slug ve veritabanı kaydı değişmez — yalnızca
 * görünen metin burada eşlenir.
 */
const CATEGORY_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  "kampanyali-paketler": "Özel Paketler",
};

/**
 * Aynı mantık, kategori açıklaması için — `kampanyali-paketler`'in veritabanı
 * açıklaması "indirimli" ifadesi içerdiğinden müşteri arayüzünde başka bir
 * metinle gösterilir. Slug ve veritabanı kaydı değişmez.
 */
const CATEGORY_DISPLAY_DESCRIPTION_OVERRIDES: Record<string, string> = {
  "kampanyali-paketler": "Özenle seçilmiş ürünlerden oluşan özel paketler.",
};

export function getCategoryDisplayName(category: Pick<CategorySummary, "slug" | "name">): string {
  return CATEGORY_DISPLAY_NAME_OVERRIDES[category.slug] ?? category.name;
}

export function getCategoryDisplayDescription(
  category: Pick<CategorySummary, "slug" | "description">,
): string | null {
  return CATEGORY_DISPLAY_DESCRIPTION_OVERRIDES[category.slug] ?? category.description;
}
