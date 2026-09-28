# iyzico Sanal POS Başvuru Kontrol Listesi

> **Bu belge yalnızca dahilidir — müşteriye/son kullanıcıya gösterilmez.** Hassas kişisel numaralar (T.C. kimlik no, vergi kimlik no, IBAN, imza sirküleri içeriği vb.) buraya YAZILMAZ; bu bilgiler yalnızca iyzico'nun kendi başvuru panelinde, işletme tarafından doğrudan girilir. Bu belgeye sahte/uydurma belge numarası, ruhsat, sertifika veya kayıt numarası EKLENMEZ — yalnızca gerçek evrak elde edildiğinde doldurulur.

Son güncelleme: 2026-09-05 (bkz. görev: katalog düzeni + ödeme sayfası/iyzico başvuru hazırlığı).

Her madde şu dört durumdan birini taşır:
- **DONE** — kod/site tarafında tamamlandı, doğrulandı.
- **PENDING** — kod altyapısı hazır, gerçek veri/asset/karar bekleniyor.
- **USER ACTION** — bu, işletme/kullanıcı tarafından kod DIŞINDA yapılması gereken bir iştir (belge temini, hesap açma, panel işlemi vb.).
- **BLOCKED** — bir öncekine bağımlı, o tamamlanmadan ilerleyemez.

## Production domain — **USER ACTION**

Ürünler/fiyatlar production domaininde canlı ve herkese açık olmalı; iyzico başvurusu canlı, gerçek bir domain ister. Bu görevde domain/hosting değişikliği YAPILMADI.

## SSL / HTTPS — **PENDING (kod hazır) / USER ACTION (deployment)**

- [x] **DONE (kod):** `src/config/env.ts` — production'da `NEXT_PUBLIC_SITE_URL` artık Zod `.refine()` ile zorunlu `https://` kontrolünden geçiyor; `http://` verilirse anlaşılır bir yapılandırma hatasıyla build/boot anında durur (bkz. `tests/unit/env-production-https.test.ts`, 5 test). Development'ta `http://localhost` davranışı BOZULMADI.
- [x] **DONE (kod):** `next.config.ts` — tüm route'lara `Strict-Transport-Security` (HSTS) header'ı eklendi. Bu "sahte SSL" değildir; header yalnızca zaten HTTPS olan bağlantılarda tarayıcı tarafından dikkate alınır, düz HTTP localhost'u etkilemez.
- [ ] **USER ACTION:** Gerçek SSL sertifikası kodla üretilmez — bu bir hosting/domain konfigürasyon konusudur. Vercel/Docker-VPS/Railway gibi platformlardan hangisi seçilirse seçilsin, production domaininin `https://` üzerinden erişilebilir olduğu doğrulanmalı (çoğu platformda otomatik sağlanır, ör. Vercel).

## NEXT_PUBLIC_SITE_URL — **PENDING (kod hazır) / USER ACTION (değer)**

Kod tarafı (yukarıdaki HTTPS zorunluluğu) hazır. Production ortam değişkeni olarak gerçek `https://` domain değeri (ör. `https://ossakuruyemis.com`) deploy ortamına **USER ACTION** olarak girilmeli — bu değer koda yazılmaz, ortam değişkenidir.

## İyzico Merchant başvurusu — **USER ACTION**

Başvuru iyzico'nun kendi panelinde işletme tarafından yapılır; bu depo yalnızca başvuru için gereken storefront/hukuki/teknik ön koşulları hazırlar.

## İyzico API credentials — **BLOCKED (Merchant başvurusuna bağlı)**

- [x] **DONE (kod):** `serverEnv` şemasında `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` / `IYZICO_BASE_URL` opsiyonel alanlar olarak tanımlı (`src/config/env.ts`).
- [x] **DONE (kod):** `src/lib/payment-provider-status.ts::isIyzicoConfigured()` — bu iki gizli anahtar BİRDEN ortamda tanımlı olmadıkça `false` döner, sahte/varsayılan "aktif" durum üretmez.
- [ ] Gerçek API key/secret merchant başvurusu onaylandıktan sonra iyzico panelinden alınıp ortam değişkeni olarak girilecek — bu görevde girilmedi/girilemez.

## İyzico Checkout Form — **BLOCKED (API credentials'a bağlı)**

Bu görevde gerçek Checkout Form entegrasyonu **başlatılmadı** (görevin açık kapsamı dışında). Mevcut "Siparişi Oluştur" akışı, ödeme başarılıymış gibi göstermeden PENDING sipariş oluşturmaya devam ediyor — DEĞİŞTİRİLMEDİ.

## Webhook / callback URL — **BLOCKED (Checkout Form'a bağlı)**

Bu görevde callback/webhook bağlanmadı (görev kapsamı dışı, açıkça istenmedi). Stok rezervasyon altyapısı ileride buraya bağlanmaya hazır — bkz. "Stok rezervasyon consume/release entegrasyonu" aşağıda.

