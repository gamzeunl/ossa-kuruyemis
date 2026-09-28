# Geliştirme Aşamaları (Faz Planı)

Her faz, bir öncekinin doğrulanabilir çıktısı üzerine inşa edilir. Bir faza geçmeden önce ilgili "Çıkış kriteri" karşılanmalıdır. Her fazın sonunda: lint + typecheck + ilgili testler çalıştırılır ve bir git commit önerisi sunulur (kural #20, #24).

## Faz 0 — Dokümantasyon ve Proje Kuralları (bu faz)
**Kapsam:** Bu dokümanın da içinde olduğu 9 doküman + `CLAUDE.md`.
**Çıkış kriteri:** Kullanıcı, mimari kararları ve açık soruları gözden geçirip onaylar; kritik açık sorular ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)) en azından "nasıl ilerleneceği" netleşecek şekilde yanıtlanır.
**Kod yazılmaz.**

## Faz 1 — Proje İskeleti
**Kapsam:** Next.js App Router projesi kurulumu (kurulum anında güncel stabil sürüm resmi dokümandan teyit edilerek), TypeScript strict mod, ESLint + Prettier yapılandırması, Tailwind CSS kurulumu, temel klasör yapısı ([ARCHITECTURE.md](ARCHITECTURE.md) §2), ortam değişkeni şablonu (`.env.example`, gerçek secret içermez), temel CI iskeleti (lint+typecheck).
**Çıkış kriteri:** Boş ama çalışan bir uygulama; `lint`, `typecheck`, `build` komutları hatasız geçer.

## Faz 2 — Veritabanı
**Kapsam:** PostgreSQL bağlantısı, Prisma kurulumu (güncel major sürüme göre driver adapter/`prisma.config.ts` gereksinimleri doğrulanarak), [DATABASE_DESIGN.md](DATABASE_DESIGN.md) taslağının `schema.prisma`'ya dönüştürülmesi, ilk migration, temel seed script (test/geliştirme verisi — gerçek müşteri/kart verisi asla).
**Çıkış kriteri:** Migration temiz bir veritabanında sıfırdan başarıyla çalışır; repository katmanı için ilk integration testleri geçer.

## Faz 3 — Authentication
**Kapsam:** [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içindeki auth kütüphanesi kararının netleştirilmesi (güncel doküman kontrolüyle), kayıt/giriş/çıkış, şifre sıfırlama, e-posta doğrulama, rol bazlı yetkilendirme iskeleti, admin route koruması.
**Çıkış kriteri:** Müşteri ve admin girişleri ayrı ayrı, testlerle (unit: yetkilendirme mantığı; e2e: giriş akışı) doğrulanmış şekilde çalışır.

## Faz 4 — Ürün ve Kategori Sistemi
**Kapsam:** `Product`, `ProductVariant`, `ProductImage`, `Category` CRUD (admin tarafı), storefront listeleme/detay (temel, henüz tam tasarım değil), slug üretimi, temel arama.
**Çıkış kriteri:** Admin panelinden eklenen bir ürün, doğru varyant/fiyat/stok bilgisiyle storefront'ta görünür; slug normalizasyonu testleri geçer.

## Faz 5 — Storefront
**Kapsam:** Anasayfa, kategori sayfası, ürün detay sayfası nihai tasarımla; Server/Client Component sınırları [ARCHITECTURE.md](ARCHITECTURE.md) §3'e göre uygulanır; temel metadata/SEO alanları (henüz tam JSON-LD değil, Faz 11'de derinleştirilir).
**Çıkış kriteri:** Storefront gezinme uçtan uca (Playwright ile) çalışır; mobil viewport'ta layout bozulmaz.

## Faz 6 — Sepet
**Kapsam:** Misafir + üye sepeti, sepete ekleme/çıkarma/miktar güncelleme (Server Action), sepet-kullanıcı birleştirme (misafir sepeti girişte üyeye bağlanır), stok görünürlük kontrolü (henüz sert rezervasyon değil).
**Çıkış kriteri:** Sepet durumu sayfalar arası ve oturum açma sonrası tutarlı kalır; unit testler (sepet toplamı hesaplama) geçer.

