try {
  process.loadEnvFile();
} catch {
  // .env bulunamadı — CI gibi ortamlarda DATABASE_URL zaten env'de olabilir.
}

// Entegrasyon testleri uygulamanın PAYLAŞILAN `src/server/db/prisma.ts`
// singleton'ını (repository fonksiyonları bunu kullanır, özel bir test
// client'ı enjekte etmezler) `TEST_DATABASE_URL` varsa ayrı test veritabanına
// yönlendirir — üretim kodunda hiçbir değişiklik gerekmez. `TEST_DATABASE_URL`
// tanımsızsa `DATABASE_URL` dokunulmadan kalır; entegrasyon test dosyaları bu
// durumda kendi içlerinde `describe.skip` ile atlanmalıdır (bkz. tests/db.ts).
//
// Orijinal (geliştirme) DATABASE_URL, üzerine yazmadan ÖNCE ayrı bir
// değişkende saklanır — `tests/db.ts`'teki güvenlik kontrolü bu iki değerin
// AYNI olup olmadığını karşılaştırır; override sonrası ikisi zaten eşit
// olacağından bu adım olmadan kontrol anlamsızlaşırdı.
if (process.env.TEST_DATABASE_URL) {
  process.env.__DEV_DATABASE_URL = process.env.DATABASE_URL;
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