## "iyzico ile Öde" görünürlüğü — **DONE (gating altyapısı) / BLOCKED (gerçek CTA)**

- [x] `isIyzicoConfigured()` sonucu sunucuda (`src/app/odeme/page.tsx`) hesaplanıp `CheckoutPageContent` → `OrderSummary` → `PaymentTrustStrip` zinciriyle prop olarak taşınıyor.
- [x] `false` iken (şu an her zaman `false`) mevcut sade "Güvenli Ödeme" rozeti değişmeden gösteriliyor; `true` olduğunda ek olarak "iyzico ile Öde" etiketi görünür hâle geliyor.
- [ ] Gerçek, tıklanabilir "iyzico ile Öde" ödeme CTA'sı yalnızca Checkout Form gerçekten bağlandığında eklenecek — bugün fake bir buton EKLENMEDİ.

## Visa logosu — **USER ACTION**

Repo'da resmî Visa logosu yok. Yalnızca `https://usa.visa.com/partner-with-us/visa-brand.html` gibi resmî marka kaynağından temin edilip `public/payment-logos/visa.svg` (mevcut konvansiyon) olarak eklenmeli, sonra `PAYMENT_LOGOS` dizisine eklenmeli. Kod tarafı hazır (bkz. aşağıda "resmî logo paketi").

## Mastercard logosu — **USER ACTION**

Aynı şekilde resmî Mastercard marka merkezinden temin edilip `public/payment-logos/mastercard.svg` olarak eklenmeli, `PAYMENT_LOGOS`'a eklenmeli.

## Resmî logo paketi (iyzico + Visa + Mastercard) — **PENDING (altyapı DONE, asset USER ACTION)**

- [x] **DONE:** `src/components/checkout/payment-trust-strip.tsx` — `PAYMENT_LOGOS: { name, src }[]` dizisi ve render mantığı hazır; dizi şu an boş olduğu için hiçbir logo/placeholder/taklit görsel ÇİZİLMİYOR (sahte logo üretilmedi, text ile taklit edilmedi).
- [ ] **USER ACTION:** `public/payment-logos/` klasörü henüz oluşturulmadı — resmî SVG/PNG paketleri temin edildiğinde bu klasöre eklenip yukarıdaki diziye `{ name, src }` girdileri eklenmesi YETERLİ; başka kod değişikliği gerekmez.
- [ ] Logo yerleşimi zaten checkout'ta "Genel Toplam"ın hemen altında, sabit küçük boyutlu (`h-5`), aspect-ratio bozulmadan, footer'ı doldurmadan tasarlandı — asset eklendiğinde ek bir yerleşim değişikliği gerekmemesi bekleniyor.

## Mesafeli Satış Sözleşmesi — **DONE**

`/mesafeli-satis-sozlesmesi` — doğrulanmış satıcı bilgileriyle güncellendi. Cayma hakkı istisnaları (gıda ürünleri) bölümü hukuki incelemeye açık, aşağıya bakın.

## Ön Bilgilendirme Formu — **DONE**

`/on-bilgilendirme-formu` mevcut.

## KVKK / Gizlilik — **DONE**

- [x] Gizlilik Politikası (`/gizlilik-politikasi`) — gerçek veri akışına göre yazıldı.
- [x] KVKK Aydınlatma Metni (`/kvkk`) — veri sorumlusu, amaçlar, aktarım, toplama yöntemi/hukuki sebep, m.11 hakları, başvuru; açık rıza checkbox'ı bilinçli olarak YOK (aydınlatma ile rıza karıştırılmadı).

## Teslimat / İade — **DONE**

Teslimat ve İade Koşulları (`/teslimat-iade` — eski `/kargo-ve-teslimat` + `/iade-ve-degisim` birleştirildi, yönlendirmeler kuruldu). "İade Edilemeyebilecek Ürünler" bölümü hukuki incelemeye açık, aşağıya bakın.

## İletişim / Adres — **DONE**

- [x] İletişim sayfası (`/iletisim`) — telefon, adres, WhatsApp, iletişim formu + "İşletme Bilgileri" bölümü.
- [x] İletişim linki ana sayfadan doğrudan erişilebilir (header/mega-menü `SECONDARY_NAV_LINKS`).
- [x] Hakkımızda sayfası (`/hakkimizda`).
- [x] Footer'da tüm hukuki sayfalara erişim (ana kolonlar + alt bar).
- [x] Checkout'ta 4 hukuki sayfaya link (checkbox DEĞİL, bilgilendirme metni — Siparişi Oluştur butonunun üstünde).

## Faaliyet ve ürün lisans/izin belgeleri — **USER ACTION**

Bu gereksinim kodla uydurulamaz; iyzico'nun bizzat talep ettiği gerçek işletme belgeleridir. Aşağıdaki alanlar yalnızca gerçek evrak elde edildiğinde doldurulmalı — şu an bilinmeyen değerler UYDURULMADI:

