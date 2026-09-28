# Güvenlik Stratejisi ve Risk Analizi

## 1. Ödeme Güvenliği

- Kart bilgileri (numara, CVV, son kullanma tarihi) **hiçbir zaman** OSSA sunucusuna veya veritabanına ulaşmaz; ödeme iyzico'nun barındırdığı Checkout Form üzerinden alınır (PCI-DSS kapsamı iyzico'da kalır).
- Ödeme başlatma: sunucu, iyzico API'sine **server-to-server** (secret key ile imzalanmış) bir istek göndererek Checkout Form oturumu (`token`) başlatır; secret key istemciye asla gönderilmez.
- **Callback doğrulama:** iyzico'nun gönderdiği callback isteği, `X-IYZ-SIGNATURE-V3` başlığındaki HMAC-SHA256 imzası sunucuda saklanan secret key ile yeniden hesaplanarak doğrulanır. İmza uyuşmuyorsa istek reddedilir ve **hiçbir sipariş/ödeme durumu güncellenmez**.
- İmza doğrulandıktan sonra dahi, ödeme durumu iyzico'nun `retrieve`/sorgulama API'siyle **sunucudan sunucuya tekrar teyit edilir** — yalnızca callback body'sindeki alanlara güvenilmez.
- Tarayıcı yönlendirmesi (kullanıcının "başarılı" sayfasına gelmesi) **asla tek başına ödeme onayı sayılmaz**; "teşekkürler" sayfası, sipariş durumunu sunucudan taze olarak sorgulayıp gösterir.
- Callback endpoint'i idempotent tasarlanır: `PaymentAttempt.iyzicoConversationId` üzerindeki `unique` DB kısıtı + "zaten işlenmiş mi" kontrolü sayesinde aynı callback birden çok kez gelse (iyzico'nun retry mekanizması — başarısız yanıtta ~15 dakikada bir, maksimum birkaç deneme) dahi sipariş/stok yalnızca bir kez etkilenir.

## 2. Girdi Doğrulama

- Her Server Action ve Route Handler girişinde **Zod şeması** ile doğrulama zorunludur; doğrulanmamış veri servis katmanına geçmez.
- Doğrulama hem tip hem iş kuralı düzeyinde yapılır (ör. miktar > 0 ve tam sayı, e-posta formatı, TC kimlik/vergi no format kontrolü).
- Hata mesajları saldırgana sistem iç detayı sızdırmayacak şekilde jenerikleştirilir (ör. "geçersiz istek" — stack trace veya DB hata mesajı asla kullanıcıya döndürülmez).

## 3. Kimlik Doğrulama ve Oturum Güvenliği

- Parolalar tek yönlü, salt'lı, yavaş bir hash fonksiyonuyla (bcrypt/argon2) saklanır; düz metin parola hiçbir log veya DB alanında tutulmaz.
- Oturum çerezleri: `HttpOnly`, `Secure`, `SameSite=Lax` (checkout gibi cross-site POST gerektirmeyen akışlarda `Strict` değerlendirilir), kısa/yenilenebilir ömür.
- Şifre sıfırlama token'ları tek kullanımlık, kısa ömürlü, tahmin edilemez (yeterli entropili) olarak üretilir.
- Giriş denemeleri için rate limiting + art arda başarısız denemede kısa süreli kilitleme (ilerleyen bir "captcha" katmanı gelecek faz adayı olarak değerlendirilebilir).

## 4. Admin Güvenliği ve Yetkilendirme

- Admin paneli ayrı bir route group'ta, hem proxy/middleware düzeyinde hem **her admin Server Action/Route Handler içinde ayrı ayrı** rol kontrolü ile korunur (tek katmana güvenilmez — "defense in depth").
- Rol bazlı yetkilendirme: `Role` tablosu üzerinden (bkz. [DATABASE_DESIGN.md](DATABASE_DESIGN.md)); ileride ince taneli izinler eklenebilir.
- Admin oturumları için daha kısa oturum süresi ve (gelecek faz adayı olarak) 2FA değerlendirilir.
- Her admin mutasyonu (`ürün fiyatı değiştirme`, `sipariş durumu değiştirme`, `kupon oluşturma`, `kullanıcı rolü değiştirme` vb.) `AuditLog`'a `beforeSnapshot`/`afterSnapshot` ile yazılır.
- Admin hesabı oluşturma/rol yükseltme işlemi yalnızca mevcut bir ADMIN tarafından yapılabilir; self-servis admin kaydı yoktur.

