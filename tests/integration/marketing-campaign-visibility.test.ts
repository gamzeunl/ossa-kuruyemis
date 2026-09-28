/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `catalog-service.ts`'teki
 * kampanya storefront fonksiyonlarını (`getHighestPriorityActiveCampaignWithProducts`,
 * `getActiveWeeklyPopupCampaign`) uçtan uca test eder: süresi dolmuş/planlanmış
 * kampanyalar gizlenmeli, gerçekten aktif olan görünmeli, tip önceliği
 * (Günlük>Haftalık>Aylık) doğru işlemeli, `showOnHomepage`/`showPopup`
 * bayrakları doğru filtrelemeli.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  createMarketingCampaign,
  type MarketingCampaignFields,
} from "@/server/repositories/marketing-campaign-repository";
import {
  getActiveWeeklyPopupCampaign,
  getHighestPriorityActiveCampaignWithProducts,
} from "@/server/services/catalog-service";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/marketing-campaign-visibility] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Kampanya storefront görünürlüğü (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCampaignIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createProductWithVariant(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Görünürlük Ürünü ${label} ${suffix}`, slug: `gorunurluk-${label}-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `VIS-${suffix}`, name: "500 g", price: "150.00", isActive: true },
    });
    return { productId: product.id, variantId: variant.id };
  }

  async function makeCampaign(fields: Partial<MarketingCampaignFields>, variantIds: string[]) {
    const now = new Date();
    const campaign = await createMarketingCampaign(
      {
        name: `Görünürlük ${randomUUID().slice(0, 8)}`,
        type: "WEEKLY",
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + 86_400_000),
        isActive: true,
        showOnHomepage: true,
        showPopup: false,
        headline: null,
        description: null,
        sortOrder: 0,
        ...fields,
      },
      variantIds,
    );
    createdCampaignIds.push(campaign.id);
    return campaign;
  }

  // Öncelik testleri (`getHighestPriorityActiveCampaignWithProducts` TEK bir
  // "genel en yüksek öncelikli" sonuç döner) bu dosyanın KENDİ ÖNCEKİ
  // testlerinin bıraktığı hâlâ-aktif kampanyalara karşı kırılgandır — yalnızca
  // `afterAll` kullanmak, dosya içindeki sonraki testlerin önceki testlerin
  // kampanyalarıyla yarışmasına yol açar. Her testten hemen sonra o testin
  // oluşturduğu kampanya/ürünleri temizleyip listeleri sıfırlıyoruz.
  afterEach(async () => {
    await prisma.marketingCampaignProduct.deleteMany({ where: { campaignId: { in: createdCampaignIds } } });
    await prisma.marketingCampaign.deleteMany({ where: { id: { in: createdCampaignIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    createdCampaignIds.length = 0;
    createdProductIds.length = 0;
  });

  it("süresi geçmiş (endsAt < now) kampanya ana sayfada GÖRÜNMEZ", async () => {
    const { variantId } = await createProductWithVariant("expired");
    const now = new Date();
    const expired = await makeCampaign(
      { type: "DAILY", startsAt: new Date(now.getTime() - 2 * 86_400_000), endsAt: new Date(now.getTime() - 86_400_000) },
      [variantId],
    );

    // DAILY en yüksek önceliktir — süresi gerçekten geçmiş olmasaydı bu test
    // yanlışlıkla "başka bir kampanya kazandı" diye yanlış-pozitif geçebilirdi;
    // DAILY seçilmesi burada kasıtlı, `isCampaignCurrentlyActive` filtresinin
    // gerçekten çalıştığını kanıtlar.
    const result = await getHighestPriorityActiveCampaignWithProducts();
    expect(result?.id).not.toBe(expired.id);
  });

  it("henüz başlamamış (startsAt > now) kampanya storefront'ta görünmez", async () => {
    const { variantId } = await createProductWithVariant("scheduled");
    const now = new Date();
    const scheduled = await makeCampaign(
      { startsAt: new Date(now.getTime() + 86_400_000), endsAt: new Date(now.getTime() + 2 * 86_400_000) },
      [variantId],
    );

    const result = await getHighestPriorityActiveCampaignWithProducts();
    expect(result?.id).not.toBe(scheduled.id);
  });

  it("gerçekten aktif tek kampanya ana sayfada gerçek ürünleriyle döner", async () => {
    const { productId, variantId } = await createProductWithVariant("active");
    // DAILY (en yüksek öncelik) kasıtlı seçildi: `marketing-campaigns.test.ts`
    // ile bu dosya, Vitest'in dosyalar arası paralel çalıştırma mekanizmasında
    // AYNI paylaşılan `ossa_test` veritabanına yazıyor; o dosyanın CRUD
    // testleri gerçekten aktif WEEKLY kampanyalar oluşturabiliyor. MONTHLY
    // (en düşük öncelik) kullanılsaydı, tam o anda aktif olan böyle bir WEEKLY
    // kampanya önceliği kazanıp bu testi flaky yapardı — DAILY, bu dosyanın
    // dışından gelebilecek en yüksek rakip önceliğe (WEEKLY) karşı bağışıktır.
    const campaign = await makeCampaign({ type: "DAILY" }, [variantId]);

    const result = await getHighestPriorityActiveCampaignWithProducts();
    expect(result?.id).toBe(campaign.id);
    expect(result?.products.some((p) => p.id === productId)).toBe(true);
  });

  it("öncelik: aynı anda aktif Günlük ve Aylık kampanya varsa Günlük kazanır", async () => {
    const { variantId: monthlyVariant } = await createProductWithVariant("priority-monthly");
    const { variantId: dailyVariant } = await createProductWithVariant("priority-daily");

    await makeCampaign({ type: "MONTHLY", sortOrder: 0 }, [monthlyVariant]);
    const daily = await makeCampaign({ type: "DAILY", sortOrder: 0 }, [dailyVariant]);

    const result = await getHighestPriorityActiveCampaignWithProducts();
    expect(result?.id).toBe(daily.id);
    expect(result?.type).toBe("DAILY");
  });

  it("showOnHomepage=false olan aktif kampanya ana sayfa fonksiyonunda ATLANIR", async () => {
    const { variantId } = await createProductWithVariant("hidden-homepage");
    const hidden = await makeCampaign({ showOnHomepage: false, type: "DAILY" }, [variantId]);

    const result = await getHighestPriorityActiveCampaignWithProducts();
    expect(result?.id).not.toBe(hidden.id);
  });

  it("getActiveWeeklyPopupCampaign: yalnızca WEEKLY + showPopup=true + gerçekten aktif kampanyayı döner", async () => {
    const { variantId: dailyVariant } = await createProductWithVariant("popup-daily");
    const { variantId: weeklyNoPopupVariant } = await createProductWithVariant("popup-weekly-off");
    const { productId: weeklyProductId, variantId: weeklyVariant } = await createProductWithVariant("popup-weekly-on");

    await makeCampaign({ type: "DAILY", showPopup: true }, [dailyVariant]);
    await makeCampaign({ type: "WEEKLY", showPopup: false }, [weeklyNoPopupVariant]);
    const weeklyPopup = await makeCampaign({ type: "WEEKLY", showPopup: true }, [weeklyVariant]);

    const result = await getActiveWeeklyPopupCampaign();
    expect(result?.id).toBe(weeklyPopup.id);
    expect(result?.isSingleProduct).toBe(true);
    expect(result?.product?.id).toBe(weeklyProductId);
  });

  it("MONTHLY tipinde showPopup=true olsa bile WEEKLY olmadığı için popup adayı OLMAZ", async () => {
    const { productId: monthlyProductId, variantId } = await createProductWithVariant("popup-monthly-not-weekly");
    await makeCampaign({ type: "MONTHLY", showPopup: true }, [variantId]);

    // Bu dosyadaki önceki testler kalıcı (afterAll'a kadar silinmeyen) aktif
    // WEEKLY+showPopup kampanyalar bırakabilir — o yüzden global `null` yerine
    // yalnızca BU MONTHLY kampanyanın/ürününün seçilMEDİĞİ doğrulanır.
    const result = await getActiveWeeklyPopupCampaign();
    expect(result?.product?.id).not.toBe(monthlyProductId);
  });
});
