/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — "Ayın Favorileri" editoryal
 * vitrininin okuma-zamanı tarih/aktiflik filtresini (`listActivePicksForDisplay`)
 * doğrudan test eder: gelecekteki başlangıç, geçmiş bitiş ve pasif kayıtlar
 * vitrinde görünmemeli; gerçek aktif/tarih-aralığındaki kayıt görünmeli;
 * sıralama `sortOrder`'a göre olmalı.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import { listActivePicksForDisplay } from "@/server/repositories/featured-pick-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/featured-picks] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Ayın Favorileri (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdPickIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createProduct(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: {
        name: `Ayın Favorisi ${label} ${suffix}`,
        slug: `ayin-favorisi-${label}-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    createdProductIds.push(product.id);
    return product.id;
  }

  async function createPick(
    productId: string,
    overrides: Partial<{ isActive: boolean; startsAt: Date | null; endsAt: Date | null; sortOrder: number }>,
  ) {
    const pick = await prisma.featuredProductPick.create({
      data: {
        productId,
        isActive: overrides.isActive ?? true,
        startsAt: overrides.startsAt ?? null,
        endsAt: overrides.endsAt ?? null,
        sortOrder: overrides.sortOrder ?? 0,
      },
    });
    createdPickIds.push(pick.id);
    return pick.id;
  }

  afterAll(async () => {
    await prisma.featuredProductPick.deleteMany({ where: { id: { in: createdPickIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  });

  it("henüz başlamamış (gelecek startsAt) kayıt vitrinde görünmez", async () => {
    const productId = await createProduct("future");
    await createPick(productId, { startsAt: new Date(Date.now() + 86_400_000) });

    const picks = await listActivePicksForDisplay(50);
    expect(picks.some((pick) => pick.productId === productId)).toBe(false);
  });

  it("süresi dolmuş (geçmiş endsAt) kayıt vitrinde görünmez", async () => {
    const productId = await createProduct("expired");
    await createPick(productId, { endsAt: new Date(Date.now() - 86_400_000) });

    const picks = await listActivePicksForDisplay(50);
    expect(picks.some((pick) => pick.productId === productId)).toBe(false);
  });

  it("pasif (isActive:false) kayıt vitrinde görünmez", async () => {
    const productId = await createProduct("inactive");
    await createPick(productId, { isActive: false });

    const picks = await listActivePicksForDisplay(50);
    expect(picks.some((pick) => pick.productId === productId)).toBe(false);
  });

  it("gerçek aktif ve tarih aralığında olan kayıt vitrinde görünür", async () => {
    const productId = await createProduct("active");
    await createPick(productId, {
      startsAt: new Date(Date.now() - 86_400_000),
      endsAt: new Date(Date.now() + 86_400_000),
    });

    const picks = await listActivePicksForDisplay(50);
    expect(picks.some((pick) => pick.productId === productId)).toBe(true);
  });

  it("başlangıç/bitiş tarihi hiç belirtilmemiş (süresiz) aktif kayıt görünür", async () => {
    const productId = await createProduct("open-ended");
    await createPick(productId, {});

    const picks = await listActivePicksForDisplay(50);
    expect(picks.some((pick) => pick.productId === productId)).toBe(true);
  });

  it("sortOrder'a göre artan sırada döner", async () => {
    const productLowId = await createProduct("low");
    const productHighId = await createProduct("high");
    await createPick(productHighId, { sortOrder: 10 });
    await createPick(productLowId, { sortOrder: 1 });

    const picks = await listActivePicksForDisplay(50);
    const lowIndex = picks.findIndex((pick) => pick.productId === productLowId);
    const highIndex = picks.findIndex((pick) => pick.productId === productHighId);
    expect(lowIndex).toBeGreaterThanOrEqual(0);
    expect(highIndex).toBeGreaterThanOrEqual(0);
    expect(lowIndex).toBeLessThan(highIndex);
  });
});
