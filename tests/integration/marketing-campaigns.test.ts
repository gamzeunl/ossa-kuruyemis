/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `marketing-campaign-repository.ts`
 * CRUD fonksiyonlarını ve ürün ilişkisini doğrudan test eder. Action katmanı
 * (oturum + `revalidatePath`) gerçek bir Next.js istek bağlamı gerektirdiğinden
 * burada değil, canlı sunucu doğrulamasında test edilir (bkz. `admin-order-actions.test.ts`
 * ile aynı desen).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  createMarketingCampaign,
  deactivateMarketingCampaign,
  deleteMarketingCampaign,
  findMarketingCampaignForAdmin,
  listMarketingCampaignsForAdmin,
  updateMarketingCampaign,
  type MarketingCampaignFields,
} from "@/server/repositories/marketing-campaign-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/marketing-campaigns] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("MarketingCampaign repository (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCampaignIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createProductWithVariant(label: string, price = "100.00") {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Kampanya Ürünü ${label} ${suffix}`, slug: `kampanya-urun-${label}-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `KAMP-${suffix}`, name: "500 g", price, isActive: true },
    });
    return { productId: product.id, variantId: variant.id };
  }

  function baseFields(overrides: Partial<MarketingCampaignFields> = {}): MarketingCampaignFields {
    const now = new Date();
    return {
      name: `Test Kampanyası ${randomUUID().slice(0, 8)}`,
      type: "WEEKLY",
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 7 * 86_400_000),
      isActive: true,
      showOnHomepage: true,
      showPopup: false,
      headline: null,
      description: null,
      sortOrder: 0,
      ...overrides,
    };
  }

  afterAll(async () => {
    await prisma.marketingCampaignProduct.deleteMany({ where: { campaignId: { in: createdCampaignIds } } });
    await prisma.marketingCampaign.deleteMany({ where: { id: { in: createdCampaignIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  });

  it("oluşturma: kampanya + ürün ilişkisi birlikte yazılır", async () => {
    const { variantId } = await createProductWithVariant("create");
    const campaign = await createMarketingCampaign(baseFields(), [variantId]);
    createdCampaignIds.push(campaign.id);

    const found = await findMarketingCampaignForAdmin(campaign.id);
    expect(found).not.toBeNull();
    expect(found?.products.map((p) => p.variantId)).toEqual([variantId]);
  });

  it("kampanya oluşturmak SEÇİLEN VARYANTIN fiyat alanlarını hiç değiştirmez (tek fiyat kaynağı korunur)", async () => {
    const { variantId } = await createProductWithVariant("price-untouched", "249.90");
    const before = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });

    const campaign = await createMarketingCampaign(baseFields(), [variantId]);
    createdCampaignIds.push(campaign.id);

    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(after.price.toString()).toBe(before.price.toString());
    expect(after.discountPrice).toBeNull();
    expect(after.isDiscountActive).toBe(before.isDiscountActive);
  });

  it("güncelleme: ürün listesi TAMAMEN yeniden yazılır (eski ilişkiler silinir)", async () => {
    const { variantId: variantA } = await createProductWithVariant("update-a");
    const { variantId: variantB } = await createProductWithVariant("update-b");

    const campaign = await createMarketingCampaign(baseFields(), [variantA]);
    createdCampaignIds.push(campaign.id);

    await updateMarketingCampaign(campaign.id, baseFields({ name: "Güncellendi" }), [variantB]);

    const found = await findMarketingCampaignForAdmin(campaign.id);
    expect(found?.name).toBe("Güncellendi");
    expect(found?.products.map((p) => p.variantId)).toEqual([variantB]);
  });

  it("pasifleştirme: isActive=false olur, kayıt SİLİNMEZ", async () => {
    const { variantId } = await createProductWithVariant("deactivate");
    const campaign = await createMarketingCampaign(baseFields({ isActive: true }), [variantId]);
    createdCampaignIds.push(campaign.id);

    await deactivateMarketingCampaign(campaign.id);

    const found = await findMarketingCampaignForAdmin(campaign.id);
    expect(found).not.toBeNull();
    expect(found?.isActive).toBe(false);
  });

  it("silme: kayıt ve ürün ilişkileri (cascade) tamamen kaldırılır", async () => {
    const { variantId } = await createProductWithVariant("delete");
    const campaign = await createMarketingCampaign(baseFields(), [variantId]);

    await deleteMarketingCampaign(campaign.id);

    const found = await findMarketingCampaignForAdmin(campaign.id);
    expect(found).toBeNull();
    const relations = await prisma.marketingCampaignProduct.findMany({ where: { campaignId: campaign.id } });
    expect(relations).toHaveLength(0);
  });

  it("listMarketingCampaignsForAdmin TÜM kampanyaları (pasif dahil) döner", async () => {
    const { variantId } = await createProductWithVariant("list-all");
    const active = await createMarketingCampaign(baseFields({ isActive: true }), [variantId]);
    const inactive = await createMarketingCampaign(baseFields({ isActive: false }), [variantId]);
    createdCampaignIds.push(active.id, inactive.id);

    const all = await listMarketingCampaignsForAdmin();
    const ids = all.map((c) => c.id);
    expect(ids).toContain(active.id);
    expect(ids).toContain(inactive.id);
  });
});
