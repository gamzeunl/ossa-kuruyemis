/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * `HomepageSection` reorder/toggle repository fonksiyonlarını VE en kritik
 * kuralı doğrular: `db:seed`'in kullandığı `createMany({skipDuplicates:true})`
 * deseni, admin'in DAHA ÖNCE değiştirdiği sıra/görünürlüğü ASLA resetlemez
 * (bkz. görev kuralı, seed.ts'teki aynı mantığın izole bir kopyası).
 */
import { afterEach, describe, expect, it } from "vitest";
import { HOMEPAGE_SECTIONS } from "@/lib/homepage-sections";
import {
  listHomepageSections,
  reorderHomepageSections,
  setHomepageSectionActive,
} from "@/server/repositories/homepage-section-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/homepage-section-repository] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

/** seed.ts'teki idempotent seed adımının BİREBİR aynısı — burada izole olarak çağrılır. */
async function runSeedStep(prisma: ReturnType<typeof getTestPrismaClient>): Promise<void> {
  await prisma.homepageSection.createMany({
    data: HOMEPAGE_SECTIONS.map((section, index) => ({ key: section.key, sortOrder: index, isActive: true })),
    skipDuplicates: true,
  });
}

describe.skipIf(!hasTestDatabase)("homepage-section-repository (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  afterEach(async () => {
    await prisma.homepageSection.deleteMany({});
  });

  it("reorderHomepageSections: verilen sırayı TEK transaction'da uygular", async () => {
    await runSeedStep(prisma);
    const reversedKeys = HOMEPAGE_SECTIONS.map((s) => s.key).reverse();

    await reorderHomepageSections(reversedKeys);

    const rows = await listHomepageSections();
    expect(rows.map((r) => r.key)).toEqual(reversedKeys);
  });

  it("setHomepageSectionActive: tek bir bölümü pasif yapar, diğerlerini etkilemez", async () => {
    await runSeedStep(prisma);

    await setHomepageSectionActive("blog", false);

    const rows = await listHomepageSections();
    const blog = rows.find((r) => r.key === "blog");
    const others = rows.filter((r) => r.key !== "blog");
    expect(blog?.isActive).toBe(false);
    expect(others.every((r) => r.isActive)).toBe(true);
  });

  it("KRİTİK — db:seed'in idempotent adımı, admin'in DAHA ÖNCE değiştirdiği sıra/görünürlüğü RESETLEMEZ", async () => {
    // 1. İlk seed (fresh DB durumu).
    await runSeedStep(prisma);

    // 2. Admin sırayı değiştirir ve bir bölümü pasif yapar.
    const customOrder = HOMEPAGE_SECTIONS.map((s) => s.key).reverse();
    await reorderHomepageSections(customOrder);
    await setHomepageSectionActive("why-ossa", false);

    const beforeReseed = await listHomepageSections();

    // 3. `db:seed` TEKRAR çalıştırılır (ör. deploy sırasında) — skipDuplicates
    // sayesinde admin'in tercihleri BOZULMAMALI.
    await runSeedStep(prisma);

    const afterReseed = await listHomepageSections();
    expect(afterReseed).toEqual(beforeReseed);
    expect(afterReseed.map((r) => r.key)).toEqual(customOrder);
    expect(afterReseed.find((r) => r.key === "why-ossa")?.isActive).toBe(false);
  });

  it("db:seed ilk çalıştığında TÜM section key'lerini varsayılan sırayla oluşturur", async () => {
    await runSeedStep(prisma);
    const rows = await listHomepageSections();
    expect(rows).toHaveLength(HOMEPAGE_SECTIONS.length);
    expect(rows.map((r) => r.key).sort()).toEqual(HOMEPAGE_SECTIONS.map((s) => s.key).sort());
  });
});
