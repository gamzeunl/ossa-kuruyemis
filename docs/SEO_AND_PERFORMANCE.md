# SEO ve Performans Stratejisi

## 1. Teknik SEO Temelleri

- **Metadata:** her sayfa `generateMetadata` ile dinamik başlık/açıklama üretir (ürün/kategori/blog içeriğinden türetilir); statik sayfalarda sabit metadata. Faz 1'de bu API'nin güncel imzası (parametrelerin Promise olup olmadığı dahil) resmi dokümandan doğrulanacaktır (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §0).
- **Canonical URL:** her sayfa kendi kanonik URL'ini `alternates.canonical` ile açıkça belirtir; filtre/sıralama query parametreleri (`?sort=...`, `?gramaj=...`) canonical'a dahil edilmez — bu parametre kombinasyonları ayrı sayfa olarak indexlenmez (bkz. §3 Duplicate Content).
- **`sitemap.ts`:** dinamik olarak veritabanından ürün/kategori/blog URL'lerini üretir; Google'ın tek sitemap için 50.000 URL sınırına göre `generateSitemaps()` ile bölünecek şekilde tasarlanır (katalog büyüdükçe otomatik ölçeklenir).
- **`robots.ts`:** sepet, checkout, hesabım, admin gibi kullanıcıya özel/duplicate üretebilecek yollar `disallow` edilir; sitemap referansı eklenir.
- **Structured data (JSON-LD):**
  - `Product` + `Offer` — ürün detay sayfasında: ad, açıklama, görsel, marka; her varyant bir `Offer` olarak fiyat (`price`), para birimi, stok durumu (`availability`) ile temsil edilir.
  - `AggregateRating` + `Review` — ürün detay sayfasında, yalnızca gerçek onaylı yorum/puan verisi varsa eklenir (veri yoksa alan tamamen atlanır, sahte/varsayılan puan üretilmez).
  - `FAQPage` — SSS içeren sayfalarda (ör. kategori/ürün altındaki SSS bloğu, ayrı SSS sayfası) gerçek soru-cevap içeriğiyle.
  - `BreadcrumbList` — kategori ve ürün detay sayfalarında gezinme yolu.
  - `Organization` — site genelinde (layout düzeyinde): işletme adı, logo, iletişim; içerik işletmeden teyit edilecek gerçek bilgilerle doldurulur, varsayım/placeholder ile üretilmez (bkz. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).
  - `LocalBusiness` — yalnızca fiziksel bir mağaza/gösterim adresi varsa ve işletme bunu teyit ederse eklenir (bkz. [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)); yalnızca online satış yapılıyorsa bu tip kullanılmaz.
- **Türkçe slug normalizasyonu:** ürün/kategori URL'leri Türkçe karaktersiz, küçük harf, tire ayraçlı, transliterasyon kuralına göre üretilir (ör. "Kavrulmuş İç Fındık" → `kavrulmus-ic-findik`; ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u). Slug üretimi tek bir merkezi yardımcı fonksiyonda toplanır ki tüm içerik türlerinde (ürün, kategori, blog) tutarlı olsun; çakışma durumunda sayısal sonek eklenir (`-2`, `-3`).

## 2. İçerik ve Anahtar Kelime Stratejisi

- Blog, ürünle ilgili bilgilendirici içerik (kullanım önerileri, besin değeri, saklama koşulları vb.) üreterek organik arama trafiği çekme ve ürün sayfalarına iç link verme amacı taşır — bu, [REFERENCE_ANALYSIS.md](REFERENCE_ANALYSIS.md) içinde gözlemlenen sektör pratiğiyle uyumludur, ancak içerikler tamamen özgün üretilecektir.
- Kategori sayfalarında kısa, özgün, SEO amaçlı tanıtım metni (kopya içerik değil) bulunur.

## 3. Duplicate Content Riskleri ve Önlemler

