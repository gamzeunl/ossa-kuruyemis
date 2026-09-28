# Mimari Tasarım

## 0. Doğrulama Notu

Bu doküman Temmuz 2026 itibarıyla resmi Next.js dokümantasyonundan doğrulanan bilgilere dayanır (kaynak: nextjs.org/docs). Belirlenen kritik bulgular:

- **Next.js 16.x** güncel stabil sürüm; Turbopack `dev`/`build` için varsayılan ve stabildir.
- **Cache Components** modeli (`cacheComponents: true` + `use cache` direktifi) stabildir; `dynamicIO`/`unstable_cache` öncülü deneysel API'lerin yerini almıştır. `use cache: private` hâlâ deneyseldir — production'da kullanılmayacaktır.
- **Async Request API'leri** (`cookies()`, `headers()`, `draftMode()`, dinamik route `params`/`searchParams`) tamamen asenkrondur (senkron erişim kaldırılmıştır).
- **`middleware.ts` → `proxy.ts`** adlandırmasına geçiş ve Edge yerine Node.js çalışma zamanının varsayılan olması yönünde bir değişiklik gözlemlenmiştir. **Bu, kod yazımına başlamadan hemen önce (Faz 1 başlangıcında) projeye kurulacak gerçek Next.js sürümünün resmi dokümantasyonuyla yeniden doğrulanmalıdır** — dokümantasyon hızla değiştiği için burada "kesin" değil "yön verici" kabul edilmelidir. Bkz. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- **Auth.js v5** hâlâ "beta" etiketlidir ve proje resmi olarak Better Auth çatısı altına geçtiğini duyurmuştur. Bu, kimlik doğrulama kütüphanesi seçimini açık bir karar noktası hâline getirir — bkz. §7 ve [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- **Prisma ORM v7**: sürücü adaptörleri (`@prisma/adapter-pg`) artık tüm veritabanları için zorunludur; `prisma.config.ts` merkezi yapılandırma dosyasıdır; generator bloğunda `output` zorunludur.

Bu doküman genel bir Next.js sürümüne değil, kurulum anında doğrulanacak spesifik bir sürüme göre uygulanacaktır (kural: her kritik Next.js kararı öncesi resmi doküman kontrolü — [CLAUDE.md](../CLAUDE.md)).

## 1. Uygulama Katmanları

```
┌─────────────────────────────────────────────┐
│  Presentation  — RSC sayfaları, layout'lar,  │
│                  Client Component adacıkları  │
├─────────────────────────────────────────────┤
│  Application   — Server Actions, Route        │
│                  Handlers (giriş noktaları)   │
├─────────────────────────────────────────────┤
│  Domain/Servis — iş kuralları: fiyat          │
│  hesaplama, stok, kupon, sipariş durum        │
│  makinesi, ödeme orkestrasyonu                │
├─────────────────────────────────────────────┤
│  Data Access   — Prisma repository/servis     │
│                  katmanı (tek DB erişim yolu) │
├─────────────────────────────────────────────┤
│  Altyapı       — PostgreSQL, iyzico, e-posta, │
│                  dosya depolama, önbellek     │
└─────────────────────────────────────────────┘
```

**İlke:** İş kuralları (fiyatlandırma, stok, kupon, sipariş durum geçişleri) Server Action/Route Handler içine değil, ayrı, test edilebilir servis fonksiyonlarına yazılır. Giriş noktaları yalnızca: girdi doğrulama (Zod) → yetkilendirme kontrolü → servis çağrısı → yanıt biçimlendirme yapar. Bu, aynı iş kuralının hem bir Server Action'dan hem bir Route Handler'dan (ör. admin API) çağrılabilmesini sağlar ve iş mantığını framework detaylarından ayırır.

## 2. Klasör Yapısı (öneri)

```
src/
  app/
    (storefront)/                # müşteri yüzü — route group
      page.tsx                   # anasayfa
      kategori/[slug]/page.tsx
      urun/[slug]/page.tsx
      sepet/page.tsx
      odeme/page.tsx             # checkout
      hesabim/...
      blog/...
    (auth)/
      giris/page.tsx
      kayit/page.tsx
    admin/                       # ayrı layout, middleware/proxy ile korunur
      urunler/...
      siparisler/...
      kuponlar/...
    api/
      payments/iyzico/callback/route.ts   # Route Handler — webhook
      sitemap.xml/route.ts (veya sitemap.ts dosya kuralı)
    sitemap.ts
    robots.ts
    layout.tsx
  actions/                       # Server Actions (ince katman)
    cart.ts  checkout.ts  auth.ts  coupon.ts  admin/*.ts
  server/
    services/                    # domain/servis katmanı (framework'ten bağımsız)
      pricing.ts  inventory.ts  order.ts  coupon.ts  payment.ts
    repositories/                # Prisma erişimi bu katmanda toplanır
    auth/                        # auth yapılandırması
  lib/                           # genel yardımcılar (validation şemaları, formatters)
  components/
    ui/                          # sunum bileşenleri (çoğunlukla server-render edilebilir)
    client/                      # açıkça "use client" gereken adacıklar
  emails/                        # transactional e-posta şablonları
prisma/
  schema.prisma
  prisma.config.ts
  migrations/
tests/
  unit/  integration/  e2e/
docs/
```

`server/services` katmanı **hiçbir Next.js özel API'sine bağımlı değildir** — bu sayede Vitest ile framework'ü mock'lamadan doğrudan birim testi yazılabilir.

## 3. Server Component / Client Component Sınırı

- **Varsayılan: Server Component.** Veri çekme, ürün/kategori render'ı, checkout sayfa iskeleti, layout'lar sunucuda kalır.
- **Client Component yalnızca gerçekten gerekli olduğunda:** sepete ekle butonu, miktar stepper, varyant seçici, kupon input'u, checkout formu (React Hook Form + Zod ile client-side anlık doğrulama gerektiren alanlar), filtre/sıralama UI'ı, admin panelindeki etkileşimli tablolar.
- Client Component'ler mümkün olduğunca **yaprak (leaf) düzeyde** tutulur; bir Server Component'i Client Component'in `children` prop'u olarak geçirme deseni (ör. sepet çekmecesi `<CartDrawer>{children}</CartDrawer>`) kullanılarak sunucu içeriği client sınırının "içine" gömülmez, yanına konur.
- Gereksiz `"use client"` genişlemesi (bir dosyayı client yapmak onun tüm alt ağacını client yapar) code review'da özel olarak kontrol edilir.

## 4. Server Actions ve Route Handler Kullanım Sınırları

| Senaryo | Araç | Gerekçe |
|---|---|---|
| Sepete ürün ekleme/çıkarma | Server Action | Uygulama içi form/UI mutasyonu |
| Checkout formu gönderimi (sipariş oluşturma) | Server Action | Uygulama içi form mutasyonu |
| Kupon uygulama | Server Action | Uygulama içi form mutasyonu |
| Admin CRUD işlemleri | Server Action | Uygulama içi form mutasyonu, aynı origin |
| **iyzico ödeme callback'i** | **Route Handler** (`app/api/payments/iyzico/callback/route.ts`) | Dış servis tarafından çağrılır; Server Action'lar yalnızca uygulamanın kendi React ağacından tetiklenebilir, dışarıdan adreslenebilir sabit bir HTTP endpoint gerekir |
| Sitemap/robots üretimi | Route Handler / dosya kuralı (`sitemap.ts`, `robots.ts`) | Next.js dosya kuralı |
| Üçüncü taraf entegrasyonları (gelecekte kargo takip webhook'u vb.) | Route Handler | Aynı gerekçe: dış çağıran |

**Kritik güvenlik notu:** Server Action'lar da doğrudan POST isteğiyle çağrılabildiğinden (yalnızca UI'dan tetiklenmeleri garanti değildir), her Server Action kendi içinde bağımsız olarak kimlik doğrulama/yetkilendirme kontrolü yapar — üst bileşende yapılan bir kontrole güvenilmez.

## 5. Veritabanı Yaklaşımı

- **PostgreSQL** + **Prisma ORM** (driver adapter, ör. `@prisma/adapter-pg`, zorunlu kılınacak sürüme göre kurulur).
- Tüm veritabanı erişimi `server/repositories` katmanından geçer; sayfa/Server Action kodu Prisma Client'ı doğrudan import etmez (test edilebilirlik ve tek erişim noktası için).
- Kritik çok adımlı işlemler (sipariş oluşturma + stok rezervasyonu, ödeme onayı + stok düşüşü + sipariş durumu, kupon kullanım sayacı artırma) **`prisma.$transaction`** içinde, gerekli yerlerde satır kilidi (`SELECT ... FOR UPDATE` karşılığı Prisma'da raw query veya `Serializable` izolasyon seviyesi) ile atomik yapılır. Detaylar [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §Transaction Stratejisi.
- Migration'lar `prisma migrate` ile versiyonlanır; production'a doğrudan `db push` uygulanmaz.

## 6. Authentication ve Authorization

- Auth, uygulama koduna doğrudan gömülmez; bir **`AuthProvider`/`SessionProvider` soyutlama katmanı** üzerinden çağrılır (oturum oluşturma/doğrulama/sonlandırma, kullanıcı-rol okuma için dar bir arayüz). Üst katmanlar (Server Action, admin route koruması, `server/services`) bu arayüze bağımlıdır, somut kütüphaneye değil — böylece Auth.js v5, Better Auth veya başka bir çözüm arasındaki seçim/değişim tek bir adapter dosyasıyla sınırlı kalır.
- Müşteri ve admin/staff aynı `User` tablosunda, `Role` alanıyla ayrılır (bkz. [DATABASE_DESIGN.md](DATABASE_DESIGN.md)); admin paneli ayrı bir route group + sunucu tarafı rol kontrolü ile korunur (yalnızca middleware/proxy'ye güvenilmez, her admin Server Action/Route Handler kendi rol kontrolünü tekrar yapar — "defense in depth").
- Kimlik bilgisi doğrulama: e-posta/parola (bcrypt/argon2 ile hashlenmiş) + gelecekte OAuth sağlayıcı (ör. Google) opsiyonu.
- Somut kütüphane seçimi (Auth.js v5 vs. Better Auth vs. başka) **Faz 3 başlangıcında güncel dokümantasyon kontrolüyle netleştirilecek açık bir karardır** — bkz. §0 ve [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md). Seçim `AuthProvider` katmanının arkasında kalacağı için proje mimarisini bloklamaz.
- Admin girişleri için ek katman değerlendirilecek: daha sıkı parola politikası, oturum süresi kısıtlaması, opsiyonel 2FA (gelecek faz adayı olarak [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içinde).

## 7. Sağlayıcı Soyutlama Katmanı (Storage, Kargo, Arama)

Aşağıdaki üç dış bağımlılık, doğrudan çağrılmaz; her biri `server/services` altında dar, değiştirilebilir bir arayüz (interface) arkasına alınır. Amaç: sağlayıcı değişikliğinin iş mantığını veya çağıran kodu etkilememesi.

### 7.1 StorageProvider (Dosya ve Ürün Görseli Yönetimi)

- Görseller uygulama sunucusunda/DB'de saklanmaz; bir `StorageProvider` arayüzü (`upload`, `getUrl`, `delete` gibi asgari metotlarla) tanımlanır ve S3, Cloudflare R2, MinIO veya Cloudinary gibi sağlayıcılardan biri bu arayüzün arkasına takılır. Somut sağlayıcı seçimi işletme kararına bağlıdır — [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- Yükleme akışı: admin panelinden dosya seçilir → sunucu tarafında dosya tipi/boyut/MIME doğrulaması ve yeniden adlandırma (kullanıcı girdisi dosya adı asla doğrudan path olarak kullanılmaz) → `StorageProvider.upload` → CDN/`next/image` üzerinden servis.
- `next/image` ile `remotePatterns` üzerinden yalnızca izin verilen depolama domain'i tanımlanır; genişletilmiş kalite/format ayarları performans bütçesine göre yapılandırılır. Sağlayıcı değişse dahi `remotePatterns` dışında uygulama kodunda değişiklik gerekmez.

### 7.2 CarrierProvider (Kargo Entegrasyonu)

- Kargo, bir `CarrierProvider` arayüzü (ör. `calculateRate`, `createShipment`, `trackShipment`) üzerinden soyutlanır. **V1'de tek somut implementasyon manuel kargo yönetimidir**: kargo ücreti kural tabanlı hesaplanır ([PROJECT_SCOPE.md](PROJECT_SCOPE.md) §8), takip numarası admin tarafından elle girilir — herhangi bir kargo firması API'sine bağımlılık yoktur.
- İleride Yurtiçi, Aras, MNG, Sürat veya başka bir firmanın API'si eklendiğinde, yalnızca yeni bir `CarrierProvider` implementasyonu yazılır; `Shipment` modeli ve çağıran servis kodu değişmez.

### 7.3 SearchProvider (Arama)

- Site içi ürün arama bir `SearchProvider` arayüzü (`search(query, filters)`) arkasından çağrılır. **V1'de somut implementasyon PostgreSQL tabanlı aramadır** (ör. `ILIKE`/`pg_trgm` veya tam metin arama) — ayrı bir arama altyapısı kurulmaz.
- İleride ölçek/özellik ihtiyacı doğarsa (facetli arama, yazım hatası toleransı vb.) Meilisearch, Typesense veya Algolia gibi bir sağlayıcı aynı arayüzün arkasına eklenebilir; storefront/admin kodu `SearchProvider` arayüzüne bağımlı kaldığı için değişmez.

## 8. Cache ve Revalidation Stratejisi

| İçerik türü | Strateji |
|---|---|
| Ürün/kategori sayfaları | `use cache` + `cacheTag` (ürün/kategori bazlı), admin güncellemesinde `revalidateTag`/`updateTag` ile hemen geçersiz kılma |
| Anasayfa vitrin/banner | `use cache`, kısa `cacheLife` profili (kampanya güncellemeleri sık) |
| Sepet, hesabım, checkout | Her zaman dinamik — `cookies()`/session'a bağlı, cache dışı, `<Suspense>` sınırları ile sarılır |
| Sitemap | Periyodik/ISR benzeri yeniden üretim; büyük katalogda `generateSitemaps()` ile 50.000 URL sınırına göre bölünür |
| Admin paneli | Her zaman dinamik, cache'lenmez |

## 9. Loglama

Loglama tek bir genel akışa yığılmaz; sorumluluk beşe ayrılır — her biri farklı okuyucuya (geliştirici, denetçi, muhasebe/ops, depo, güvenlik ekibi) hizmet eder ve farklı saklama/erişim kuralına tabi olabilir:

| Log türü | Kapsam | Nereye yazılır |
|---|---|---|
| **Application log** | İstek/yanıt akışı, beklenmeyen hatalar, performans, genel iş akışı bilgisi | Yapılandırılmış (JSON) uygulama log çıktısı |
| **Audit log** | Admin/staff'ın yaptığı her mutasyon: kim, ne zaman, hangi entity, önce/sonra değeri | `AuditLog` tablosu (bkz. [DATABASE_DESIGN.md](DATABASE_DESIGN.md)) |
| **Payment log** | Ödeme başlatma, callback alınması, imza doğrulama sonucu, durum geçişi — kart verisi **hariç** | `PaymentAttempt`/`Payment` tabloları + ayrı payment-özel uygulama log kanalı |
| **Inventory log** | Her stok hareketi (rezervasyon, satış, iade, düzeltme) | `InventoryMovement` tablosu (append-only defter) |
| **Security log** | Başarısız giriş denemeleri, rate-limit tetiklemeleri, yetkisiz erişim denemeleri, şüpheli admin aktivitesi | Ayrı güvenlik log kanalı; kritik olaylarda alarm/izleme entegrasyonu (araç seçimi [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)) |

Ortak kurallar:
- Log seviyeleri: `info` (normal iş akışı), `warn` (beklenen ama dikkat gerektiren — ör. stok yetersiz), `error` (beklenmeyen hata).
- **Asla loglanmaz:** kart numarası/CVV, düz metin parola, session/JWT token değeri, iyzico secret key.
- Kritik ticari olaylar (ödeme onayı, sipariş iptali, admin işlemleri) hem ilgili uygulama log kanalında hem DB'deki kalıcı tabloda (`AuditLog`/`InventoryMovement`/`PaymentAttempt`) ayrı ayrı tutulur — log altyapısı kaybolsa dahi denetim izi DB'de kalır.

## 10. Hata Yönetimi

- Beklenen iş hataları (stok yok, kupon geçersiz, ödeme reddedildi) tip güvenli sonuç nesneleri (`{ ok: false, code, message }`) olarak Server Action'lardan döner; UI bunları kullanıcı dostu mesaja çevirir.
- Beklenmeyen hatalar `error.tsx` / `global-error.tsx` sınırlarıyla yakalanır, kullanıcıya jenerik mesaj gösterilir, tam hata sunucu tarafında loglanır.
- Hata gizlenmez veya yutulmaz (kural #21 — [CLAUDE.md](../CLAUDE.md)): try/catch yalnızca anlamlı bir kurtarma/loglama yapacaksa kullanılır.

## 11. Güvenlik

Detaylı tehdit modeli ve önlemler için bkz. [SECURITY.md](SECURITY.md). Mimari düzeyde özet:
- Girdi doğrulama sınırında (Server Action/Route Handler girişi) Zod şemaları zorunlu.
- Tüm parasal değerler sunucuda yeniden hesaplanır.
- Ödeme callback'i imza doğrulaması + idempotency anahtarı ile korunur.
- Güvenlik başlıkları (CSP, HSTS, X-Content-Type-Options vb.) `next.config` ve/veya proxy katmanında merkezi tanımlanır.
- Rate limiting kritik uçlarda (giriş, kayıt, kupon uygulama, ödeme callback) uygulanır — sağlayıcı seçimi [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## 12. Test Stratejisi (özet)

Ayrıntılar [TEST_STRATEGY.md](TEST_STRATEGY.md) içindedir. Mimari olarak servis katmanının framework'ten bağımsız olması, Vitest ile domain mantığının (fiyatlandırma, stok, kupon, durum makinesi) izole test edilmesini sağlar; Playwright uçtan uca kritik akışları (checkout, ödeme callback simülasyonu, admin sipariş yönetimi) doğrular.

## 13. Deployment Stratejisi

- Mimari, tek bir barındırma sağlayıcısına bağımlı **olmayacak** şekilde tasarlanır: uygulama standart bir Node.js sunucusu olarak çalıştırılabilir olmalı, Vercel'e özgü API'lere (ör. Vercel-only edge/storage özellikleri) sıkı bağımlılık kurulmaz. Bu, Vercel, Docker/VPS, Railway ve benzeri Node.js destekli ortamlar arasında geçişi mümkün kılar.
- Konteynerleştirme (Dockerfile) baştan planlanır ki proje hem Vercel/Railway gibi platform-as-a-service seçeneklerinde hem kendi VPS/Docker altyapısında çalıştırılabilsin. Kesin hedef seçimi işletme/maliyet kararına bağlı, [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içinde açık.
- Ortam ayrımı: `development`, `staging`, `production` — her biri ayrı veritabanı ve ayrı iyzico sandbox/production anahtar setiyle.
- CI: her PR'da lint + typecheck + unit/integration test + (opsiyonel, ağır olmayan bir alt küme) e2e test; production deploy yalnızca `main` branch'ten, migration'lar deploy adımının parçası olarak, geri alınabilir şekilde uygulanır.
- Secrets (DB bağlantı dizesi, iyzico anahtarları, auth secret) yalnızca ortam değişkeni/secret manager üzerinden; repoya asla yazılmaz (kural #23).

## 14. Backup ve Recovery Yaklaşımı

- PostgreSQL için otomatik günlük tam yedek + point-in-time recovery (PITR) imkanı olan bir yönetilen veritabanı servisi hedeflenir (spesifik sağlayıcı seçimi açık soru).
- Yedekten geri yükleme prosedürü staging ortamında periyodik olarak (ör. üç ayda bir) test edilir — test edilmeyen yedek, yedek sayılmaz.
- Nesne depolama (ürün görselleri) için sağlayıcı düzeyinde versiyonlama/yedekleme değerlendirilir.
- Felaket kurtarma hedefleri (RPO/RTO) işletme ile netleştirilecek açık bir konudur — [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
