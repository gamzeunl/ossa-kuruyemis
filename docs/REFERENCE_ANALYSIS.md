# Referans Site Fonksiyonel Analizi

**Referans:** https://hicretkuruyemis.net/ (Temmuz 2026 itibarıyla erişilebilir sayfalar üzerinden incelenmiştir)

> **Kapsam notu:** Bu doküman yalnızca genel kullanıcı deneyimi, bilgi mimarisi ve e-ticaret akış *desenlerini* incelemek amacıyla hazırlanmıştır. Hiçbir metin, görsel, marka unsuru, fiyat veya ürün içeriği birebir aktarılmamış ya da kopyalanmamıştır. OSSA Kuruyemiş için burada tanımlanan desenler yalnızca "bu sektörde kullanıcıların alıştığı kalıplar nelerdir" sorusuna cevap vermek için referans alınır; nihai tasarım, metinler ve görseller tamamen özgün olacaktır. Bazı sayfalar (dolu sepet, checkout, hesap alt sayfaları, mobil görünüm) oturum/JS gerektirdiğinden bu incelemede **gözlemlenemedi** ve bu açıkça belirtilmiştir — bu boşluklar varsayımla doldurulmamıştır.

## Header
Logo sol üstte; üzerinde kısa bir "bilgi çubuğu" (güvenli alışveriş, hızlı kargo, ücretsiz kargo eşiği gibi 2-3 kısa rozet) yer alıyor. Arama kutusu header içinde merkezi/yakın konumda. Sağ üstte hesap girişi ve sepet ikonu (adet/tutar rozetiyle) bulunuyor. Bu, sektörde standart bir "bilgi çubuğu + logo + arama + hesap/sepet" düzeni.

## Navigasyon
Mega menü değil, basit açılır liste tarzında yatay menü. Ana kategoriler ürün tipine göre ayrılmış (kuruyemiş, kuru meyve, şekerleme, kuru pasta, baharat, hediyelik/kampanya grupları gibi). İkinci düzeyde ürün alt tipleri (fındık, badem, çekirdek, antep fıstığı, ceviz vb.) ve "çok satanlar" kısayolu var. Bu, tür + gramaj bazlı çapraz kategorileme deseninin tipik bir örneği.

## Anasayfa Bölümleri
Gözlemlenen sıra: kampanya/aciliyet bandı (geri sayım sayaçlı) → indirimli/fırsat ürünleri grid'i → tematik ürün blokları ("çok satanlar", "öne çıkanlar" gibi) → toplu puan/yorum özeti → blog tanıtım bloğu → e-posta bülten kaydı. Aciliyet ve sosyal kanıt unsurları öne çıkan bir desen.

## Kategori Yapısı ve Sayfası
Breadcrumb (Anasayfa > Kategori) mevcut. Sayfa başlığında kategori adı + kısa SEO metni. Filtre alanı arayüzde var ancak detaylı parametreleri (fiyat aralığı vb.) bu incelemede net görülemedi. Varsayılan sıralama "öne çıkanlar" görünümünde. Sayfa altında SSS bloğu ve bülten formu tekrarlanıyor. Klasik sayfalama/infinite-scroll işaretine rastlanmadı.

## Ürün Kartı Deseni
Görsel + puan (yıldız + yorum sayısı) + ürün adı + fiyat (indirimliyse üstü çizili eski fiyat + yeni fiyat) + gramaj/varyant seçim butonları + "sepete ekle" CTA. Stok rozeti ve hızlı önizleme bu incelemede net gözlemlenemedi.

## Ürün Detay Sayfası
Breadcrumb, çoklu görsel galerisi (küçük resimler + ana görsel), başlık altında puan/yorum özeti. Fiyat bloğunda eski fiyat + indirim yüzdesi + güncel fiyat. Gramaj/varyant seçimi buton grubu şeklinde (örn. 500 g / 1 kg). Miktar için sayısal stepper. "Sepete ekle" CTA'sının hemen altında güven rozetleri (SSL, iade süresi, kargo koşulu) tekrarlanıyor. Ürün açıklaması sekme/bölüm yapısında sunuluyor. Sayfa altında ilişkili ürünler ve ayrı bir yorumlar bölümü var.

