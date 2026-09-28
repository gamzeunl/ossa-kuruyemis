/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — "Birlikte Daha Güzel"
 * `getBundleOffersForProduct`'ın (servis katmanı) yalnızca GERÇEKTEN geçerli
 * (aktif + tarih aralığında + fiyat < tamamlayıcının bağımsız fiyatı) kampanyaları
 * döndürdüğünü doğrudan test eder — pasif/başlamamış/süresi geçmiş/fiyatı
 * yüksek kayıtlar asla PDP'ye sızmamalı.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import { getBundleOffersForProduct } from "@/server/services/catalog-service";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/bundle-offers] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Birlikte Daha Güzel — getBundleOffersForProduct (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdBundleOfferIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createProduct(label: string, price: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Bundle Test ${label} ${suffix}`, slug: `bundle-test-${label}-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `BUNDLE-TEST-${label}-${suffix}`, name: "500 g", price, isActive: true },
    });
    return { productId: product.id, variantId: variant.id };
  }

  async function createBundle(
    primary: { productId: string; variantId: string },
    companion: { productId: string; variantId: string },
    overrides: Partial<{ isActive: boolean; startsAt: Date | null; endsAt: Date | null; companionPrice: string }>,
  ) {
    const bundle = await prisma.bundleOffer.create({
      data: {
        primaryProductId: primary.productId,
        primaryVariantId: primary.variantId,
        companionProductId: companion.productId,
        companionVariantId: companion.variantId,
        companionPrice: overrides.companionPrice ?? "119.00",
        isActive: overrides.isActive ?? true,
        startsAt: overrides.startsAt ?? null,
        endsAt: overrides.endsAt ?? null,
      },
    });
    createdBundleOfferIds.push(bundle.id);
    return bundle.id;
  }

  afterAll(async () => {
    await prisma.bundleOffer.deleteMany({ where: { id: { in: createdBundleOfferIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  });

  it("hiç kampanya yoksa boş dizi döner", async () => {
    const primary = await createProduct("empty-primary", "80.00");
    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toEqual([]);
  });

  it("pasif (isActive:false) kampanya döndürülmez", async () => {
    const primary = await createProduct("inactive-primary", "80.00");
    const companion = await createProduct("inactive-companion", "150.00");
    await createBundle(primary, companion, { isActive: false });

    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toEqual([]);
  });

  it("henüz başlamamış (gelecek startsAt) kampanya döndürülmez", async () => {
    const primary = await createProduct("future-primary", "80.00");
    const companion = await createProduct("future-companion", "150.00");
    await createBundle(primary, companion, { startsAt: new Date(Date.now() + 86_400_000) });

    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toEqual([]);
  });

  it("süresi geçmiş (geçmiş endsAt) kampanya döndürülmez", async () => {
    const primary = await createProduct("expired-primary", "80.00");
    const companion = await createProduct("expired-companion", "150.00");
    await createBundle(primary, companion, { endsAt: new Date(Date.now() - 86_400_000) });

    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toEqual([]);
  });

  it("bundle fiyatı tamamlayıcının bağımsız fiyatından düşük DEĞİLSE döndürülmez", async () => {
    const primary = await createProduct("expensive-primary", "80.00");
    const companion = await createProduct("expensive-companion", "150.00");
    await createBundle(primary, companion, { companionPrice: "150.00" });

    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toEqual([]);
  });

  it("gerçekten geçerli kampanya doğru fiyatlarla döner", async () => {
    const primary = await createProduct("valid-primary", "80.00");
    const companion = await createProduct("valid-companion", "150.00");
    await createBundle(primary, companion, { companionPrice: "119.00" });

    const offers = await getBundleOffersForProduct([primary.variantId]);
    expect(offers).toHaveLength(1);
    expect(offers[0].primaryVariantId).toBe(primary.variantId);
    expect(offers[0].companionVariantId).toBe(companion.variantId);
    expect(offers[0].companionRegularPrice).toBe("150");
    expect(offers[0].companionBundlePrice).toBe("119");
  });
});