| Risk kaynağı | Önlem |
|---|---|
| Filtre/sıralama query parametreleri farklı URL'ler üretip aynı içeriği indexletmesi | `canonical` her zaman parametresiz temel URL'i gösterir; gerekirse `noindex` filtre kombinasyonlarına uygulanır |
| Aynı ürünün birden fazla kategori altında farklı URL'de görünmesi | Ürün detayının **tek bir kanonik URL'i** olur (`/urun/[slug]`), kategori sayfaları ürüne bu tek URL üzerinden link verir; kategoriye göre değişen `/kategori/x/urun/y` gibi çoklu path yapısı kullanılmaz |
| www / non-www, http / https, sondaki `/` farklılıkları | Tek kanonik host + protokol zorunlu yönlendirme (301) proxy/hosting seviyesinde yapılandırılır |
| Boş/az içerikli otomatik üretilen sayfalar (ör. 0 ürünlü filtre sonucu) | Bu tür sayfalar `noindex` işaretlenir |
| Ürün varyantlarının ayrı sayfa olarak modellenmesi | Varyantlar aynı ürün sayfası içinde seçim (query param veya client state) olarak sunulur, ayrı indexlenebilir URL üretmez — varyant farkı `Product` JSON-LD içindeki `offers` dizisiyle ifade edilir |

## 4. Performans Stratejisi

- **Server Component öncelikli** render: ürün/kategori/anasayfa içeriği sunucuda render edilir, istemciye gönderilen JS minimumda tutulur (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §3).
- **Görsel optimizasyonu:** tüm ürün görselleri `next/image` üzerinden, doğru `sizes`, `priority` (yalnızca ilk ekranda görünen görsellerde) ve modern format (AVIF/WebP) ile servis edilir; kalite/format ayarları Faz 1'de kurulan Next.js sürümünün varsayılanlarına göre teyit edilip gerekirse override edilir.
- **Cache/ISR:** ürün/kategori sayfaları `use cache` ile statik üretilip etiket bazlı (`cacheTag`) revalidate edilir; admin güncellemesinde ilgili etiketler `revalidateTag`/`updateTag` ile anında geçersiz kılınır (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §8).
- **JS bütçesi disiplini:** gereksiz Client Component genişlemesi, büyük üçüncü taraf kütüphaneler ve ağır animasyon kütüphaneleri kullanılmaz; gerekli etkileşimler mümkün olduğunca CSS ile (transition/animation) veya küçük, bağımlılıksız çözümlerle yapılır (kural #17).
- **Font:** `next/font` ile self-hosted, layout shift'i önleyecek şekilde yüklenir.
- **Üçüncü taraf script'ler** (analytics, chat widget vb.) `next/script` ile uygun strateji (`afterInteractive`/`lazyOnload`) ile ve mümkün olduğunca az sayıda eklenir; her biri ana thread/LCP etkisi değerlendirilerek onaylanır.
- **Hedef metrikler:** Core Web Vitals'ta "iyi" eşiğinin üzerinde (LCP < 2.5s, INP < 200ms, CLS < 0.1) — üretim öncesi Lighthouse/PageSpeed Insights ile ürün, kategori ve anasayfa için doğrulanır.

## 5. Risk Analizi

| Risk | Önleyici Tasarım |
|---|---|
| **SEO duplicate content** | Bkz. §3 — canonical, tek kanonik ürün URL'i, gereksiz parametre indexleme engeli, boş sayfa `noindex`. |
| **Performans düşüşü** | Server Component öncelikli mimari, disiplinli JS/animasyon bütçesi, görsel optimizasyonu, cache/ISR stratejisi, CI'de performans regresyonunu yakalayacak otomatik kontrol (bkz. [TEST_STRATEGY.md](TEST_STRATEGY.md) — Lighthouse CI değerlendirmesi Faz 11/12'de somutlaştırılır); yeni bağımlılık eklenmeden önce bundle boyutuna etkisi değerlendirilir. |

## 6. Doğrulama Notu

`generateMetadata`, `robots.ts` ve `next/image` `sizes`/`priority` davranışına dair bazı ayrıntılar bu planlama aşamasında resmi dokümandan tam teyit edilememiştir (bkz. [ARCHITECTURE.md](ARCHITECTURE.md) §0). Faz 11 (SEO ve Performans) başlamadan önce bu API'ler güncel resmi dokümantasyonla yeniden doğrulanacaktır (kural #4).
