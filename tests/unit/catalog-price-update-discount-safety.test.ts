/**
 * "Katalog fiyat güncelleme" görevinin indirim güvenliği testi — yeni
 * `ProductVariant.price` değerlerinin, mevcut aktif indirimleri GEÇERSİZ
 * hâle getirmediğini `validateVariantDiscountUpdate`/`resolveVariantPricing`
 * (TEK gerçek kaynak, `@/lib/product-pricing`) ile doğrular. Yeni bir indirim
 * algoritması YAZILMAZ — yalnızca mevcut kural gerçek senaryoya uygulanır.
 * Gerçek dünya örneği: Çiğ badem / 1 kg — eski price=457.9, discountPrice=400,
 * yeni gerçek fiyat 750 (bkz. `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md` §5).
 */
import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { resolveVariantPricing, validateVariantDiscountUpdate } from "@/lib/product-pricing";

describe("Fiyat güncellemesi sonrası indirim geçerliliği (Çiğ badem / 1 kg senaryosu)", () => {
  it("yeni fiyat (750) eski indirimli fiyattan (400) büyük olduğundan indirim GEÇERLİ kalır", () => {
    const newPrice = new Prisma.Decimal("750.00");
    const existingDiscountPrice = "400.00";

    const validation = validateVariantDiscountUpdate(newPrice, {
      discountPrice: existingDiscountPrice,
      discountStartsAt: null,
      discountEndsAt: null,
      isDiscountActive: true,
    });

    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.discountPrice?.toString()).toBe("400");
    }
  });

  it("resolveVariantPricing yeni fiyatla birlikte hâlâ indirimli fiyatı (400) müşteriye gösterir", () => {
    const pricing = resolveVariantPricing({
      price: new Prisma.Decimal("750.00"),
      discountPrice: new Prisma.Decimal("400.00"),
      discountStartsAt: null,
      discountEndsAt: null,
      isDiscountActive: true,
    });

    expect(pricing.hasActiveDiscount).toBe(true);
    expect(pricing.effectivePrice.toString()).toBe("400");
    expect(pricing.regularPrice.toString()).toBe("750");
  });

  it("KARŞI ÖRNEK: yeni fiyat indirimli fiyattan düşük/eşit olsaydı doğrulama reddederdi (geçersiz indirim bırakılmaz)", () => {
    // Gerçek katalog güncellemesinde bu durum oluşmadı (bkz. yukarıdaki gerçek
    // senaryo), ama kuralın kendisinin genel olarak koruma sağladığını kanıtlar —
    // ör. yeni fiyat yanlışlıkla indirimli fiyatın altına düşseydi.
    const newPrice = new Prisma.Decimal("350.00");
    const validation = validateVariantDiscountUpdate(newPrice, {
      discountPrice: "400.00",
      discountStartsAt: null,
      discountEndsAt: null,
      isDiscountActive: true,
    });

    expect(validation.ok).toBe(false);
  });
});