## Faz 7 — Checkout
**Kapsam:** Adres formu (Zod + React Hook Form), kargo hesaplama (kural tabanlı, [PROJECT_SCOPE.md](PROJECT_SCOPE.md) §8), sipariş oluşturma (stok rezervasyonu ile, transaction içinde), sunucu tarafı fiyat/toplam yeniden hesaplama.
**Çıkış kriteri:** Sipariş, istemciden gönderilen hiçbir parasal değere güvenmeden, sunucuda hesaplanan tutarlarla oluşturulur; eşzamanlılık/overselling integration testleri geçer.

## Faz 8 — Ödeme
**Kapsam:** iyzico Checkout Form entegrasyonu (server-to-server initialize), callback Route Handler'ı (imza doğrulama + sunucudan sunucuya teyit + idempotency), `Payment`/`PaymentAttempt` yaşam döngüsü.
**Çıkış kriteri:** Sandbox ortamında uçtan uca başarılı/başarısız ödeme senaryoları, çift callback simülasyonu ve imza doğrulama testleri geçer (bkz. [TEST_STRATEGY.md](TEST_STRATEGY.md) §3).

## Faz 9 — Sipariş Yönetimi
**Kapsam:** Sipariş durum makinesi tam uygulaması, sipariş takip (üye + misafir), iade/iptal talep akışı, bildirim tetikleyicileri (e-posta).
**Çıkış kriteri:** Sipariş yaşam döngüsündeki ([PROJECT_SCOPE.md](PROJECT_SCOPE.md) §5) tüm geçişler test kapsamında; geçersiz durum geçişleri reddedilir.

## Faz 10 — Admin Paneli
**Kapsam:** Sipariş yönetimi ekranları, stok yönetimi, kupon/kampanya yönetimi, kullanıcı/rol yönetimi, audit log görüntüleme, temel raporlama.
**Çıkış kriteri:** Tüm admin mutasyonları rol kontrolünden geçer ve audit log'a yazılır; yetkisiz erişim denemeleri e2e testle doğrulanır.

## Faz 11 — SEO ve Performans
**Kapsam:** [SEO_AND_PERFORMANCE.md](SEO_AND_PERFORMANCE.md) içindeki tüm kalemlerin (sitemap, robots, JSON-LD, canonical, cache/revalidation ayarları) uygulanması; performans bütçesi doğrulaması (Lighthouse/PageSpeed).
**Çıkış kriteri:** Ana sayfa/kategori/ürün sayfalarında Core Web Vitals hedefleri karşılanır; sitemap ve structured data doğrulama araçlarından hatasız geçer.

## Faz 12 — Test, Güvenlik ve Yayın
**Kapsam:** Kalan test kapsamının tamamlanması, [SECURITY.md](SECURITY.md) risk tablosundaki tüm önlemlerin doğrulanması (checklist), güvenlik başlıkları/rate limiting/CSRF son kontrolü, production ortam kurulumu, yedekleme/izleme kurulumu, yayın öncesi son kontrol listesi.
**Çıkış kriteri:** Güvenlik checklist'i tamamlanır, production'a çıkış için kullanıcı onayı alınır (deploy/production'a çıkış, [sistem talimatları] gereği kullanıcı onayı gerektiren bir eylemdir).

## Faz Sırası Esnekliği

Fazlar arasında bazı paralellik mümkündür (ör. Faz 5 Storefront ile Faz 6 Sepet kısmen birlikte ilerleyebilir), ancak **Faz 2 (Veritabanı) ve Faz 3 (Authentication) diğer tüm fazların önkoşuludur** ve **Faz 8 (Ödeme), Faz 7 (Checkout) tamamlanmadan başlayamaz**. Her fazın sonunda kullanıcıya faz özeti, değişen dosyalar ve test/lint/typecheck sonuçları raporlanır; bir sonraki faza geçiş için onay istenir.
