# Açık Sorular ve Bekleyen Kararlar

Bu doküman, kalıcı kod kararı verilmeden önce netleşmesi gereken işletme bilgilerini ve teknik kararları önem sırasına göre listeler (kural #19). Netleşene kadar bu değerler koda gömülmez; `SiteSetting`, ortam değişkeni veya açıkça işaretlenmiş placeholder olarak tutulur.

## Kritik — İlgili faz başlamadan önce netleşmeli

| # | Konu | Neden kritik | İlgili faz |
|---|---|---|---|
| 1 | **Auth kütüphanesi seçimi:** Auth.js v5 hâlâ "beta" ve proje resmi olarak Better Auth çatısına geçtiğini duyurdu. Hangisiyle ilerlenecek? | Kimlik doğrulama/oturum mimarisinin temelini belirler, sonradan değiştirmek maliyetli | Faz 3 |
| 2 | **Next.js sürüm/API doğrulaması:** Bu planlamada referans alınan Next.js 16 davranışları (`proxy.ts`, Cache Components, async request API'leri) kurulum anında resmi dokümanla yeniden teyit edilmeli | Yanlış/eski API varsayımıyla iskelet kurulursa yeniden yapılanma gerekir | Faz 1 |
| 3 | **iyzico merchant hesabı:** Sandbox ve production API key/secret bilgileri, komisyon oranı, hangi ödeme yöntemlerinin (taksit, kapıda ödeme vb.) destekleneceği | Ödeme entegrasyonu bu bilgiler olmadan başlayamaz | Faz 8 |
| 4 | **Hosting/deployment hedefi:** Vercel, Docker/VPS, Railway vb. arasından hangisi? Mimari taşınabilir tasarlandığı için bloklayıcı değil, ama CI/CD ve ortam değişkeni yönetimi kesin hedefe göre kurulur | Ortam değişkeni yönetimi ve maliyet buna göre şekillenir | Faz 1, Faz 12 |
| 5 | **Domain adı ve DNS erişimi** | SSL, canonical URL, e-posta gönderim domaini (SPF/DKIM) buna bağlı | Faz 1, Faz 11 |

## Yüksek Öncelik

| # | Konu | Not | İlgili faz |
|---|---|---|---|
| 6 | **Yasal işletme bilgileri — KISMEN netleşti:** işletme/marka adı ("OSSA Kuruyemiş"), mükellef adı ("Osman Sarı"), adres ve telefon artık biliniyor (bkz. `src/lib/business-info.ts`). **Hâlâ açık:** resmî ticaret unvanı (vergi levhasında bu alan boş — büyük olasılıkla şahıs işletmesi olduğundan gerekmeyebilir), vergi dairesi/no, MERSİS no, KEP adresi, bağlı meslek odası ve davranış kuralları linki, kurumsal e-posta, marka tescil durumu | `Organization` JSON-LD, fatura, iyzico başvurusu için gerekli | Faz 4, Faz 11 |
| 7 | **Hukuki metinler:** KVKK aydınlatma metni, mesafeli satış sözleşmesi, iade/teslimat politikası, çerez politikası | Bu doküman yalnızca teknik önlemleri kapsar; metinler hukuki danışmanlıkla hazırlanmalı, varsayımla üretilmeyecek | Faz 9, Faz 12 |
| 8 | **Kargo firması ve ücretlendirme politikası:** anlaşmalı kargo firması var mı, sabit ücret mi desi/ağırlık bazlı mı, ücretsiz kargo eşiği ne kadar | V1 kural tabanlı sistemi bu karara göre parametrelenir ([PROJECT_SCOPE.md](PROJECT_SCOPE.md) §8) | Faz 7 |
| 9 | **Transactional e-posta sağlayıcısı** (ör. Resend/Postmark/SES) | Sipariş bildirimleri buna bağlı | Faz 9 |
| 10 | **Nesne depolama sağlayıcısı:** S3, Cloudflare R2, MinIO veya Cloudinary'den hangisi? | `StorageProvider` arayüzünün arkasına takılacak somut implementasyon ([ARCHITECTURE.md](ARCHITECTURE.md) §7.1) | Faz 4 |
| 11 | **İade süresi politikası:** yasal asgari (14 gün) mi, daha uzun bir süre mi uygulanacak | `SiteSetting` değeri olarak tanımlanacak | Faz 9 |
| 12 | **Fiziksel mağaza/gösterim adresi var mı?** | Varsa `LocalBusiness` JSON-LD eklenir, yoksa bu tip hiç kullanılmaz ([SEO_AND_PERFORMANCE.md](SEO_AND_PERFORMANCE.md)) | Faz 11 |

## Orta Öncelik

| # | Konu | Not | İlgili faz |
|---|---|---|---|
| 13 | **Rate limiting altyapısı:** Redis tabanlı bir servis mi kullanılacak, yoksa daha hafif bir yaklaşım mı tercih edilecek | Gereksiz bağımlılık eklememe ilkesiyle dengelenecek (kural #25) | Faz 12 |
| 14 | **Analytics/izleme aracı:** hangi araç, KVKK/çerez rızası ile nasıl entegre edilecek | Performans bütçesine etkisi değerlendirilecek | Faz 11 |
| 15 | **Marka kimliği:** logo, renk paleti, tipografi tercihi (referans siteden bağımsız, özgün) | Tasarım fazlarının girdisidir | Faz 5 |
| 16 | **Admin için 2FA gerekli mi** | Ek güvenlik katmanı, kapsam/zamanlama kararı | Faz 3/Faz 12 |
| 17 | **Test coverage hedefi (somut yüzde)** | [TEST_STRATEGY.md](TEST_STRATEGY.md) §6'da yer tutucu olarak bırakıldı | Faz 0 sonu |
| 18 | **Backup/DR hedefleri (RPO/RTO)** ve yönetilen veritabanı sağlayıcısı seçimi | [ARCHITECTURE.md](ARCHITECTURE.md) §14 | Faz 2, Faz 12 |
| 19 | **Kargo firması ve ücretlendirme politikası:** anlaşmalı kargo firması var mı, sabit ücret mi desi/ağırlık bazlı mı, ücretsiz kargo eşiği ne kadar | V1 manuel `CarrierProvider` ile bloklayıcı değil; bu karar yalnızca ücret parametrelerini ve gelecekteki API entegrasyonunu etkiler ([PROJECT_SCOPE.md](PROJECT_SCOPE.md) §8) | Faz 7 |

## Düşük Öncelik / Gelecek Faz Adayları

| # | Konu |
|---|---|
| 20 | SMS bildirim kanalı |
| 21 | Çoklu depo/lokasyon stok yönetimi |
| 22 | Pazaryeri entegrasyonları (Trendyol, Hepsiburada vb.) |
| 23 | Gelişmiş facetli arama — hangi `SearchProvider` (Meilisearch/Typesense/Algolia)? |
| 24 | Abonelik/tekrarlayan sipariş modeli |
| 25 | Kargo firması gerçek zamanlı fiyat API entegrasyonu (somut `CarrierProvider` implementasyonu) |
| 26 | Çoklu dil/çoklu para birimi |
| 27 | Mobil native uygulama |
| 28 | Kupon/kampanya sisteminin otomatik kategori indirimi, çoklu ürün indirimi, "X al Y öde" kurallarına genişletilmesi |

## Netleşme Sonrası Süreç

Bir açık soru netleştiğinde: (1) bu tablodan çıkarılır veya "çözüldü" olarak işaretlenir, (2) ilgili karar [ARCHITECTURE.md](ARCHITECTURE.md), [PROJECT_SCOPE.md](PROJECT_SCOPE.md) veya [DATABASE_DESIGN.md](DATABASE_DESIGN.md) içine işlenir, (3) gerekiyorsa `SiteSetting` seed verisi veya ortam değişkeni şablonu güncellenir. Hiçbir açık soru, ilgili faz koduna başlanmadan sessizce varsayımla kapatılmaz.
