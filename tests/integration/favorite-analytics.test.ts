/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — "Müşterilerin Favorileri" admin
 * analitik ekranının veri kaynağını (`getMostFavoritedProducts`, gerçek
 * `Favorite` satırlarından `groupBy`) uçtan uca test eder: favori sayısına göre
 * azalan sıralama doğru olmalı, sahte minimum eşik OLMAMALI (tek favorisi olan
 * ürün de listelenir).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import { getMostFavoritedProducts } from "@/server/services/catalog-service";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/favorite-analytics] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Müşterilerin Favorileri — getMostFavoritedProducts (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdProductIds: string[] = [];
  const createdUserIds: string[] = [];

  async function createProduct(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Favori Analitik ${label} ${suffix}`, slug: `favori-analitik-${label}-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    await prisma.productVariant.create({
      data: { productId: product.id, sku: `FAV-${suffix}`, name: "500 g", price: "80.00", isActive: true },
    });
    return product.id;
  }

  async function createUser(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    const user = await prisma.user.create({
      data: { roleId: role.id, email: `fav-${label}-${suffix}@ossa-test.local`, firstName: "Fav", lastName: label },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  afterAll(async () => {
    await prisma.favorite.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("favori sayısına göre AZALAN sırayla döner, gerçek sayıyı taşır", async () => {
    const popularProductId = await createProduct("popular");
    const lessPopularProductId = await createProduct("less-popular");

    const [userA, userB, userC] = await Promise.all([
      createUser("a"),
      createUser("b"),
      createUser("c"),
    ]);

    await prisma.favorite.createMany({
      data: [
        { userId: userA, productId: popularProductId },
        { userId: userB, productId: popularProductId },
        { userId: userC, productId: popularProductId },
        { userId: userA, productId: lessPopularProductId },
      ],
    });

    const rows = await getMostFavoritedProducts(50);
    const popularRow = rows.find((row) => row.product.id === popularProductId);
    const lessPopularRow = rows.find((row) => row.product.id === lessPopularProductId);

    expect(popularRow?.favoriteCount).toBe(3);
    expect(lessPopularRow?.favoriteCount).toBe(1);

    const popularIndex = rows.findIndex((row) => row.product.id === popularProductId);
    const lessPopularIndex = rows.findIndex((row) => row.product.id === lessPopularProductId);
    expect(popularIndex).toBeGreaterThanOrEqual(0);
    expect(popularIndex).toBeLessThan(lessPopularIndex);
  });

  it("sahte minimum eşik yoktur — tek favorisi olan ürün de listede yer alır", async () => {
    const singleFavoriteProductId = await createProduct("single");
    const user = await createUser("single-fav-user");
    await prisma.favorite.create({ data: { userId: user, productId: singleFavoriteProductId } });

    const rows = await getMostFavoritedProducts(50);
    expect(rows.some((row) => row.product.id === singleFavoriteProductId && row.favoriteCount === 1)).toBe(true);
  });

  it("hiç favorisi olmayan ürün listede YER ALMAZ (sahte 0 satır üretilmez)", async () => {
    const noFavoriteProductId = await createProduct("no-favorite");

    const rows = await getMostFavoritedProducts(50);
    expect(rows.some((row) => row.product.id === noFavoriteProductId)).toBe(false);
  });
});
