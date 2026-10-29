import { Prisma } from "@/generated/prisma/client";

/**
 * Gerçek indirim hesaplamasının TEK kaynağı. Ürün kartı, ürün detayı ve
 * (ileride) sipariş oluşturma akışı fiyatı doğrudan `ProductVariant.price`'tan
 * okumak yerine bu fonksiyonu çağırmalı — böylece "indirim aktif mi" mantığı
 * (tarih aralığı + admin anahtarı + fiyat geçerliliği) tek yerde yaşar.
 */
export interface VariantPricingInput {
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
  isDiscountActive: boolean;
}

export interface ResolvedVariantPricing {
  /** Normal/liste fiyatı — her zaman dolu, indirim olsun olmasın `ProductVariant.price`. */
  regularPrice: Prisma.Decimal;
  /** Müşterinin şu an ödeyeceği fiyat — aktif indirim varsa indirimli fiyat, yoksa `regularPrice` ile aynı. */
  effectivePrice: Prisma.Decimal;
  /** Yalnızca aktif bir indirim varken dolu — üstü çizili gösterim için. */
  discountPrice: Prisma.Decimal | null;
  /** Yalnızca aktif bir indirim varken dolu — her zaman gerçek fiyatlardan hesaplanır, elle girilmez. */
  discountPercentage: number | null;
  hasActiveDiscount: boolean;
}

function isDiscountCurrentlyValid(variant: VariantPricingInput, now: Date): boolean {
  if (!variant.isDiscountActive || variant.discountPrice === null) {
    return false;
  }
  if (!variant.discountPrice.greaterThan(0)) {
    return false;
  }
  if (!variant.discountPrice.lessThan(variant.price)) {
    return false;
  }
  if (variant.discountStartsAt && now < variant.discountStartsAt) {
    return false;
  }
  if (variant.discountEndsAt && now > variant.discountEndsAt) {
    return false;
  }
  return true;
}

export function resolveVariantPricing(
  variant: VariantPricingInput,
  now: Date = new Date(),
): ResolvedVariantPricing {
  if (!isDiscountCurrentlyValid(variant, now) || variant.discountPrice === null) {
    return {
      regularPrice: variant.price,
      effectivePrice: variant.price,
      discountPrice: null,
      discountPercentage: null,
      hasActiveDiscount: false,
    };
  }

  // Yüzde yalnızca EKRAN gösterimi için Number'a çevrilir (bkz. format-money.ts'teki
  // aynı desen) — karşılaştırma/doğrulama her zaman Decimal ile yukarıda yapıldı.
  const discountPercentage = Math.round(
    (1 - variant.discountPrice.toNumber() / variant.price.toNumber()) * 100,
  );

  return {
    regularPrice: variant.price,
    effectivePrice: variant.discountPrice,
    discountPrice: variant.discountPrice,
    discountPercentage,
    hasActiveDiscount: true,
  };
}

export interface VariantPriceRawInput {
  /** Form'dan ham metin — henüz sayıya çevrilmemiş. */
  price: string;
  discountPrice: string | null;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
}

export type VariantPriceValidationResult =
  | { ok: true; price: Prisma.Decimal; discountPrice: Prisma.Decimal | null }
  | { ok: false; message: string };

/**
 * Ürün OLUŞTURMA akışındaki fiyat/indirim doğrulaması — `admin-products.ts`'in
 * mevcut UPDATE akışındaki inline mantığın (bkz. `updateProductAdminAction`)
 * saf/test edilebilir hâli. UPDATE'ten farkı: orada normal fiyat DB'den
 * okunan güvenilir bir değer, burada ise formdan yeni giriliyor — bu yüzden
 * hem `price` hem `discountPrice` birlikte doğrulanır.
 */
export function validateVariantPriceInput(input: VariantPriceRawInput): VariantPriceValidationResult {
  const priceNumber = Number(input.price);
  if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
    return { ok: false, message: "Normal fiyat pozitif bir sayı olmalı." };
  }
  const price = new Prisma.Decimal(input.price);

  let discountPrice: Prisma.Decimal | null = null;
  if (input.discountPrice) {
    const discountNumber = Number(input.discountPrice);
    if (!Number.isFinite(discountNumber) || discountNumber <= 0) {
      return { ok: false, message: "İndirimli fiyat pozitif bir sayı olmalı." };
    }
    discountPrice = new Prisma.Decimal(input.discountPrice);
    if (!discountPrice.lessThan(price)) {
      return { ok: false, message: "İndirimli fiyat normal fiyattan düşük olmalı." };
    }
  }

  if (input.discountStartsAt && input.discountEndsAt && input.discountStartsAt > input.discountEndsAt) {
    return { ok: false, message: "İndirim başlangıç tarihi bitişten sonra olamaz." };
  }

  return { ok: true, price, discountPrice };
}

export interface VariantDiscountRawInput {
  /** Form'dan ham metin — boşsa indirim yok demektir. */
  discountPrice: string;
  isDiscountActive: boolean;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
}

export type VariantDiscountValidationResult =
  | { ok: true; discountPrice: Prisma.Decimal | null }
  | { ok: false; message: string };

/**
 * Normal fiyatın GÜVENİLİR bir kaynaktan (DB'den okunmuş `ProductVariant.price`)
 * geldiği durumlarda indirim alanlarını doğrular — `/yonetim/urunler/[id]` (tüm
 * varyantlar) ve `/yonetim/kampanyalar/haftanin-firsatlari` (tek varyant)
 * ekranlarının PAYLAŞTIĞI TEK doğrulama kaynağı. `validateVariantPriceInput`'tan
 * farkı: orada normal fiyat da formdan gelir (ürün oluşturma), burada zaten
 * DB'den okunmuş bir `Decimal` olarak verilir.
 */
export function validateVariantDiscountUpdate(
  price: Prisma.Decimal,
  input: VariantDiscountRawInput,
): VariantDiscountValidationResult {
  let discountPrice: Prisma.Decimal | null = null;
  if (input.discountPrice) {
    const parsedNumber = Number(input.discountPrice);
    if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) {
      return { ok: false, message: "İndirimli fiyat pozitif bir sayı olmalı." };
    }
    discountPrice = new Prisma.Decimal(input.discountPrice);
    if (!discountPrice.lessThan(price)) {
      return { ok: false, message: "İndirimli fiyat normal fiyattan düşük olmalı." };
    }
  }

  if (input.discountStartsAt && input.discountEndsAt && input.discountStartsAt > input.discountEndsAt) {
    return { ok: false, message: "İndirim başlangıç tarihi bitişten sonra olamaz." };
  }
  if (input.isDiscountActive && !discountPrice) {
    return { ok: false, message: "Aktif etmek için bir indirimli fiyat girin." };
  }

  return { ok: true, discountPrice };
}

export function applyCampaignPrice(
  pricing: ResolvedVariantPricing,
  campaignPrice: Prisma.Decimal | null,
): ResolvedVariantPricing {
  if (
    campaignPrice === null ||
    !campaignPrice.greaterThan(0) ||
    !campaignPrice.lessThan(pricing.effectivePrice)
  ) {
    return pricing;
  }

  const discountPercentage = Math.round(
    (1 - campaignPrice.toNumber() / pricing.regularPrice.toNumber()) * 100,
  );

  return {
    regularPrice: pricing.regularPrice,
    effectivePrice: campaignPrice,
    discountPrice: campaignPrice,
    discountPercentage,
    hasActiveDiscount: true,
  };
}