## Sepet
Yalnızca **boş sepet** durumu gözlemlenebildi: "sepetinizde ürün yok" mesajı + keşfet CTA'sı, güven rozetlerinin tekrarı. Ücretsiz kargo eşiği mesajı sitede tutarlı biçimde tekrar ediyor (header, ürün sayfası, sepet) — dolu sepette muhtemelen bir ilerleme çubuğuna dönüşen bir desen olduğu tahmin edilebilir, ancak bu **doğrudan doğrulanamadı**. Satır bazlı ürün listesi, kupon alanı, ara toplam/kargo/toplam dökümü **gözlemlenemedi**.

## Checkout
**Gözlemlenemedi** (dolu sepete ulaşılamadı). Türkiye pazarında bu segmentte yaygın olan checkout deseni — il/ilçe seçimi, bireysel/kurumsal fatura ayrımı, adres defteri, kargo firması seçimi, kredi kartı/kapıda ödeme seçenekleri — sektör bilgisi olarak notumdur; bu siteye özgü doğrulanmış bir gözlem değildir.

## Üyelik / Hesap
Giriş sayfası standart desende: e-posta/parola, "şifremi unuttum", sosyal giriş seçeneği (ör. Google), ayrı "kayıt ol" linki. Sipariş geçmişi, adres defteri, favoriler gibi alt sayfalara "Hesabım" üzerinden erişim öngörülüyor; içerikleri incelemede **gözlemlenemedi**.

## Sipariş Takip
Footer'da ayrı bir "Sipariş Takip" linki var; sayfa içeriği (misafir takip alanları vb.) **gözlemlenemedi**.

## Blog
Tek sütun kart listesi (görsel + tarih + başlık + özet) ve sayfalama. İçerikler ürünle ilgili bilgilendirici/SEO odaklı konulara (kullanım önerileri, besin değeri vb.) yönelik — klasik içerik pazarlaması deseni.

## Footer
Dört gruplu link yapısı: Kurumsal (hakkımızda, KVKK, gizlilik politikası, mesafeli satış sözleşmesi, iade/teslimat koşulları), Kategoriler, Çok Satanlar, Müşteri Hizmetleri (iletişim, SSS, sipariş takip, hesabım). Sosyal medya ikonları mevcut. Ödeme sağlayıcı/logo bilgisi bu incelemede net görülemedi.

## Güven Unsurları
Sitede tekrar eden üç rozet: SSL güvenli alışveriş, belirli süre içinde iade, belirli tutar üzeri ücretsiz kargo. Ayrıca toplu müşteri sayısı ve puan/yorum sayısı gibi sosyal kanıt metrikleri kullanılmış. İletişim sayfasında WhatsApp destek hattı ve telefon numarası ayrı ayrı gösteriliyor.

## Mobil Deneyim
Bu incelemede metin tabanlı erişim kullanıldığından mobil görünüm doğrudan test edilemedi; hamburger menü, sticky "sepete ekle" butonu, mobil filtre çekmecesi gibi unsurlar **doğrulanamadı**. OSSA için mobil-öncelikli tasarım kararları sektör genel pratiklerine dayanacak, bu siteye özgü bir gözleme dayanmayacaktır.

---

## OSSA Kuruyemiş İçin Çıkarımlar (yalnızca desen düzeyinde)

- Header'da bilgi çubuğu + arama + hesap/sepet düzeni ve tutarlı güven rozeti tekrarı (header, ürün, sepet) sektörde beklenen bir kalıp — OSSA'da özgün metin ve görsellerle uygulanacak.
- Gramaj/varyant seçimi ürün kartı ve detay sayfasında tutarlı biçimde sunulmalı; bu, [[DATABASE_DESIGN]] içindeki `ProductVariant` modelini doğrudan besliyor.
- Checkout, sipariş takip ve dolu sepet akışları bu sitede doğrulanamadığından, OSSA'nın bu akışları [PROJECT_SCOPE.md](PROJECT_SCOPE.md) B bölümündeki gereksinim analizinden ve Türkiye e-ticaret mevzuatından (mesafeli satış sözleşmesi, KVKK) bağımsız olarak tasarlanacaktır.
- Blog + SEO içerik pazarlaması modeli, [SEO_AND_PERFORMANCE.md](SEO_AND_PERFORMANCE.md) içindeki içerik/anahtar kelime stratejisiyle uyumlu şekilde ele alınacak.
