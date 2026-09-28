import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Entegrasyon testleri için AYRI bir Prisma client — uygulamanın paylaşılan
 * `src/server/db/prisma.ts`'i (DATABASE_URL'e bağlı) ile KARIŞMAZ. Bu client
 * yalnızca `TEST_DATABASE_URL` tanımlıysa kurulur; testler dev/production
 * veritabanına asla otomatik kayıt yazıp temizlemez (bkz. docs/TEST_STRATEGY.md).
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
export const hasTestDatabase = Boolean(TEST_DATABASE_URL);

function assertSafeTestDatabaseUrl(url: string): void {
  // `tests/setup.ts` üzerine yazmadan ÖNCEKİ orijinal DATABASE_URL (bkz. orada
  // bırakılan `__DEV_DATABASE_URL`) ile karşılaştırılır — `process.env.DATABASE_URL`
  // bu noktada zaten TEST_DATABASE_URL'e eşitlenmiş olduğundan onunla karşılaştırmak
  // kontrolü anlamsızlaştırırdı.
  const devDatabaseUrl = process.env.__DEV_DATABASE_URL;
  if (devDatabaseUrl && url === devDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL, DATABASE_URL ile aynı — testler geliştirme veritabanına karşı çalıştırılamaz.",
    );
  }
  if (!/test/i.test(url)) {
    throw new Error(
      "TEST_DATABASE_URL veritabanı adında 'test' geçmiyor — güvenlik için reddedildi. " +
        "Ayrı, açıkça adlandırılmış bir test veritabanı kullanın (ör. ossa_test).",
    );
  }
}

let client: PrismaClient | null = null;

/**
 * `TEST_DATABASE_URL` tanımsızsa hata fırlatır — çağıran taraf (entegrasyon
 * testleri) her zaman önce `hasTestDatabase`'i kontrol edip yoksa
 * `describe.skip` ile testleri atlamalıdır; bu fonksiyon o kontrolün yerine
 * geçmez, yalnızca ikinci bir güvenlik katmanıdır.
 */
export function getTestPrismaClient(): PrismaClient {
  if (!TEST_DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL tanımlı değil — entegrasyon testleri `hasTestDatabase` kontrolüyle atlanmalıydı.",
    );
  }
  assertSafeTestDatabaseUrl(TEST_DATABASE_URL);

  if (!client) {
    const adapter = new PrismaPg(TEST_DATABASE_URL);
    client = new PrismaClient({ adapter });
  }
  return client;
}