- [ ] Gıda üretim/satış izinleri (leblebi imalatı ile kavrulmuş çekirdek, yerfıstığı vb. üretimi — faaliyet kodu 103906) — ilgili belgenin **numarası**, **veren kurum adı** ve **geçerlilik tarihi** yalnızca gerçek evrak sağlandığında buraya eklenmeli.
- [ ] Gıda sicil/işletme kayıt belgesi (varsa, ilgili mevzuata göre — Tarım ve Orman Bakanlığı işletme kayıt/onay belgesi) — aynı şekilde yalnızca gerçek evrakla doldurulmalı.
- [ ] Meslek odası kayıt belgesi (bağlı olunan oda + varsa davranış kuralları bağlantısı).
- [ ] OSSA marka tescil durumu (başvuru/tescil no, varsa — yoksa "tescilsiz" olarak not düşülmeli, uydurulmamalı).

Siteye (storefront'a) bu görevde sahte ruhsat, sahte izin, sahte sertifika veya sahte kayıt numarası **eklenmedi**.

## Vergi / MERSİS / KEP — **USER ACTION**

- [ ] KEP (Kayıtlı Elektronik Posta) adresi.
- [ ] Kurumsal e-posta adresi.
- [ ] MERSİS numarası (gerekiyorsa — şahıs işletmesi için gerekmeyebilir, iyzico ile teyit edilmeli).
- [ ] Vergi dairesi ve vergi numarası.
- [ ] İmza sirküleri.
- [ ] Vergi levhası.
- [ ] Gerekli kimlik belgeleri (yetkili/mükellef T.C. kimlik belgesi — iyzico paneline doğrudan, koda YAZILMAZ).
- [ ] İşletme adına IBAN doğrulaması.

## Test ödeme — **BLOCKED (Checkout Form'a bağlı)**

iyzico sandbox/test ortamı, gerçek Checkout Form entegrasyonu bağlandıktan sonra kullanılabilir. Bu görevde başlatılmadı.

## Production ödeme — **BLOCKED (Merchant onayına ve test ödemeye bağlı)**

## Webhook signature / security — **PENDING (mevzuat/desen hazır, bağlantı yok)**

Proje genelinde zaten `X-IYZ-SIGNATURE-V3` imza doğrulaması ve sunucudan sunucuya teyit zorunluluğu kural olarak benimsendi (bkz. proje kök kuralları). Gerçek webhook endpoint'i bu görevde YAZILMADI — Checkout Form entegrasyonuyla birlikte ileride bir Route Handler olarak eklenecek (Server Action değil, dış servis çağrısı olduğu için).

## Stok rezervasyon consume/release entegrasyonu — **DONE (release) / PENDING (consume — tetikleyici yok)**

- [x] **DONE:** `releaseReservationsForOrder` — `updateOrderStatus` içinde sipariş `CANCELLED`'a geçtiğinde AYNI transaction'da çağrılıyor (`src/server/repositories/order-repository.ts`), rezerve stok serbest bırakılıyor.
- [x] **DONE (hazır, henüz tetiklenmiyor):** `consumeReservationsForOrder` (`src/server/repositories/inventory-repository.ts`) — ödeme başarı callback'i geldiğinde çağrılmak üzere hazır, ancak henüz hiçbir yerden çağrılmıyor çünkü gerçek ödeme başarı sinyali (webhook) yok. İleride iyzico webhook'u bağlandığında, imza doğrulaması + idempotency kontrolünden SONRA bu fonksiyonun çağrılması yeterli olacak — bu görevde webhook'a bağlanmadı.

## Doğrulanmış temel bilgiler (referans — kaynak: `src/lib/business-info.ts`)

Bu bilgiler zaten koda/işlenmiş içeriğe yansıtıldı, tekrar burada hassas biçimde saklanmıyor:
- İşletme/marka adı: OSSA Kuruyemiş
- Mükellef adı: Osman Sarı
- Adres: Karşıyaka Mah. Seyran Sk. No:2 A, 33600 Mut/Mersin
- Telefon: 0534 956 78 79
- Faaliyet: Leblebi imalatı ile kavrulmuş çekirdek, yerfıstığı vb. üretimi (sert kabuklular hariç) — faaliyet kodu 103906
- İşe başlama tarihi: 11.02.2022

## Hukuki inceleme gerektiren maddeler

- Mesafeli Satış Sözleşmesi'nin cayma hakkı istisnaları (gıda ürünleri) bölümü — yürürlükteki Mesafeli Sözleşmeler Yönetmeliği'ne göre kesinleştirilmeli.
- Teslimat ve İade Koşulları'ndaki "İade Edilemeyebilecek Ürünler" bölümü — gıda güvenliği/hijyen mevzuatına göre kesin kapsam belirlenmeli.
- Vergi dairesi/MERSİS/ticaret unvanı netleştiğinde Mesafeli Satış Sözleşmesi'nin "Taraflar" ve "Uyuşmazlıkların Çözümü" bölümleri güncellenmeli.
