# OSSA Kuruyemiş — Proje Kuralları

Bu dosya, proje boyunca her oturumda geçerli olan kalıcı kuralları özetler. Detaylı planlama dokümanları `docs/` altındadır:
[PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md) · [REFERENCE_ANALYSIS.md](docs/REFERENCE_ANALYSIS.md) · [ARCHITECTURE.md](docs/ARCHITECTURE.md) · [DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) · [SECURITY.md](docs/SECURITY.md) · [SEO_AND_PERFORMANCE.md](docs/SEO_AND_PERFORMANCE.md) · [TEST_STRATEGY.md](docs/TEST_STRATEGY.md) · [IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) · [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md)

## Proje Özeti

Türkiye pazarına yönelik, kuruyemiş/kuru meyve satan, gerçek müşterilerin güvenle alışveriş yapacağı production seviyesinde bir e-ticaret platformu. Referans site (hicretkuruyemis.net) yalnızca UX/akış deseni incelemesi için kullanıldı; tasarım, metin, görsel ve marka tamamen özgün olacak.

## Teknoloji Yığını

Next.js (App Router, güncel stabil sürüm — **her kritik karardan önce kurulu sürümün resmi dokümanıyla doğrulanır**), TypeScript (strict mode), Tailwind CSS, PostgreSQL, Prisma ORM, Zod, React Hook Form, iyzico Checkout Form (servis katmanı üzerinden), Vitest, Playwright, ESLint, Prettier. Auth çözümü (Auth.js v5 vs. Better Auth) Faz 3 öncesi netleşecek açık bir karardır — bkz. [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) #1.

Dış bağımlılıklar (auth, dosya depolama, kargo, arama) **doğrudan çağrılmaz**; `AuthProvider`/`SessionProvider`, `StorageProvider`, `CarrierProvider`, `SearchProvider` arayüzleri arkasına alınır ki somut sağlayıcı değişikliği iş mantığını etkilemesin (bkz. [ARCHITECTURE.md](docs/ARCHITECTURE.md) §6-7). Hosting mimarisi tek bir platforma (ör. yalnızca Vercel) bağımlı değildir; Vercel, Docker/VPS, Railway gibi Node.js destekli ortamlar arasında taşınabilir olacak şekilde tasarlanır.

## Çalışma Sırası ve Süreç

1. Her yeni faz/özellik önce **plan** olarak sunulur, sonra değiştirilecek dosyalar belirtilir, sonra uygulanır, en sonda **lint + typecheck + testler** çalıştırılır ve sonuç raporlanır.
2. Her tamamlanan ana faz sonunda bir git commit önerisi sunulur; commit kullanıcı onayı olmadan atılmaz.
3. Next.js ile ilgili kritik bir karar (cache stratejisi, middleware/proxy, Server/Client Component sınırı, metadata API vb.) verilmeden önce güncel resmi dokümantasyon kontrol edilir — eski/deprecated yöntemler kullanılmaz.
4. Eksik işletme bilgisi (yasal bilgiler, kargo politikası, ödeme sağlayıcı hesabı, marka kimliği vb.) varsayılarak kalıcı karar verilmez; `SiteSetting`, ortam değişkeni veya açık placeholder olarak işaretlenir — bkz. [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).

## Değişmez Güvenlik/İş Kuralları

