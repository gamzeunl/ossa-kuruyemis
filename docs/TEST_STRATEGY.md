# Test Stratejisi

## 1. Test Piramidi

```
        ▲  E2E (Playwright)       — kritik uçtan uca akışlar, az sayıda, yavaş
       ╱ ╲ Integration (Vitest)   — servis + DB (test DB), orta sayıda
      ╱   ╲ Unit (Vitest)         — domain/servis mantığı, çok sayıda, hızlı
     ╱─────╲
```

Domain/servis katmanının framework'ten bağımsız olması (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §1-2), fiyatlandırma/stok/kupon/durum makinesi gibi kuralların Next.js'i mock'lamadan, saf fonksiyon testi olarak yazılmasını sağlar.

## 2. Unit Test Kapsamı (Vitest)

- **Fiyatlandırma:** ara toplam, indirim (yüzde/sabit/kupon), kargo, KDV, genel toplam hesaplama — sınır durumlar (sıfır tutar, negatif olamama, yüzde indirimde `maxDiscountCap`).
- **Stok mantığı:** rezervasyon oluşturma/serbest bırakma, satılabilir miktar hesabı (`available - reserved`), yetersiz stokta reddetme.
- **Sipariş durum makinesi:** izin verilen/verilmeyen geçişler (ör. `SHIPPED` → `PENDING` reddedilir), her geçişte gerekli yan etkilerin tetiklendiğinin doğrulanması (durum değişikliği + audit log çağrısı gibi).
- **Kupon kuralları:** minimum sepet tutarı, tarih aralığı, kullanım limiti (toplam ve kullanıcı başına), geçersiz/süresi dolmuş kupon reddi.
- **Slug/normalizasyon:** Türkçe karakter dönüşümü, çakışma durumunda sonek üretimi.
- **Zod şemaları:** geçerli/geçersiz girdi örnekleriyle şema davranışı.

## 3. Integration Test Kapsamı (Vitest + test veritabanı)

