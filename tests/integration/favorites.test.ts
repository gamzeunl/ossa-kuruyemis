/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — favori ekleme/çıkarma,
 * aynı ürünün iki kez favorilenememesi (`@@unique([userId, productId])`) ve
 * kullanıcı izolasyonunu (bir kullanıcının favorisi başkasında görünmez/
 * silinemez) `favorite-repository.ts` üzerinden doğrudan test eder.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  addFavorite,
  listFavoritedProductIdSet,
  listFavoriteProductIds,
  removeFavorite,
} from "@/server/repositories/favorite-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/favorites] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("favoriler (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let roleId: string;
  let productAId: string;
  let productBId: string;
  const createdUserIds: string[] = [];

  async function createUser(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const user = await prisma.user.create({
      data: { roleId, email: `fav-${label}-${suffix}@ossa-test.local`, firstName: label, lastName: "Kullanıcı" },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    roleId = role.id;

    const productA = await prisma.product.create({
      data: { name: `Favori Test A ${suffix}`, slug: `favori-test-a-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productAId = productA.id;
    const productB = await prisma.product.create({
      data: { name: `Favori Test B ${suffix}`, slug: `favori-test-b-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productBId = productB.id;
  });

  afterAll(async () => {
    await prisma.favorite.deleteMany({ where: { productId: { in: [productAId, productBId] } } });
    await prisma.product.deleteMany({ where: { id: { in: [productAId, productBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("favori ekleme: kullanıcının favori listesinde görünür", async () => {
    const userId = await createUser("add");
    await addFavorite(userId, productAId);
    const ids = await listFavoriteProductIds(userId);
    expect(ids).toContain(productAId);
  });

  it("aynı ürünü ikinci kez favorileme idempotenttir — hata fırlatmaz, ikinci satır oluşmaz", async () => {
    const userId = await createUser("dup");
    await addFavorite(userId, productAId);
    await addFavorite(userId, productAId);
    const count = await prisma.favorite.count({ where: { userId, productId: productAId } });
    expect(count).toBe(1);
  });

  it("favoriden çıkarma: listeden kaybolur", async () => {
    const userId = await createUser("remove");
    await addFavorite(userId, productAId);
    await removeFavorite(userId, productAId);
    const ids = await listFavoriteProductIds(userId);
    expect(ids).not.toContain(productAId);
  });

  it("kullanıcı izolasyonu: bir kullanıcının favorisi başkasının listesinde yok ve başkası tarafından silinemez", async () => {
    const ownerUserId = await createUser("owner");
    const otherUserId = await createUser("other");
    await addFavorite(ownerUserId, productAId);

    const otherIds = await listFavoriteProductIds(otherUserId);
    expect(otherIds).not.toContain(productAId);

    // removeFavorite sorgusu userId+productId ile sınırlı — başka kullanıcı adına
    // çağrılması sahibin favorisini etkilemez (mimari olarak hedeflenemez).
    await removeFavorite(otherUserId, productAId);
    const ownerIds = await listFavoriteProductIds(ownerUserId);
    expect(ownerIds).toContain(productAId);
  });

  it("listFavoritedProductIdSet TEK sorguda birden fazla ürünün favori durumunu doğru döner", async () => {
    const userId = await createUser("set");
    await addFavorite(userId, productAId);
    const set = await listFavoritedProductIdSet(userId, [productAId, productBId]);
    expect(set.has(productAId)).toBe(true);
    expect(set.has(productBId)).toBe(false);
  });
});