## 5. Rate Limiting, CSRF, Güvenlik Başlıkları

- **Rate limiting:** giriş, kayıt, şifre sıfırlama, kupon uygulama, ödeme callback endpoint'i gibi kritik uçlarda IP/kullanıcı bazlı sınırlama. Somut sağlayıcı/kütüphane seçimi (ör. Redis tabanlı bir çözüm) [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) içinde açık karar olarak işaretlenmiştir — gereksiz bağımlılık eklememek için en hafif çözüm tercih edilecektir.
- **CSRF:** Server Action'lar Next.js'in kendi origin-doğrulama mekanizmasına sahiptir; buna ek olarak state-changing tüm uçlarda `Origin`/`Referer` kontrolü ve `SameSite` çerez politikası ile savunma derinliği sağlanır. Route Handler tabanlı formlar (varsa) için ayrı CSRF token değerlendirmesi yapılır.
- **Güvenlik başlıkları:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` merkezi olarak (proxy/middleware katmanı veya `next.config`) tanımlanır. CSP, iyzico Checkout Form'un gömülü/yönlendirilen kaynaklarına izin verecek şekilde ama mümkün olduğunca sıkı yapılandırılır.

## 6. Dosya/Görsel Yükleme Güvenliği

- Yalnızca izin verilen MIME tipleri (image/jpeg, image/png, image/webp) ve boyut sınırı kabul edilir; dosya içeriği yalnızca uzantıya göre değil gerçek içerik doğrulamasıyla (magic bytes/kütüphane kontrolü) teyit edilir.
- Yüklenen dosya adı kullanıcıdan gelen değerle **asla** doğrudan dosya sistemi/path olarak kullanılmaz; sunucu tarafında yeniden üretilen, tahmin edilemez bir ad ile depolanır.
- Görseller uygulama sunucusunun dosya sisteminde değil, ayrı bir nesne depolamada tutulur; yükleme yalnızca kimliği doğrulanmış ADMIN/STAFF rolüyle mümkündür.
- Depolanan görseller çalıştırılabilir olarak servis edilmez (doğru `Content-Type`, `Content-Disposition` gerektiğinde `attachment`).

## 7. Kişisel Veri (KVKK/PII) Koruması

- Toplanan kişisel veriler (ad, adres, telefon, TC kimlik/vergi no) yalnızca sipariş/fatura süreci için gerekli asgari düzeyde tutulur.
- TC kimlik/vergi no gibi hassas alanlar DB'de mümkün olduğunca maskeli/kısmi gösterim ile sunulur (admin panelinde dahi tam görüntüleme gerekçelendirilmiş bir ihtiyaçla sınırlandırılır).
- Loglarda ve hata raporlarında PII maskelenir; üçüncü taraf hata izleme aracına (varsa) gönderilecek veri PII filtrelemesinden geçer.
- KVKK aydınlatma metni, açık rıza akışı ve veri saklama/silme talebi süreci için içerik/hukuki metin işletmeden alınacaktır ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)) — bu doküman yalnızca teknik önlemleri kapsar, hukuki metni üretmez.

## 8. Risk Analizi ve Önleyici Tasarım

| # | Risk | Önleyici Tasarım |
|---|---|---|
| 1 | **Stoktan fazla satış** | Checkout'ta kısa ömürlü rezervasyon (`Inventory.quantityReserved`) + transaction içinde satılabilir miktar kontrolü; yetersizse sipariş oluşturulmadan reddedilir. Yüksek eşzamanlılıkta DB seviyesinde atomik artırım/azaltım (satır kilidi) kullanılır — uygulama katmanında "önce oku sonra yaz" yarış durumuna izin verilmez. |
| 2 | **Çift ödeme** | Tek `Order` için aktif `PaymentAttempt` varken yeni bir ödeme başlatma isteği engellenir (durum kontrolü); `iyzicoConversationId` unique kısıtı aynı denemenin ikinci kez işlenmesini engeller; ödeme onaylanan sipariş için checkout formuna tekrar erişim kapatılır. |
| 3 | **Callback'in birden fazla gelmesi** | Callback işleme tamamen idempotent: `iyzicoConversationId` benzersizliği + "zaten `SUCCEEDED`/`FAILED` ise no-op" kontrolü. Her callback DB transaction'ı ile işlenir, kısmi/duplicate yan etkiye izin verilmez. |
| 4 | **Ödeme başarılı ancak sipariş kaydı başarısız** | `Order` kaydı, ödeme başlatılmadan **önce** `PENDING` durumda oluşturulur (ödeme her zaman var olan bir siparişe bağlanır, tersi değil); callback işleme ve sipariş durum güncellemesi tek transaction'da olduğundan "ödeme var, sipariş yok" durumu mimari olarak oluşamaz. Ayrıca callback işlenemezse (ör. geçici DB hatası) iyzico'nun retry mekanizması sayesinde yeniden denenir; izleme/alarm ile takılı kalan `PAYMENT_PROCESSING` siparişler operasyonel olarak tespit edilir. |
| 5 | **Sipariş oluştu ancak ödeme başarısız** | Sipariş `PENDING`/`PAYMENT_PROCESSING` durumunda kalır, stok yalnızca **rezerve** edilmiştir (kesin düşülmemiştir); belirli süre sonunda otomatik `EXPIRED`→`CANCELLED` olur ve rezervasyon serbest bırakılır — satılabilir stok bloke olmaz. |
| 6 | **Kuponun eş zamanlı kötüye kullanılması** | Kupon kullanım sayısı transaction içinde, `CouponUsage` üzerindeki `(couponId, orderId)` unique kısıtı ve limit kontrolü ile atomik artırılır; yüksek eşzamanlı senaryoda `Serializable` izolasyon veya satır kilidi kullanılır, "oku-kontrol et-yaz" adımları arasında başka bir isteğin araya girmesi engellenir. |
| 7 | **Admin hesabının ele geçirilmesi** | Güçlü parola politikası, rate-limited giriş, kısa admin oturum ömrü, (gelecek faz) 2FA, tüm admin işlemlerinin `AuditLog`'a yazılması (şüpheli aktivite tespiti için), hassas işlemlerde (rol değiştirme, toplu iade) ek onay adımı değerlendirilir. |
| 8 | **Sahte sipariş** | Checkout formunda temel bot/otomasyon önleme (rate limiting, honeypot alan, gerekirse captcha), misafir siparişlerde e-posta/telefon doğrulama adımı, aşırı sık/aynı adrese tekrar eden şüpheli sipariş desenleri için operasyonel izleme. |
| 9 | **Fiyat manipülasyonu** | İstemciden gönderilen hiçbir fiyat/indirim/toplam alanı güvenilmez; sipariş oluşturma anında `ProductVariant.price`, kupon kuralları ve kargo ücreti **sunucuda, güncel DB verisiyle yeniden hesaplanır** (kural #6). İstemci yalnızca `variantId` + `quantity` gönderir. |
| 10 | **Kargo fiyatı manipülasyonu** | Kargo ücreti istemciden gelen bir alan değildir; sunucu, sepet toplamı ve `SiteSetting`'deki kurallara göre kargo ücretini kendisi hesaplar ve `Order.shippingTotal`'a yazar. |
| 11 | **Görsel yükleme güvenliği** | Bkz. §6 — MIME/boyut/gerçek içerik doğrulama, tahmin edilemez dosya adı, ayrı nesne depolama, yalnızca yetkili rol. |
| 12 | **Kişisel verilerin sızması** | Bkz. §7 — asgari veri toplama, hassas alan maskeleme, log PII filtreleme, rol bazlı erişim, transport güvenliği (HTTPS zorunlu, HSTS). |
| 13 | **SEO duplicate content** | Bkz. [SEO_AND_PERFORMANCE.md](SEO_AND_PERFORMANCE.md) §Risk Analizi. |
| 14 | **Performans düşüşü** | Bkz. [SEO_AND_PERFORMANCE.md](SEO_AND_PERFORMANCE.md) §Risk Analizi. |

## 9. Bağımlılık ve Tedarik Zinciri Hijyeni

- Yalnızca gerekçesi net, aktif bakımı süren paketler eklenir (kural #25); her yeni bağımlılık eklenmeden önce "gerçekten gerekli mi, mevcut araçlarla yapılabilir mi" sorgusu yapılır.
- Otomatik güvenlik açığı taraması (ör. `npm audit`/Dependabot benzeri) CI'ye dahil edilir (kesin araç seçimi Faz 12'de netleşir).