- Gerçek (izole, test'e özel) PostgreSQL örneğine karşı repository/servis katmanı testleri — mock DB kullanılmaz, gerçek transaction/kısıt davranışı doğrulanır.
- **Eşzamanlılık testleri (kritik):**
  - Aynı varyant için eşzamanlı iki checkout isteği → yalnızca stok kadarının rezerve edilebildiği, fazlasının reddedildiği doğrulanır (overselling regresyon testi).
  - Aynı kupon için eşzamanlı çoklu kullanım denemesi → limit üzerinde kullanım engellenir (bkz. [SECURITY.md](SECURITY.md) risk #6).
  - Aynı `iyzicoConversationId` ile callback'in iki kez tetiklenmesi → sipariş/stok yalnızca bir kez etkilenir (idempotency regresyon testi).
- Ödeme callback akışı, iyzico API'si **sahte (mock/stub) sunucu** ile simüle edilerek uçtan uca (imza doğrulama dahil) test edilir — gerçek iyzico'ya test sırasında istek atılmaz.
- Admin yetkilendirme: rolü olmayan kullanıcının admin Server Action/Route Handler'ına erişememesi.

## 4. E2E Test Kapsamı (Playwright)

Az sayıda ama iş açısından kritik uçtan uca senaryo:
1. Misafir kullanıcı: ürün ara → sepete ekle → checkout → ödeme (sandbox) → sipariş onayı.
2. Üye kullanıcı: kayıt → giriş → adres ekleme → sipariş verme → sipariş geçmişinde görme.
3. Kupon uygulama: geçerli kupon indirim uygular, geçersiz/süresi dolmuş kupon reddedilir.
4. Stok tükenmiş ürün: sepete ekleme engellenir/uyarı gösterilir.
5. Admin: sipariş durumunu güncelleme, ürün/stok düzenleme, kupon oluşturma — yetkisiz kullanıcı admin'e erişemez.
6. Mobil viewport'ta temel gezinme ve checkout tamamlama (mobil öncelikli tasarımın regresyon kontrolü).
7. Temel erişilebilirlik kontrolü: klavye ile checkout tamamlanabilirliği, form hata mesajlarının erişilebilir şekilde ilişkilendirilmesi.

## 5. Test Ortamı ve Veri

- Testler için ayrı, production'dan tamamen izole bir veritabanı ve iyzico **sandbox** ortamı kullanılır; production anahtarları test sürecine asla dahil edilmez.
- Test verisi (fixture/seed) idempotent ve tekrar çalıştırılabilir olacak şekilde yazılır; her test kendi verisini oluşturup temizler (paylaşılan mutable state'e dayanmaz).

### 5.1 Şu an uygulanan durum

- **Vitest kuruludur** (`npm run test` → `vitest run`), `vitest.config.ts` ve `tests/setup.ts` proje kökünde. `tests/unit/` ve `tests/integration/` altında gerçek testler mevcuttur (fiyatlandırma, sipariş numarası, kargo/toplam durumu, sipariş durum makinesi, fingerprint, `createDraftOrder`, admin sipariş işlemleri).
- **Ayrı test veritabanı**: `TEST_DATABASE_URL` (bkz. `.env.example`) — yerel geliştirmede aynı Postgres sunucusunda ayrı bir `ossa_test` veritabanı olarak kurulur, `prisma migrate deploy` ile şemalanır. `tests/setup.ts`, `TEST_DATABASE_URL` tanımlıysa uygulamanın paylaşılan `src/server/db/prisma.ts` singleton'ının `DATABASE_URL`'ini test veritabanına yönlendirir — repository kodunda test'e özel bir dal YOKTUR.
- **Güvenlik kilidi** (`tests/db.ts`): `TEST_DATABASE_URL`, orijinal `DATABASE_URL` ile aynıysa VEYA veritabanı adında "test" geçmiyorsa istemci oluşturma reddedilir — yanlışlıkla dev/production veritabanına karşı destructive test çalışması engellenir.
- **`TEST_DATABASE_URL` tanımsızsa**: tüm entegrasyon test dosyaları `describe.skipIf` ile bir konsol uyarısıyla birlikte ATLANIR (bkz. `tests/integration/*.test.ts` başındaki kontrol) — dev veritabanına asla otomatik kayıt yazılmaz.
- **Henüz kurulmayan**: Playwright (e2e), iyzico sandbox entegrasyonu, kupon/stok-rezervasyon eşzamanlılık testleri (bu alanlar henüz uygulama kodunda yok) — bu bölümün geri kalanı (§3-4) bunlar için hedef/aspirasyonel tanım olarak kalır, gerçekleştikçe güncellenecektir.

## 6. CI Entegrasyonu

- Her PR: lint + typecheck (`strict` mod, `any` kullanımı reddedilir) + unit + integration testleri çalışır.
- E2E testlerinin tamamı veya kritik alt kümesi (kapsam Faz 12'de netleşir) PR/merge öncesi veya en azından `main`'e merge sonrası pipeline'da çalışır.
- Test kapsamı (coverage) özellikle fiyatlandırma/stok/ödeme/kupon servislerinde yüksek tutulur; kapsam yüzdesi hedefi somut sayı olarak Faz 0 sonunda ekiple netleştirilecek bir açık konudur ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).

## 7. Test Edilemeyen/Manuel Doğrulanacak Alanlar

- Gerçek iyzico production ortamıyla uçtan uca canlı ödeme testi (küçük gerçek tutarla) — yayın öncesi manuel olarak bir kez yapılır, otomatik test suite'ine dahil edilmez.
- Görsel/UX kalite kontrolü (tasarımın referans analizindeki [REFERENCE_ANALYSIS.md](REFERENCE_ANALYSIS.md) desenlerine göre değil, OSSA'nın kendi özgün tasarımına göre) — manuel/gözle inceleme.