- **Para asla istemciden gelmez:** fiyat, indirim, kargo ücreti, sipariş toplamı her zaman sunucuda, güncel veritabanı verisiyle yeniden hesaplanır.
- **Kart verisi hiçbir zaman** uygulama veritabanında veya loglarda saklanmaz; ödeme iyzico Checkout Form üzerinden yürütülür.
- Ödeme, callback **imza doğrulaması** (`X-IYZ-SIGNATURE-V3`) ve sunucudan sunucuya teyit yapılmadan asla "ödendi" kabul edilmez; tarayıcı yönlendirmesi tek başına kanıt sayılmaz.
- Ödeme callback işleme **idempotent**tir: aynı callback birden çok kez gelse dahi yan etki tekrarlanmaz (`iyzicoConversationId` benzersizliği + durum kontrolü).
- Sipariş numarası ve ödeme referansları **opak ve tahmin edilemez**dir; ardışık/artan ID dışarı gösterilmez.
- Stok, ödeme, kupon gibi para/miktar değiştiren her işlem **tek bir veritabanı transaction'ı** içinde, gerekli satır kilidi/izolasyon seviyesiyle atomik yapılır.
- Admin işlemlerinde rol kontrolü her katmanda (route koruması + Server Action/Route Handler içi) tekrar doğrulanır; her admin mutasyonu `AuditLog`'a yazılır.
- Kullanıcı girdisi her giriş noktasında Zod ile doğrulanır.
- Kritik uçlarda (giriş, kupon, ödeme callback) rate limiting; state-changing işlemlerde CSRF/origin kontrolü; güvenli cookie ayarları (`HttpOnly`, `Secure`, `SameSite`) ve güvenlik başlıkları (CSP, HSTS vb.) zorunludur.

## Kod Kalitesi Kuralları

- TypeScript strict mode; `any` ile hata bastırılmaz — kök nedeni çözülür.
- Hata gizlenmez/bastırılmaz; try/catch yalnızca anlamlı kurtarma/loglama için kullanılır.
- Gereksiz Client Component, büyük JS paketi, ağır animasyon kütüphanesi kullanılmaz — varsayılan Server Component'tir.
- Server Action'lar yalnızca uygulama içi mutasyonlar için; dış servislerden gelen çağrılar (ör. iyzico callback) her zaman bir Route Handler'a gider.
- Gereksiz bağımlılık eklenmez; her yeni paket gerekçelendirilir.
- Yarım bırakılmış implementasyon, gereksiz soyutlama veya ihtiyaç duyulmayan gelecek-kanıtlama (over-engineering) yapılmaz.
- Secret, API anahtarı veya gerçek şifre üretilmez/repoya yazılmaz.

## SEO/Performans Sabitleri

- Ürün/kategori URL'leri Türkçe karaktersiz, okunabilir slug (`kavrulmus-ic-findik` gibi) formatındadır.
- Her sayfada canonical URL; gerekli yerlerde `Product`/`Offer`/`AggregateRating`/`Review`/`FAQPage`/`BreadcrumbList`/`Organization` (ve varsa `LocalBusiness`) JSON-LD; dinamik `sitemap.ts`/`robots.ts`.
- Server Component öncelikli render, `next/image` ile görsel optimizasyonu, etiket bazlı cache/revalidation.

## Oturum ve Çalışma Disiplini

- Görev açıkça istemediği sürece web araması veya agent/subagent kullanılmaz.
- Bir dosyayı düzenlemeden/üretmeden önce mevcut dosyalar incelenir; aynı iş tekrar üretilmez.
- Her görevde yalnızca o an istenen faz/kapsam uygulanır — istenmeyen fazlara veya kapsam dışı iyileştirmelere girilmez.
- Gereksiz bağımlılık eklenmez (bkz. Kod Kalitesi Kuralları).
- Büyük refactor yapılmadan önce gerekçe kısaca belirtilir ve gerekiyorsa onay istenir.
- Her görev sonunda yalnızca şunlar özetlenir: değişen dosyalar, yapılan kontroller, varsa açık sorular — uzun anlatım yapılmaz.
- Token tasarrufu esastır: uzun açıklamalar yerine kısa, doğrudan uygulanabilir sonuçlar üretilir.

## Test Kuralı

Her kritik iş kuralı (fiyatlandırma, stok, kupon, sipariş durum makinesi, ödeme idempotency) için hem birim hem entegrasyon testi yazılır; eşzamanlılık senaryoları (overselling, çift callback, kupon çakışması) entegrasyon testleriyle özellikle doğrulanır. Detay: [TEST_STRATEGY.md](docs/TEST_STRATEGY.md).

## Şu An Neredeyiz

Proje **Faz 0 (Dokümantasyon ve Proje Kuralları)** aşamasındadır. Henüz `package.json`, framework kurulumu veya uygulama kodu yoktur. Faz 1'e geçmeden önce [OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) içindeki "Kritik" öncelikli maddelerin en azından yol haritası netleşmelidir.
