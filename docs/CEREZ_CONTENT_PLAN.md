# OSSA Kuruyemiş — Çerez Kategorisi İçerik Hazırlık Planı

**Tarih:** 2026-08-14
**Kapsam:** Yalnızca `cerez` kategorisine bağlı, `status=ACTIVE` 31 ürün. Diğer kategorilere dokunulmadı.
**Durum:** Bu belge bir **taslak/hazırlık** dokümanıdır. DB'ye hiçbir yazma işlemi yapılmadı — `Product`/`ProductVariant` tabloları bu görev boyunca değiştirilmedi (bkz. rapor sonu doğrulama). Migration oluşturulmadı, şema değiştirilmedi, seed değiştirilmedi, fiyat/görsel/kategori değiştirilmedi.

**Yöntem:** DB'den 31 ürünün gerçek `name`/`slug`/mevcut `description`/`ingredients`/`storageConditions`/`deliveryInfo`/varyant-gramaj verisi salt-okunur SQL ile çekildi. Hiçbir ürün adı değiştirilmedi. Besin değeri, alerjen çapraz bulaşma detayı ve menşei için **hiçbir sayı/iddia uydurulmadı** — belirsiz olan her yer açıkça "GEREKLİ" ile işaretlendi.

---

## Özet

| | |
|---|---:|
| Toplam Çerez ürünü | 31 |
| A sınıfı (tek bileşenli/basit) | 16 |
| B sınıfı (işlenmiş, türü belirli) | 12 |
| C sınıfı (tedarikçi/etiket verisi gerekli) | 3 |
| Besin değeri REFERANS VERİYLE hazırlanabilecek | 16 (yalnızca A sınıfı — çiğ/işlenmemiş tek bileşenliler) |
| Besin değeri için ÜRÜN/TEDARİKÇİ ETİKETİ gereken | 15 (B + C sınıfı — kavurma/tuzlama/soslama/şekerleme değerleri işleme göre değişir) |
| Menşei bilgisi gereken | 31 (istisnasız — hiçbir üründe doğrulanmış menşe verisi yok) |
| İçindekiler için TEDARİKÇİ ETİKETİ GEREKLİ | 3 (Şekerli leblebi, Soslu fıstık, Soslu mısır) |

**A sınıfı (16):** Ceviz içi, Çiğ badem, Çiğ fındık içi, Çiğ fırt fıstık, Çiğ kabak, Çiğ kaju, Fıstık içi, Kabak çekirdeği, Kabuklu ceviz, Kuru üzüm, Kuş üzümü, Özbek üzümü, Pastalık fıstık, Patlatmalık mısır, Siyah üzüm, Zar kabuklu kaju.

**B sınıfı (12):** Beyaz leblebi, Buğday, Çıtır leblebi, Dakota çekirdek, Fırt fıstık, Kavurga, Köy leblebisi, Menengiç, Salamura kabak, Sarı leblebi, Tuzsuz sarı leblebi, Yağlı mısır.

**C sınıfı (3):** Şekerli leblebi, Soslu fıstık, Soslu mısır.

**Genel iş kuralları (tüm ürünlerde tekrarlanmıyor, burada tek yerde belirtiliyor):**
- **Teslimat:** Ürün-özel bir teslimat istisnası gerektiren çerez yok (dayanıklı/kuru gıda grubu). Tüm ürünlerde OSSA'nın ortak teslimat metni kullanılabilir: standart kargo ₺120, ₺1.500 ve üzeri siparişlerde ücretsiz kargo. Kesin teslim süresi (ör. "1-3 iş günü") hiçbir üründe belirtilmedi.
- **Saklama:** Genel güvenli yaklaşım tüm üründe geçerli — serin/kuru ortam, doğrudan güneş ışığından uzak, nem korumalı, ambalaj açıldıktan sonra ağzı kapalı tutulmalı. Doğrulanmamış sıcaklık aralığı/raf ömrü süresi verilmedi.
- **Menşei:** Hiçbir üründe `MENŞEİ BİLGİSİ GEREKLİ` dışında bir değer önerilmedi — ürün adında geçen bölge ifadeleri (ör. "Dakota") gerçek menşe kanıtı olarak KULLANILMADI.

---

## Ürünler

## Beyaz leblebi

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş nohut)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Beyaz leblebi, nohutun kavrulmasıyla elde edilen, kırılgan ve çıtır bir dokuya sahip klasik bir çerezdir. Açık renkli görünümü ve dışı sert, içi unumsu yapısıyla tanınır; her tanede hafif kavrulmuş, topraksı bir aroma öne çıkar. Fazla sert olmayan çiğneme kıvamı, uzun süre atıştırmalık olarak tüketilmesini kolaylaştırır. Türk mutfağında en köklü çerez geleneklerinden biri olan leblebi, tek başına yenebildiği gibi başka kuruyemişlerle karıştırılarak da tüketilir. Küçük taneli yapısı, bir avuç alıp rahatça atıştırmaya uygundur; çiğneme sesi ve dokusuyla da karakteristik bir çerez deneyimi sunar. Beyaz leblebi, günlük çerez tüketiminde fiyat-doku dengesiyle öne çıkan, herkesin tanıdığı bir seçenektir. Paketten çıktığında tanelerin kırılgan/gevrek olması taze bir kavurmanın işaretidir; nem çekmiş leblebi yumuşar ve karakteristik çıtırlığını kaybeder, bu yüzden saklama koşullarına dikkat edilmesi önerilir.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, çerez tabaklarında diğer kuruyemişlerle karışık, ya da çay sohbetlerinin klasik eşlikçisi olarak tüketilebilir.

### İçindekiler
- Aday: Nohut (kavrulmuş). Tuz eklenip eklenmediği üründen doğrulanmalı — "Beyaz leblebi" adı tek başına tuzlu/tuzsuz ayrımını netleştirmiyor.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi nem/yağ oranını değiştirir; genel "nohut" referans değeri kavrulmuş ürünü birebir yansıtmaz)

### Alerjen
Nohut bir baklagildir; ana alerjen listesinde (kuruyemiş/gluten/süt vb.) yer almaz ama hassasiyeti olan bireyler için bilgi amaçlı belirtilebilir. Üretim/paketleme hattında kuruyemiş (fındık, badem, kaju vb.) işleniyorsa çapraz bulaşma riski olabilir — **bu, işletmeden doğrulanmadan ürüne yazılmadı.**

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanması önerilir; ambalaj açıldıktan sonra ağzı sıkıca kapatılmalı, nem çıtırlığı azaltabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir (standart kargo ₺120, ₺1.500+ ücretsiz kargo). Ürüne özgü bir istisna yok.

### SEO Title
Beyaz Leblebi — Kavrulmuş Nohut Çerezi

### SEO Description
Beyaz leblebi, çıtır dokusu ve klasik kavrulmuş aromasıyla OSSA çerez seçkisinde. 500 g ve 1 kg seçenekleriyle inceleyin.

### İşletmeden İstenen Bilgiler
- Tuz eklenip eklenmediğinin teyidi
- Kavurma yöntemi (yağsız/yağlı) bilgisi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Buğday

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş tahıl)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Buğday, kavrulmuş tahıl tanelerinden oluşan, geleneksel Anadolu çerez kültürünün köklü isimlerinden biridir. Sert ve çıtır bir dış yapıya sahip taneler, çiğnendikçe hafif kavrulmuş, tahılsı bir tat bırakır. Küçük ve yuvarlağa yakın taneleri, avuç avuç atıştırmaya uygun bir doku sunar. Sade ve katkısız bir çerez arayanlar için buğday, günlük tüketime uygun, doyurucu bir seçenektir. Genellikle diğer kavrulmuş tahıl ve baklagil çerezleriyle (leblebi, kavurga gibi) aynı raflarda yer alır ve karışık çerez tabaklarında iyi bir tamamlayıcıdır. Kavrulma derecesine bağlı olarak tanelerin rengi açık kahverengiden koyuya değişebilir; taze bir kavurmada tanelerin kırılganlığı belirgin olur. Buğday çerezi, modern atıştırmalıkların aksine sade ve minimal işlenmiş bir alternatif arayanlar için tercih edilen bir üründür.

### Kullanım Önerisi
Tek başına atıştırmalık olarak veya kavrulmuş tahıl/leblebi karışımlarında diğer geleneksel çerezlerle birlikte tüketilebilir.

### İçindekiler
- Aday: Buğday (kavrulmuş). Tuz/yağ ilavesi olup olmadığı doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi genel tahıl referans değerlerini değiştirir)

### Alerjen
Buğday **gluten içerir** — bu, ürünün doğasından açıkça bilinen bir alerjen bilgisidir ve ürün sayfasında belirtilmelidir. Üretim tesisinde başka alerjenlerin (kuruyemiş vb.) işlenip işlenmediği ayrıca doğrulanmalı; eser miktar/çapraz bulaşma ifadesi bu belgede varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Buğday Çerezi — Kavrulmuş Tahıl

### SEO Description
Geleneksel kavrulmuş buğday çerezi, çıtır dokusuyla OSSA'da. 500 g ve 1 kg seçenekleriyle sepetinize ekleyin.

### İşletmeden İstenen Bilgiler
- Tuz/yağ ilavesi teyidi
- Gluten ibaresinin ambalaj/etikette doğrulanması
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Ceviz içi

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Ceviz içi, kabuğundan ayrılmış, doğrudan tüketime hazır ceviz taneleridir. Yoğun ve yağlı bir dokuya sahip olan ceviz, ilk ısırıkta belirgin bir zenginlik hissettirir; ince kahverengi zarı hafif buruk bir nota katarken iç kısmı yumuşak ve gevrek arasında bir kıvam taşır. Kıvrımlı, karakteristik şekliyle kolayca tanınan ceviz içi, hem tek başına atıştırmalık olarak hem de tariflerde sıkça tercih edilen bir kuruyemiş türüdür. Taze bir ceviz içinde acılaşmış veya küf kokusu olmaması beklenir; iyi saklanmış cevizde belirgin bir yağlı-tatlımsı aroma hâkimdir. Salata üzerine serpme, granola karışımlarına ekleme veya hamur işlerinde kullanım gibi çok yönlü bir mutfak malzemesi olmasının yanı sıra, kendi başına da doyurucu bir çerezdir. Kırık parça oranı ve tane büyüklüğü, görsel bütünlük açısından seçim aşamasında önemli kriterlerdir.

### Kullanım Önerisi
Doğrudan atıştırmalık, salata üzeri, granola ve hamur işi tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Ceviz. Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün — ileride doğrulanmış bir referans veritabanından, sayı bu belgede verilmedi)

### Alerjen
Ceviz, **kuruyemiş grubunda açık bir alerjendir** — ürünün kendisi ceviz olduğundan bu bilgi doğrudan belirtilebilir. Aynı tesiste başka kuruyemişlerin işlenip işlenmediğine dair çapraz bulaşma ifadesi (ör. "eser miktarda badem/fındık içerebilir") bu belgede varsayılmadı, işletmeden doğrulanmalı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; yağ oranı yüksek olduğundan sıcak ortamlarda acılaşma riski akılda tutulmalı (kesin süre belirtilmedi). Ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Ceviz İçi — Doğal Kuruyemiş

### SEO Description
Kabuksuz, doğrudan tüketime hazır ceviz içi. Atıştırmalık, salata ve tariflerde kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi
- (İleride) referans besin değerinin OSSA ürününe uygunluğunun teyidi

---

## Çiğ badem

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çiğ badem, kavurma işleminden geçmemiş, doğal haliyle sunulan badem tanesidir. Fildişi rengi ve düzgün oval şekliyle tanınan çiğ badem, kavrulmuş versiyonlarına kıyasla daha hafif ve nötr bir tat profiline sahiptir; hafif tatlımsı bir arka planla birlikte belirgin bir sertlik ve çıtırlık sunar. İnce kahverengi zarı, hafif buruk bir nota katar. Çiğ haliyle tüketilmesi, badem karakterinin en saf haliyle deneyimlenmesini sağlar. Tek başına atıştırmalık olarak tercih edilebileceği gibi, kahvaltılık karışımlara, granola tariflerine veya ev yapımı sütlere temel oluşturacak şekilde de kullanılabilir. Badem, gerek boyut gerekse doku bütünlüğü açısından seçici bir ayıklama sürecinden geçirilerek raflara taşınır; kırık tane oranının düşük olması görsel ve dokusal kaliteyi destekler. Doğal, işlenmemiş bir kuruyemiş arayanlar için sade bir tercih sunar.

### Kullanım Önerisi
Doğrudan atıştırmalık, kahvaltılık karışımlar, granola ve ev yapımı badem sütü hazırlığında kullanıma uygundur.

### İçindekiler
- Aday: Badem (çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün)

### Alerjen
Badem, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi (başka kuruyemişlerin aynı tesiste işlenmesi) işletmeden doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, uzun süre açık bırakılması aromayı zayıflatabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çiğ Badem — Kavrulmamış Doğal Badem

### SEO Description
Kavrulmamış, doğal haliyle çiğ badem. Atıştırmalık, kahvaltılık ve tariflik kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi
- (İleride) referans besin değerinin OSSA ürününe uygunluğunun teyidi

---

## Çiğ fındık içi

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çiğ fındık içi, kavrulmadan, doğal haliyle sunulan, kabuğundan ayrılmış fındık tanesidir. Yuvarlağa yakın şekli ve ince kahverengi zarıyla tanınır; kavrulmuş fındığa kıyasla daha yumuşak, hafif tatlımsı ve daha az yoğun bir aroma taşır. Çiğneme kıvamı orta sertlikte olup, ilk ısırıkta belirgin bir tazelik hissi verir. Doğal formuyla tüketilmek istendiğinde ya da tariflerde kavrulmamış fındık gerektiğinde tercih edilir. Tek başına atıştırmalık olarak sunulabileceği gibi, kahvaltılık karışımlarda, granola tariflerinde veya ev yapımı fındık ezmesi hazırlığında temel malzeme olarak kullanılabilir. Boyut ve renk tutarlılığı, seçim sürecinde dikkat edilen kriterler arasındadır; kırık ya da buruşuk tanelerin ayıklanması görsel bütünlüğü korur. Fındığın doğal yağ oranı, dokusuna kadifemsi bir izlenim katar.

### Kullanım Önerisi
Doğrudan atıştırmalık, kahvaltılık karışımlar, granola ve ev yapımı fındık ezmesi/tariflerde kullanıma uygundur.

### İçindekiler
- Aday: Fındık (çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün)

### Alerjen
Fındık, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi işletmeden doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; yağ oranı nedeniyle sıcak/nemli ortamlardan uzak tutulmalı, ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çiğ Fındık İçi — Kavrulmamış Doğal Fındık

### SEO Description
Kabuksuz, kavrulmamış çiğ fındık içi. Atıştırmalık ve tariflik kullanım için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi
- (İleride) referans besin değerinin OSSA ürününe uygunluğunun teyidi

---

## Çiğ fırt fıstık

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çiğ fırt fıstık, kavrulmadan sunulan, doğal haliyle tüketilen küçük taneli bir fıstık çeşididir. Canlı yeşil-sarımsı renk tonu ve ince yapısıyla dikkat çeker; kavrulmuş fıstığa göre daha hafif, daha az yoğun bir tat profiline sahiptir. Kabuğundan ayrılmış, doğrudan tüketime hazır haliyle sunulur. İnce ve narin dokusu, hem tek başına atıştırmalık olarak hem de tatlı ve tuzlu tariflerde doğal fıstık aroması eklemek isteyenler için uygun bir seçenektir. Çiğ haliyle tüketilmesi, fıstığın doğal tat inceliğinin korunmasını sağlar. Küçük tane boyutu nedeniyle özellikle süsleme ve ince dokulu tariflerde tercih edilebilir. Görsel bütünlük açısından tane renginin canlılığı ve büyüklük tutarlılığı seçim kriterleri arasındadır.

### Kullanım Önerisi
Doğrudan atıştırmalık, tatlı süslemesi ve ince dokulu tariflerde kullanıma uygundur.

### İçindekiler
- Aday: Fıstık (çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir. "Fırt fıstık" adlandırmasının tam olarak hangi fıstık türü/boyut sınıfına karşılık geldiği işletmeden teyit edilmeli.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün, tür teyidi sonrası)

### Alerjen
Fıstık (Antep fıstığı ailesi), **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi işletmeden doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çiğ Fırt Fıstık — Kavrulmamış Doğal Fıstık

### SEO Description
Kavrulmamış, doğal haliyle çiğ fırt fıstık. İnce dokusu ve narin tadıyla 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- "Fırt fıstık" ürün tanımının/türünün netleştirilmesi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Çiğ kabak

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çiğ kabak, kavrulmadan ve tuzlanmadan sunulan doğal kabak çekirdeğidir. Yassı, oval formu ve açık yeşilimsi rengiyle tanınır; kavrulmuş haline kıyasla daha yumuşak bir çiğneme kıvamı ve daha nötr bir tat sunar. Doğal formuyla tüketilmesi, kabak çekirdeğinin hafif tatlımsı, hafif otsu aromasının olduğu gibi hissedilmesini sağlar. Kabuğu ayrılmış iç kısmıyla doğrudan tüketime hazırdır. Tek başına atıştırmalık olarak tercih edilebileceği gibi, salata garnitürü, granola karışımları veya ekmek/hamur işi tariflerinde de sıkça kullanılır. Küçük ve düzenli boyutu, farklı tariflerde kolay ölçülüp kullanılmasını sağlar. Çiğ kabak çekirdeği, sade ve doğal bir kuruyemiş arayanlar için pratik bir seçenektir.

### Kullanım Önerisi
Doğrudan atıştırmalık, salata garnitürü, granola ve ekmek/hamur işi tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kabak çekirdeği (çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün)

### Alerjen
Kabak çekirdeği, resmi ana alerjen listelerinde yer almaz. Üretim/paketleme tesisinde kuruyemiş işleniyorsa çapraz bulaşma olasılığı olabilir — işletmeden doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çiğ Kabak Çekirdeği — Doğal, Kavrulmamış

### SEO Description
Kavrulmamış, tuzsuz çiğ kabak çekirdeği. Salata ve tariflerde kullanım için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Çiğ kaju

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çiğ kaju, kavrulmadan sunulan, doğal haliyle tüketilen kaju fıstığıdır. Karakteristik kıvrık/böbrek formu ve fildişi rengiyle kolayca tanınır. Kavrulmuş kajuya kıyasla daha yumuşak, daha az yoğun ve hafif tatlımsı bir tat profiline sahiptir; dokusu ise nispeten daha az gevrek, biraz daha yumuşaktır. Çiğ haliyle tüketilmesi, kajunun doğal kremsi karakterinin hissedilmesini sağlar. Tek başına atıştırmalık olarak tercih edilebileceği gibi, kahvaltılık karışımlarda, vegan süt/krema tariflerinde veya tatlı hazırlıklarında da kullanılır. Boyut tutarlılığı ve kırık tane oranının düşük olması, seçim aşamasında önemli kriterlerdir. Doğal ve işlenmemiş bir kaju deneyimi arayanlar için sade bir seçenek sunar.

### Kullanım Önerisi
Doğrudan atıştırmalık, kahvaltılık karışımlar ve vegan süt/krema tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kaju (çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün)

### Alerjen
Kaju, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi işletmeden doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çiğ Kaju — Kavrulmamış Doğal Kaju Fıstığı

### SEO Description
Kavrulmamış, doğal haliyle çiğ kaju fıstığı. Atıştırmalık ve tariflik kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Çıtır leblebi

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş nohut, özel hazırlık)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Çıtır leblebi, adından da anlaşılacağı gibi belirgin bir gevreklik hedeflenerek hazırlanan bir kavrulmuş nohut çerezidir. Klasik leblebiye kıyasla dışı daha sert ve kırılgan, çiğnendiğinde daha belirgin bir "çıtırtı" hissi veren bir dokuya sahiptir. Kavrulmuş nohudun toprağımsı, hafif tatlımsı aroması burada da korunur, ancak hazırlık şekli dokuyu öne çıkarır. Küçük taneli yapısı, avuç avuç atıştırmaya uygun, pratik bir çerez deneyimi sunar. Çay veya kahve sohbetlerinin klasik eşlikçisi olarak günlük tüketime uygundur; karışık çerez tabaklarında da iyi bir tamamlayıcıdır. Hazırlık sürecinde ek bir yağ veya kaplama kullanılıp kullanılmadığı ürün etiketinden doğrulanmadan burada varsayılmadı; bu belge yalnızca dokusal ve genel tat karakterini tanımlar.

### Kullanım Önerisi
Tek başına atıştırmalık, çerez tabaklarında ve çay/kahve sohbetlerinde tüketime uygundur.

### İçindekiler
- Aday: Nohut (kavrulmuş). "Çıtır" hazırlık yönteminin ek yağ/kaplama içerip içermediği TEDARİKÇİ ETİKETİYLE doğrulanmalı — bu belgede varsayılmadı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (özel kavurma/hazırlık yöntemi genel referans değerlerini değiştirebilir)

### Alerjen
Nohut, ana alerjen listesinde yer almaz. Hazırlık yönteminde yağ/kaplama kullanılmışsa (doğrulanmadı) ek alerjen riski oluşabilir — işletmeden teyit edilmeli. Çapraz bulaşma bilgisi varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, nem çıtırlığı azaltabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Çıtır Leblebi — Ekstra Gevrek Kavrulmuş Nohut

### SEO Description
Belirgin çıtır dokusuyla hazırlanan kavrulmuş leblebi. Çay ve kahve sohbetlerine eşlik eder, 500 g ve 1 kg seçenekleriyle.

### İşletmeden İstenen Bilgiler
- Hazırlık yönteminde yağ/kaplama kullanılıp kullanılmadığının teyidi
- İçindekiler etiketi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Dakota çekirdek

Sınıf: **B** — İşlenmiş, türü belirli olması muhtemel (çeşit/hazırlık teyidi gerekli)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Dakota çekirdek, iri taneli bir çekirdek çeşididir; adı, büyük olasılıkla tane iriliğiyle bilinen bir çekirdek/ayçekirdeği varyetesine işaret eder. İri ve dolgun tane yapısı, kırıldığında rahat bir iç ayıklama imkânı sunar; kavrulmuş hazırlığında hafif tuzlu-kavrulmuş bir aroma beklenir. Sinemada, yolculukta veya sohbet sırasında zaman geçirmeyi kolaylaştıran, kabuğuyla birlikte tüketilen klasik bir çerez formatıdır. Kabuğunu kırıp içini çıkarma alışkanlığı, birçok tüketici için çerez deneyiminin kendisinin bir parçasıdır. İri tane yapısı, standart çekirdeklere göre daha az sayıda tanede daha fazla doyum hissi sağlar. Bu ürün için tam tür (ayçekirdeği/kabak vb.) ve kavurma/tuzlama detayları işletmeden doğrulanmadan bu açıklamada kesinleştirilmedi.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, özellikle uzun sohbet ve yolculuklarda tüketime uygundur.

### İçindekiler
- Aday: Çekirdek (tam tür — ayçekirdeği/kabak — TEYİT GEREKLİ). Tuzlama/kavurma detayı bilinmediğinden içindekiler listesi TEDARİKÇİ ETİKETİYLE netleştirilmeli.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ

### Alerjen
Tam tür teyit edilmeden alerjen değerlendirmesi eksik kalır. Ayçekirdeği/kabak çekirdeği resmi ana alerjen listesinde yer almaz, ancak üretim tesisinde kuruyemiş işleniyorsa çapraz bulaşma olasılığı olabilir — doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Dakota Çekirdek — İri Taneli Kavrulmuş Çekirdek

### SEO Description
İri taneli Dakota çekirdek, klasik çerez keyfi için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Tam tür teyidi (ayçekirdeği/kabak çekirdeği vb.)
- Tuzlama/kavurma yöntemi teyidi
- İçindekiler etiketi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Fırt fıstık

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş fıstık, "çiğ" versiyonundan farklı)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Fırt fıstık, aynı ürün ailesinin çiğ versiyonuna kıyasla kavrulmuş hazırlığıyla öne çıkan, küçük taneli bir fıstık çeşididir. Kavrulma sonrası tanelerde daha yoğun, kavrulmuş fıstığa özgü aromatik bir profil belirginleşir; doku da çiğ haline kıyasla biraz daha kuru ve gevrek olur. İnce ve narin tane yapısı korunur. Tuzlama yapılıp yapılmadığı ürün etiketinden netleştirilmelidir. Tek başına atıştırmalık olarak tüketilebileceği gibi, kavrulmuş fıstık aroması gerektiren tatlı ve tuzlu tariflerde de kullanılabilir. Küçük boyutu, süslemelik kullanım için de pratik bir seçenek sunar. Kavurma derecesi, tanelerin renk tonunda hafif koyulaşma olarak görülebilir.

### Kullanım Önerisi
Tek başına atıştırmalık, tatlı süslemesi ve kavrulmuş fıstık aroması istenen tariflerde kullanıma uygundur.

### İçindekiler
- Aday: Fıstık (kavrulmuş). Tuz ilavesi olup olmadığı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi referans değerlerini değiştirir)

### Alerjen
Fıstık (Antep fıstığı ailesi), **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Fırt Fıstık — Kavrulmuş Fıstık Çerezi

### SEO Description
Kavrulmuş, ince taneli fırt fıstık. Atıştırmalık ve tariflik kullanım için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- "Fırt fıstık" ürün tanımının netleştirilmesi
- Tuz ilavesi teyidi
- İçindekiler etiketi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Fıstık içi

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Fıstık içi, kabuğundan ayrılmış, doğrudan tüketime hazır Antep fıstığı tanesidir. Canlı yeşil rengi ve karakteristik ince yapısıyla tanınır; hafif tatlımsı, yağlı ve belirgin bir aroma taşır. Diğer birçok kuruyemişe kıyasla daha narin bir dokuya sahiptir, çiğnendiğinde yumuşak ama tok bir kıvam sunar. Tek başına atıştırmalık olarak tüketilebileceği gibi, tatlı ve tuzlu tariflerde, baklava ve benzeri hamur işlerinde süsleme veya iç malzeme olarak sıkça kullanılır. Kırık/toz oranının düşük olması, tam tane bütünlüğü açısından tercih sebebidir. Fıstık içi, hem sade bir çerez hem de mutfakta çok yönlü bir malzeme olarak OSSA seçkisinde yer alır. Rengin canlılığı, tazeliğin görsel bir göstergesi olarak kabul edilir.

### Kullanım Önerisi
Doğrudan atıştırmalık, tatlı/hamur işi süslemesi ve tariflerde iç malzeme olarak kullanıma uygundur.

### İçindekiler
- Aday: Antep fıstığı. Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş tek bileşenli ürün)

### Alerjen
Fıstık, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Fıstık İçi — Doğal Antep Fıstığı

### SEO Description
Kabuksuz, doğrudan tüketime hazır fıstık içi. Atıştırmalık ve tariflik kullanım için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Kabak çekirdeği

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Kabak çekirdeği, kabuğu ayrılmış, yassı ve oval formuyla tanınan doğal bir çerezdir. Açık yeşil rengi ve hafif tatlımsı, otsu aromasıyla dikkat çeker; çiğnendiğinde yumuşak ama belirgin bir doku sunar. Sade haliyle tüketildiğinde kabak çekirdeğinin doğal karakteri öne çıkar. Tek başına atıştırmalık olarak tercih edilebileceği gibi, salata garnitürü, granola karışımları, ekmek ve pasta içi malzemesi olarak da sıkça kullanılır. Küçük ve düzenli boyutu, tariflerde kolay ölçüm ve dağılım sağlar. Kabak çekirdeği, hem sade bir atıştırmalık hem de mutfakta dokusal çeşitlilik katan bir malzeme olarak değerlendirilebilir. Renk ve boyut tutarlılığı, seçim sürecinde önemli kriterler arasındadır.

### Kullanım Önerisi
Doğrudan atıştırmalık, salata garnitürü, granola ve ekmek/pasta tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kabak çekirdeği. Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş tek bileşenli ürün)

### Alerjen
Kabak çekirdeği, resmi ana alerjen listelerinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Kabak Çekirdeği — Doğal, Kabuksuz

### SEO Description
Kabuksuz, doğal kabak çekirdeği. Atıştırmalık, salata ve tariflerde kullanım için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Kabuklu ceviz

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Kabuklu ceviz, doğal sert kabuğuyla birlikte sunulan, kırılıp içi çıkarılarak tüketilen geleneksel bir çerezdir. Sert, oyuklu kabuk yapısı korunur; kırıldığında içindeki yoğun, yağlı ve karakteristik ceviz aroması ortaya çıkar. Kabuğunu kendi kırma alışkanlığı, birçok tüketici için çerez deneyiminin ayrılmaz bir parçasıdır ve tane tazeliğinin en iyi göstergelerinden biri kabuğun sağlamlığıdır. Kabuklu haliyle daha uzun süre dış etkenlerden korunmuş kalır. Sohbet eşliğinde, aile sofralarında veya kış aylarının klasik atıştırmalığı olarak tercih edilir. Kırma zahmetine değecek bir doyum ve tat deneyimi sunan kabuklu ceviz, kabuksuz iç cevize göre daha "ritüelistik" bir tüketim şekli sunar. Kabuk boyutu ve sağlamlığı, seçim aşamasında dikkat edilen kriterlerdir.

### Kullanım Önerisi
Kabuğunu kırıp doğrudan tüketmek için; aile sofralarında ve kış aylarının klasik atıştırmalığı olarak uygundur.

### İçindekiler
- Aday: Ceviz (kabuklu). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (iç kısmı için; işlenmemiş tek bileşenli ürün)

### Alerjen
Ceviz, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; kabuklu formu iç kısmı dış etkenlerden bir ölçüde korur, yine de nemli ortamdan uzak tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Kabuklu Ceviz — Doğal, Kırılarak Tüketilir

### SEO Description
Sert kabuğuyla sunulan doğal ceviz. Kış aylarının klasik atıştırmalığı, 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Kavurga

Sınıf: **B** — İşlenmiş, türü belirli olması muhtemel (geleneksel kavrulmuş tahıl, tam tür teyidi gerekli)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Kavurga, adını doğrudan hazırlık yönteminden alan, kavrulmuş tahıl tanelerinden oluşan geleneksel bir Anadolu çerezidir. Sert ve çıtır bir dış yapıya sahip taneler, kavurma sürecinin yoğun, kızarmış aromasını taşır. Genellikle buğday esaslı olarak bilinen bu çerez türü, sade katkısız haliyle tüketilmeye uygun, minimal işlenmiş bir atıştırmalıktır. Küçük taneli yapısı avuç avuç tüketime uygundur ve genellikle leblebi ile benzer şekilde diğer geleneksel çerezlerle bir arada sunulur. Kavurga, modern atıştırmalıkların aksine sade, katkısız ve köklü bir çerez geleneğini temsil eder. Bu belgede tam tahıl türü ve olası tuz/yağ ilavesi kesinleştirilmedi; ürün etiketinden doğrulanması önerilir.

### Kullanım Önerisi
Tek başına atıştırmalık olarak veya geleneksel çerez karışımlarında diğer kavrulmuş tahıl/baklagillerle birlikte tüketime uygundur.

### İçindekiler
- Aday: Tahıl (muhtemelen buğday — TEYİT GEREKLİ, kavrulmuş). Tuz/yağ ilavesi TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi + tam tür belirsizliği)

### Alerjen
Tam tahıl türü teyit edilmeden kesin alerjen beyanı yapılamaz; buğday ise **gluten** açık bir alerjen olur. Bu belge tam türü varsaymadı — işletmeden doğrulanmalı. Çapraz bulaşma bilgisi de ayrıca teyit edilmeli.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Kavurga — Geleneksel Kavrulmuş Tahıl Çerezi

### SEO Description
Geleneksel tarifle hazırlanan kavurga, köklü çerez kültürünün temsilcisi. 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Tam tahıl türünün teyidi
- Tuz/yağ ilavesi teyidi
- İçindekiler etiketi
- Alerjen (gluten dahil) teyidi
- Menşei bilgisi

---

## Köy leblebisi

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş nohut, iri/rustik hazırlık)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Köy leblebisi, daha iri taneli ve geleneksel yöntemle kavrulduğu düşünülen, rustik bir leblebi çeşididir. Standart leblebiye kıyasla genellikle daha kalın kabuklu ve daha belirgin bir kavrulmuş aroma taşıdığı bilinir; dışı sert, içi unumsu klasik leblebi yapısı burada da korunur. İri tane boyutu, çiğneme deneyimini daha "dolgun" hâle getirir. Köy leblebisi, sade ve az işlenmiş bir çerez arayanlar için geleneksel bir seçenektir; çay sohbetlerinde veya günlük atıştırmalıkta tercih edilir. Kavurma derecesine bağlı olarak renk tonu koyulaşabilir. Ek bir tuzlama olup olmadığı bu açıklamada varsayılmadı, ürün etiketinden doğrulanmalıdır.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, çay sohbetlerinde ve geleneksel çerez tabaklarında tüketime uygundur.

### İçindekiler
- Aday: Nohut (kavrulmuş, iri taneli). Tuz ilavesi TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi referans değerlerini değiştirir)

### Alerjen
Nohut, ana alerjen listesinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, nem çıtırlığı azaltabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Köy Leblebisi — İri Taneli Geleneksel Leblebi

### SEO Description
İri taneli, geleneksel usul köy leblebisi. Çay sohbetlerinin klasik eşlikçisi, 500 g ve 1 kg seçenekleriyle.

### İşletmeden İstenen Bilgiler
- Tuz ilavesi teyidi
- İçindekiler etiketi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Kuru üzüm

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Kuru üzüm, güneşte veya kontrollü ortamda kurutularak elde edilen, doğal tatlılığa sahip bir kuru meyvedir. Buruşuk, koyu amber rengi ve yoğun tatlı-ekşimsi tat profiliyle tanınır; çiğnendiğinde yumuşak, hafif yapışkan bir doku sunar. Kurutma işlemi, üzümdeki şekeri yoğunlaştırarak karakteristik tatlılığı ortaya çıkarır. Tek başına atıştırmalık olarak tüketilebileceği gibi, granola, müsli, yulaf ezmesi, pilav ve hamur işlerinde de sıkça kullanılır. Doğal şeker içeriği yüksek olduğundan küçük porsiyonlarda enerji verici bir atıştırmalık olarak da tercih edilir. Bazı kuru üzüm ürünlerinde yapışmayı önlemek için bitkisel yağ ile kaplama uygulanabilir; bu OSSA ürününde uygulanıp uygulanmadığı bu belgede varsayılmadı.

### Kullanım Önerisi
Doğrudan atıştırmalık, granola/müsli karışımları, pilav ve hamur işi tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kuru üzüm. Tek bileşenli olması muhtemel; ancak yapışmayı önleyici yağ kaplaması veya koruyucu (ör. kükürt dioksit) kullanılıp kullanılmadığı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş/katkısız olduğu teyit edilirse); katkı/kaplama varsa ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ

### Alerjen
Üzüm, ana alerjen listesinde yer almaz. Kükürt dioksit gibi bir koruyucu kullanılmışsa bu ayrıca beyan edilmesi gereken bir bilgidir — kullanılıp kullanılmadığı bu belgede varsayılmadı, işletmeden doğrulanmalı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, nem tanelerin birbirine yapışmasına yol açabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Kuru Üzüm — Doğal Kurutulmuş Üzüm

### SEO Description
Doğal tatlılığa sahip kuru üzüm. Atıştırmalık, granola ve tariflerde kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Yağ kaplaması/koruyucu (kükürt dioksit vb.) kullanımının teyidi
- İçindekiler etiketi
- Menşei bilgisi

---

## Kuş üzümü

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Kuş üzümü, standart kuru üzüme kıyasla çok daha küçük taneli, koyu renkli bir kuru meyve çeşididir. Yoğun tatlı-ekşimsi bir aroma taşır; küçük boyutu nedeniyle bir seferde birçok tane bir arada tüketilir. Kurutulmuş haliyle yumuşak ama biraz daha yoğun/lastiksi bir doku sunar. Sade atıştırmalık olarak tüketilebileceği gibi, kek, kurabiye, granola ve pilav gibi tariflerde küçük boyutu sayesinde eşit dağılım sağlayan bir malzeme olarak tercih edilir. Kuş üzümünün yoğun tadı, tarif içinde az miktarda kullanılsa bile belirgin bir tatlılık katar. Doğal şeker yoğunluğu nedeniyle küçük porsiyonlarda tüketilmesi önerilir.

### Kullanım Önerisi
Doğrudan atıştırmalık, kek/kurabiye içi, granola ve pilav tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kuş üzümü (kuru üzüm). Katkı/kaplama kullanılıp kullanılmadığı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş/katkısız olduğu teyit edilirse); katkı varsa ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ

### Alerjen
Üzüm, ana alerjen listesinde yer almaz. Koruyucu madde kullanımı doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Kuş Üzümü — Küçük Taneli Kuru Meyve

### SEO Description
Küçük taneli, yoğun tatlı aromalı kuş üzümü. Tariflerde ve atıştırmalık olarak 500 g ve 1 kg seçenekleriyle.

### İşletmeden İstenen Bilgiler
- Koruyucu/katkı kullanımının teyidi
- İçindekiler etiketi
- Menşei bilgisi

---

## Menengiç

Sınıf: **B** — İşlenmiş olması muhtemel (kavrulmuş/hazırlanmış menengiç, teyit gerekli)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Menengiç, Antep fıstığının yabani akrabası olarak bilinen, küçük taneli ve kendine özgü reçinemsi bir aromaya sahip geleneksel bir çerezdir. Genellikle kavrulmuş olarak tüketilir; kavurma sürecinde belirgin, biraz baharatımsı ve topraksı bir koku ve tat ortaya çıkar. Küçük ve sert taneli yapısı, çekirdek gibi kabuğuyla ya da iç kısmıyla tüketilebilir (ürün formu teyit edilmeli). Türkiye'nin güneydoğu bölgelerinde köklü bir tüketim geleneği olan menengiç, hem sade bir atıştırmalık hem de menengiç kahvesi gibi geleneksel içeceklerin ham maddesi olarak bilinir. Bu üründe kavurma derecesi, tuzlama ve tam sunum formu (kabuklu/kabuksuz) bu belgede kesinleştirilmedi.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, geleneksel çerez tabaklarında tüketime uygundur.

### İçindekiler
- Aday: Menengiç (kavrulmuş). Kabuklu/kabuksuz formu ve tuz ilavesi TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi + form belirsizliği)

### Alerjen
Menengiç, Antep fıstığı ailesine (Pistacia) yakın bir türdür; fıstık alerjisi olan bireyler için dikkat gerektirebilir — ancak bu ilişkinin ürün etiketinde nasıl beyan edilmesi gerektiği işletmeden doğrulanmalı, bu belgede kesin bir alerjen sınıflandırması yapılmadı. Çapraz bulaşma bilgisi de ayrıca teyit edilmeli.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Menengiç — Geleneksel Kavrulmuş Çerez

### SEO Description
Kendine özgü aromasıyla geleneksel menengiç çerezi. 500 g ve 1 kg seçenekleriyle OSSA'da keşfedin.

### İşletmeden İstenen Bilgiler
- Kabuklu/kabuksuz form teyidi
- Tuz ilavesi teyidi
- İçindekiler etiketi
- Alerjen sınıflandırmasının (Pistacia ailesi ilişkisi) netleştirilmesi
- Menşei bilgisi

---

## Özbek üzümü

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Özbek üzümü, standart kuru üzüme kıyasla genellikle daha iri taneli ve altın-kehribar tonlarında olan bir kuru üzüm çeşididir. Etli ve dolgun tane yapısı, çiğnendiğinde daha "gövdeli" bir doku ve yoğun bir doğal tatlılık sunar. Klasik kuru üzüme göre daha az buruşuk bir görünüme sahip olması, tazelik algısını güçlendirir. Tek başına atıştırmalık olarak tüketilebileceği gibi, granola, müsli, pilav ve tatlı tariflerinde de kullanılır. İri tane yapısı, tariflerde görsel olarak da fark edilir bir katkı sağlar. Doğal şeker yoğunluğu nedeniyle küçük porsiyonlarda tüketilmesi önerilir; ambalaj açıldıktan sonra tazeliğinin korunması saklama koşullarına bağlıdır.

### Kullanım Önerisi
Doğrudan atıştırmalık, granola/müsli karışımları, pilav ve tatlı tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kuru üzüm (iri taneli çeşit). Katkı/kaplama kullanımı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş/katkısız olduğu teyit edilirse); katkı varsa ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ

### Alerjen
Üzüm, ana alerjen listesinde yer almaz. Koruyucu madde kullanımı doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ — ürün adındaki "Özbek" ifadesi, çeşit/ticari adlandırma olabilir; mevzuat anlamında gerçek menşe kanıtı olarak KULLANILMADI.

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Özbek Üzümü — İri Taneli Kuru Üzüm

### SEO Description
İri taneli, altın tonlu Özbek üzümü. Atıştırmalık ve tariflerde kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Menşei bilgisi (ürün adındaki "Özbek" ifadesinin gerçek menşe ile ilişkisi netleştirilmeli)
- Koruyucu/katkı kullanımının teyidi
- İçindekiler etiketi

---

## Pastalık fıstık

Sınıf: **A** — Tek bileşenli/basit (format farkı — kırılmış/toz fıstık)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Pastalık fıstık, tatlı ve hamur işi tariflerinde kullanılmak üzere küçük parçalar hâlinde kırılmış Antep fıstığıdır. Standart fıstık içine kıyasla daha küçük ve düzensiz parça boyutuyla tanınır; bu format, baklava, künefe, kurabiye ve pasta gibi tariflerde eşit dağılım ve kolay serpme imkânı sağlar. Tat ve aroma profili, bütün fıstık tanesiyle aynıdır — yalnızca fiziksel format değişmiştir, ek bir bileşen eklenmez. Yoğun, hafif tatlımsı ve yağlı karakteri, tatlıların üzerine serpildiğinde hem görsel hem tat açısından zenginlik katar. Mutfakta pratiklik arayan, fıstığı kendi kırmak zorunda kalmadan tariflerine ekleyebilmek isteyenler için hazır bir çözüm sunar.

### Kullanım Önerisi
Baklava, künefe, kurabiye ve pasta gibi tatlı/hamur işi tariflerinde serpme veya iç malzeme olarak kullanıma uygundur.

### İçindekiler
- Aday: Antep fıstığı (kırılmış/pastalık format). Tek bileşenli — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (format değişikliği dışında işlenmemiş tek bileşenli ürün)

### Alerjen
Fıstık, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; küçük parça yapısı nedeniyle nem ve havayla temasa karşı ambalajın sıkı kapatılması özellikle önemlidir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Pastalık Fıstık — Kırılmış Antep Fıstığı

### SEO Description
Tatlı ve hamur işi tarifleri için kırılmış pastalık fıstık. 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Patlatmalık mısır

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Patlatmalık mısır, henüz patlatılmamış, sert kabuklu ham mısır tanesidir; ev ortamında patlatılarak popcorn hazırlamak için kullanılır. Sert ve parlak sarı taneleri, doğru ısıtıldığında içindeki nemin buharlaşmasıyla patlayarak hacimce büyük, gevrek bir atıştırmalığa dönüşür. Ham hâliyle uzun raf ömrüne sahip, katkısız bir mutfak malzemesidir. Kendi mısırını patlatmak isteyenler için hem ekonomik hem de tuz/yağ/şeker oranını kendi kontrol etme imkânı sunan bir seçenektir. Aile film geceleri, ev partileri veya günlük atıştırmalık ihtiyacı için pratik bir temel malzemedir. Patlatma yöntemine (tencerede yağla, hava ile patlatma makinesinde vb.) bağlı olarak sonuç ürünün dokusu ve tadı farklılık gösterebilir.

### Kullanım Önerisi
Evde patlatılarak popcorn hazırlığında; tuz, tereyağı veya karamel gibi ek malzemelerle kişiselleştirilebilir.

### İçindekiler
- Aday: Mısır (patlatmalık, çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (ham/işlenmemiş mısır tanesi için; patlatılmış+ek malzemeli hâli için değil)

### Alerjen
Mısır, ana alerjen listesinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; nem tanelerin patlama performansını olumsuz etkileyebilir, ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Patlatmalık Mısır — Evde Popcorn Hazırlığı İçin

### SEO Description
Ham, patlatmalık mısır tanesi. Evde kendi popcorn'unuzu hazırlamak için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Menşei bilgisi
- Çapraz bulaşma teyidi (isteğe bağlı, düşük öncelik)

---

## Salamura kabak

Sınıf: **B** — İşlenmiş, türü belirli (salamura/tuzlu su ile hazırlanmış)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Salamura kabak, kabak çekirdeğinin tuzlu su (salamura) içinde bekletilerek hazırlanan bir çeşididir. Bu hazırlık yöntemi, çekirdeğin dışına belirgin bir tuzlu tat kazandırırken iç kısmın nemli-yumuşak dokusunu bir ölçüde korur. Standart kavrulmuş kabak çekirdeğine kıyasla daha "ıslak" ve tuzlu bir karaktere sahiptir; bu özelliği onu klasik kuru çerezlerden ayıran temel niteliktir. Genellikle kabuğuyla birlikte tüketilir, kabuk çıkarılarak iç kısmına ulaşılır. Sinema, sohbet ortamı veya uzun süreli atıştırmalık molalarında tercih edilen, tuzlu-ıslak doku arayanlar için farklı bir çerez deneyimi sunar. Salamura sürecinin süresi ve tuz oranı gibi detaylar bu açıklamada belirtilmedi; ürün etiketinden doğrulanması önerilir.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, kabuğuyla birlikte çıtlatarak tüketime uygundur.

### İçindekiler
- Aday: Kabak çekirdeği, tuz (su). Tam salamura reçetesi/oranı TEDARİKÇİ ETİKETİYLE doğrulanmalı — bu belgede kesin oran verilmedi.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (salamura işlemi tuz/sodyum içeriğini belirgin şekilde değiştirir)

### Alerjen
Kabak çekirdeği, ana alerjen listesinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; salamura işlemi nedeniyle nem içeriği standart çerezlerden farklı olabileceğinden ambalaj talimatlarına özellikle dikkat edilmesi önerilir (kesin raf ömrü belirtilmedi).

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Salamura Kabak — Tuzlu Su ile Hazırlanmış Çekirdek

### SEO Description
Salamura usulü hazırlanan tuzlu kabak çekirdeği. Farklı bir çerez deneyimi için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Salamura reçetesi/tuz oranı teyidi
- İçindekiler etiketi
- Besin değeri (özellikle sodyum) etiketi
- Menşei bilgisi

---

## Sarı leblebi

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş nohut, klasik)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Sarı leblebi, Türkiye'de en yaygın tüketilen klasik kavrulmuş nohut çerezidir. Sarımsı-bej rengi ve dışı sert, içi unumsu dokusuyla tanınır; kavrulmuş nohudun karakteristik topraksı ve hafif tatlımsı aroması belirgindir. Orta sertlikte bir çiğneme kıvamına sahiptir, ne aşırı sert ne de aşırı yumuşaktır. Türkiye genelinde hemen her çerezcide bulunan bu ürün, günlük atıştırmalık kültürünün en tanıdık isimlerinden biridir. Tek başına tüketilebileceği gibi, kuruyemiş karışımlarında da sıkça yer alır. Kavurma derecesine bağlı olarak renk tonu ve çıtırlık düzeyi hafif değişebilir; taze bir kavurmada tanelerin kırılganlığı belirgin olur.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, çerez tabaklarında ve günlük atıştırmalık ihtiyacında tüketime uygundur.

### İçindekiler
- Aday: Nohut (kavrulmuş). Tuz ilavesi olup olmadığı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi referans değerlerini değiştirir)

### Alerjen
Nohut, ana alerjen listesinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, nem çıtırlığı azaltabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Sarı Leblebi — Klasik Kavrulmuş Nohut

### SEO Description
Türkiye'nin klasik çerezi sarı leblebi, çıtır dokusuyla OSSA'da. 500 g ve 1 kg seçenekleriyle inceleyin.

### İşletmeden İstenen Bilgiler
- Tuz ilavesi teyidi
- İçindekiler etiketi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Şekerli leblebi

Sınıf: **C** — Tedarikçi/etiket verisi gerekli (şeker kaplamalı, reçete bilinmiyor)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Şekerli leblebi, kavrulmuş nohudun şeker kaplamasıyla tatlı bir çerez/şekerlemeye dönüştürüldüğü klasik bir üründür. Dışındaki kırılgan şeker tabakası, içindeki leblebinin çıtır dokusuyla birleşerek hem tatlı hem gevrek bir deneyim sunar. Genellikle beyaz renkli, yuvarlak ve pürüzsüz bir görünüme sahiptir. Şeker kaplaması, leblebinin doğal kavrulmuş aromasını tatlı bir katmanla tamamlar. Çay ve kahve sohbetlerinde, özellikle çocuklu ev ortamlarında ve bayram ikramlarında tercih edilen geleneksel bir tatlı çerezdir. Kaplama tarifinin tam bileşimi (şeker türü, aroma, renklendirici kullanılıp kullanılmadığı) bu belgede varsayılmadı; ürünün gerçek içerik listesi yalnızca tedarikçi/üretim etiketinden doğrulanabilir.

### Kullanım Önerisi
Tek başına tatlı atıştırmalık olarak, çay/kahve sohbetlerinde ve ikram tabaklarında tüketime uygundur.

### İçindekiler
- **TEDARİKÇİ ETİKETİ GEREKLİ** — şeker kaplamasının tam reçetesi (şeker türü, olası aroma/renklendirici/nişasta kullanımı) bilinmediğinden içindekiler listesi bu belgede ÜRETİLMEDİ.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (şeker kaplaması karbonhidrat/şeker değerini belirgin şekilde artırır, reçete bilinmeden sayı verilemez)

### Alerjen
**TEDARİKÇİ ETİKETİ GEREKLİ** — şeker kaplamasında süt ürünü, gluten (nişasta kaynağına bağlı) veya başka katkı bulunup bulunmadığı bilinmiyor; bu belgede hiçbir alerjen iddiası ÜRETİLMEDİ.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; şeker kaplaması nem çektiğinde yapışkanlaşabileceğinden ambalajın sıkıca kapalı tutulması özellikle önemlidir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Şekerli Leblebi — Klasik Tatlı Çerez

### SEO Description
Şeker kaplamalı, çıtır leblebi. Çay sohbetleri ve ikramlar için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Tam içindekiler listesi (şeker kaplama reçetesi)
- Alerjen beyanı
- Besin değeri etiketi
- Menşei bilgisi

---

## Siyah üzüm

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Siyah üzüm, koyu renkli üzüm çeşitlerinin kurutulmasıyla elde edilen, standart kuru üzüme kıyasla daha koyu ve yoğun görünümlü bir kuru meyvedir. Koyu mor-siyah tonu ve yoğun tatlı-ekşimsi tat profiliyle tanınır; kurutma sürecinde şeker yoğunlaşarak belirgin bir tatlılık ortaya çıkar. Dokusu yumuşak ve hafif yapışkandır. Tek başına atıştırmalık olarak tüketilebileceği gibi, granola, müsli, pilav ve tatlı tariflerinde de kullanılır. Koyu rengi, açık renkli kuru üzümlere göre görsel olarak daha belirgin bir kontrast sunar ve karışık kuru meyve tabaklarında dikkat çeker. Doğal şeker yoğunluğu nedeniyle küçük porsiyonlarda tüketilmesi önerilir.

### Kullanım Önerisi
Doğrudan atıştırmalık, granola/müsli karışımları, pilav ve tatlı tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kuru üzüm (siyah/koyu çeşit). Katkı/kaplama kullanımı TEDARİKÇİ ETİKETİYLE doğrulanmalı.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (işlenmemiş/katkısız olduğu teyit edilirse); katkı varsa ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ

### Alerjen
Üzüm, ana alerjen listesinde yer almaz. Koruyucu madde kullanımı doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Siyah Üzüm — Koyu Renkli Kuru Üzüm

### SEO Description
Koyu renkli, yoğun tatlı siyah üzüm. Atıştırmalık ve tariflerde kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Koruyucu/katkı kullanımının teyidi
- İçindekiler etiketi
- Menşei bilgisi

---

## Soslu fıstık

Sınıf: **C** — Tedarikçi/etiket verisi gerekli (soslu/aromalı, reçete bilinmiyor)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Soslu fıstık, klasik fıstık çerezinin bir sos veya baharat karışımıyla zenginleştirilerek hazırlandığı bir çeşittir. Sosun tam bileşimi (baharat türleri, tuz oranı, olası şeker veya asit bileşenleri) bu belgede bilinmediğinden ürünün kesin tat profili genel hatlarıyla tarif edilemez; sosun fıstığın doğal yağlı-tatlımsı karakterine ek bir aroma katmanı eklediği söylenebilir. Bu tür soslu/aromalı çerezler, klasik kavrulmuş fıstıktan farklı, daha "iddialı" bir tat deneyimi arayan tüketiciler için tercih edilir. Sosun kuruma derecesine bağlı olarak dış yüzeyde hafif bir kaplama hissi oluşabilir. Ürünün tam tarifi netleşene kadar bu açıklama sosun genel doğasını (aromalı/tatlandırılmış fıstık) aşan iddialarda bulunmaz.

### Kullanım Önerisi
Tek başına atıştırmalık olarak; kesin tat profili netleşene kadar ikram/tarif önerileri sosun içeriğine bağlı olarak güncellenmelidir.

### İçindekiler
- **TEDARİKÇİ ETİKETİ GEREKLİ** — sosun tam reçetesi (baharat, tuz, şeker, asit vb. bileşenler) bilinmediğinden içindekiler listesi bu belgede ÜRETİLMEDİ. Yalnızca "fıstık" temel bileşen kabul edilebilir, sos bileşimi tahmin edilmedi.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (sos, karbonhidrat/sodyum/yağ değerlerini bilinmeyen ölçüde değiştirir)

### Alerjen
**TEDARİKÇİ ETİKETİ GEREKLİ** — fıstığın kendisi kuruyemiş alerjeni olarak açıktır, ancak sosun içeriğinde süt, gluten, soya, hardal gibi ek alerjenler bulunup bulunmadığı bilinmiyor; bu belgede hiçbir ek alerjen iddiası ÜRETİLMEDİ.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; sos/kaplama nedeniyle standart çerezlerden farklı nem hassasiyeti olabileceğinden ambalaj talimatlarına dikkat edilmesi önerilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Soslu Fıstık — Aromalı Çerez

### SEO Description
Özel sosuyla hazırlanan fıstık çerezi. Farklı bir tat deneyimi için 500 g ve 1 kg seçenekleriyle OSSA'da.

### İşletmeden İstenen Bilgiler
- Sosun tam reçetesi/içindekiler listesi
- Alerjen beyanı (ek bileşenler dahil)
- Besin değeri etiketi
- Menşei bilgisi

---

## Soslu mısır

Sınıf: **C** — Tedarikçi/etiket verisi gerekli (soslu/aromalı, reçete bilinmiyor)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Soslu mısır, kavrulmuş/kurutulmuş mısır tanesinin bir sos veya baharat karışımıyla tatlandırıldığı bir çerez çeşididir. Sosun tam bileşimi bu belgede bilinmediğinden kesin tat profili genel hatlarıyla tarif edilemez; sosun mısırın doğal tahılsı karakterine ek bir aroma katmanı eklediği söylenebilir. Bu tür ürünler genellikle klasik gevrek mısır çerezine kıyasla daha belirgin, tatlandırılmış bir tat sunar. Sos kaplaması, tanelerin dış yüzeyinde hafif bir parlaklık veya renk farkı oluşturabilir. Ürünün tam tarifi netleşene kadar bu açıklama sosun genel doğasını (aromalı/tatlandırılmış mısır) aşan iddialarda bulunmaz.

### Kullanım Önerisi
Tek başına atıştırmalık olarak; kesin tat profili netleşene kadar ikram/tarif önerileri sosun içeriğine bağlı olarak güncellenmelidir.

### İçindekiler
- **TEDARİKÇİ ETİKETİ GEREKLİ** — sosun tam reçetesi bilinmediğinden içindekiler listesi bu belgede ÜRETİLMEDİ. Yalnızca "mısır" temel bileşen kabul edilebilir, sos bileşimi tahmin edilmedi.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (sos, karbonhidrat/sodyum/yağ değerlerini bilinmeyen ölçüde değiştirir)

### Alerjen
**TEDARİKÇİ ETİKETİ GEREKLİ** — mısırın kendisi ana alerjen listesinde yer almaz, ancak sosun içeriğinde süt, gluten, soya gibi alerjenler bulunup bulunmadığı bilinmiyor; bu belgede hiçbir alerjen iddiası ÜRETİLMEDİ.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; sos/kaplama nedeniyle standart çerezlerden farklı nem hassasiyeti olabileceğinden ambalaj talimatlarına dikkat edilmesi önerilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Soslu Mısır — Aromalı Mısır Çerezi

### SEO Description
Özel sosuyla tatlandırılmış mısır çerezi. Farklı bir atıştırmalık deneyimi için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Sosun tam reçetesi/içindekiler listesi
- Alerjen beyanı (ek bileşenler dahil)
- Besin değeri etiketi
- Menşei bilgisi

---

## Tuzsuz sarı leblebi

Sınıf: **B** — İşlenmiş, türü belirli (kavrulmuş nohut, tuzsuz)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Tuzsuz sarı leblebi, klasik sarı leblebinin tuz ilave edilmeden hazırlanan hâlidir. Kavrulmuş nohudun doğal, katkısız aroması burada daha belirgin şekilde öne çıkar; tuzlu versiyona kıyasla daha nötr ve hafif bir tat profili sunar. Dokusu, sert dış yapı ve unumsu iç kısmıyla standart leblebiyle aynıdır. Tuz alımını sınırlamak isteyenler veya leblebinin saf kavrulmuş tadını tercih edenler için uygun bir seçenektir. Tek başına atıştırmalık olarak tüketilebileceği gibi, tuzlu ek yapmak isteyenler kendi tuzlamasını yapabilir. Kavurma derecesine bağlı olarak renk tonu ve çıtırlık düzeyi hafif değişebilir.

### Kullanım Önerisi
Tuz alımını kontrol etmek isteyenler için tek başına atıştırmalık olarak veya kendi tuzlamasını yapmak isteyenler için temel çerez olarak uygundur.

### İçindekiler
- Aday: Nohut (kavrulmuş, tuzsuz). Tek bileşenli olduğu, "tuzsuz" ibaresiyle daha yüksek güvenle önerilebilir.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (kavurma işlemi referans değerlerini değiştirir; sodyum içeriğinin gerçekten sıfır/düşük olduğu ürün etiketinden teyit edilmeli)

### Alerjen
Nohut, ana alerjen listesinde yer almaz. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı, nem çıtırlığı azaltabilir.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Tuzsuz Sarı Leblebi — Katkısız Kavrulmuş Nohut

### SEO Description
Tuz ilave edilmemiş, doğal kavrulmuş leblebi. Tuz alımını sınırlayanlar için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Sodyum içeriğinin ürün etiketinden teyidi
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Yağlı mısır

Sınıf: **B** — İşlenmiş, türü belirli (yağda kavrulmuş/kaplı mısır)
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Yağlı mısır, adından anlaşılacağı gibi hazırlık sürecinde yağ kullanılan bir mısır çerezi çeşididir. Yağ kullanımı, tanelerin dış yüzeyinde hafif parlak bir görünüm ve daha zengin, dolgun bir tat hissi oluşturur; klasik kuru/patlatılmamış mısır çerezlerine kıyasla daha yoğun bir doku sunar. Kullanılan yağ türü ve ek tuzlama olup olmadığı bu açıklamada belirtilmedi. Sinema, sohbet ortamı veya günlük atıştırmalık molalarında tercih edilen, klasik mısır çerezine göre daha "dolgun" bir alternatif arayanlar için uygun bir seçenektir. Yağ oranına bağlı olarak ürünün raf ömrü ve saklama hassasiyeti standart kuru çerezlerden farklılık gösterebilir.

### Kullanım Önerisi
Tek başına atıştırmalık olarak, sohbet ortamlarında ve günlük atıştırmalık molalarında tüketime uygundur.

### İçindekiler
- Aday: Mısır, bitkisel yağ. Yağ türü ve tuz ilavesi TEDARİKÇİ ETİKETİYLE doğrulanmalı — bu belgede kesinleştirilmedi.

### Besin Değerleri
- ÜRÜN/TEDARİKÇİ ETİKETİ GEREKLİ (yağ ilavesi yağ/enerji değerini belirgin şekilde artırır)

### Alerjen
Mısır, ana alerjen listesinde yer almaz. Kullanılan bitkisel yağın türü (ör. soya bazlı olup olmadığı) ve olası ek alerjenler doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; yağ içeriği nedeniyle sıcak ortamlarda acılaşma riski akılda tutulmalı (kesin süre belirtilmedi), ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Yağlı Mısır — Zengin Dokulu Mısır Çerezi

### SEO Description
Yağda hazırlanan, dolgun dokulu mısır çerezi. Sohbet ortamlarının klasiği, 500 g ve 1 kg seçenekleriyle.

### İşletmeden İstenen Bilgiler
- Yağ türünün teyidi
- Tuz ilavesi teyidi
- İçindekiler etiketi
- Alerjen (yağ kaynaklı) teyidi
- Menşei bilgisi

---

## Zar kabuklu kaju

Sınıf: **A** — Tek bileşenli/basit
Mevcut gramajlar: 500 g, 1 kg

### Önerilen Ürün Açıklaması
Zar kabuklu kaju, kavrulmamış, ince bir zar (film tabaka) ile kaplı doğal kaju tanesidir. Standart kavrulmuş kajuya kıyasla daha soluk renkli ve daha yumuşak bir dokuya sahiptir; ince zar tabakası hafif buruk bir nota katarken iç kısmın kremsi, hafif tatlımsı karakterini korur. Doğal ve az işlenmiş bir kaju deneyimi arayanlar için uygundur. Tek başına atıştırmalık olarak tüketilebileceği gibi, kahvaltılık karışımlarda veya vegan süt/krema tariflerinde de kullanılabilir. Zarın varlığı, kajunun doğal, minimum işlenmiş hâlinin bir göstergesi olarak kabul edilebilir. Boyut ve zar bütünlüğü, görsel kalite açısından seçim kriterleri arasındadır.

### Kullanım Önerisi
Doğrudan atıştırmalık, kahvaltılık karışımlar ve vegan süt/krema tariflerinde kullanıma uygundur.

### İçindekiler
- Aday: Kaju (zar kabuklu, çiğ). Tek bileşenli, işlenmemiş ürün — makul güvenle önerilebilir.

### Besin Değerleri
- REFERANS VERİYLE HAZIRLANABİLİR (çiğ/işlenmemiş tek bileşenli ürün)

### Alerjen
Kaju, **kuruyemiş grubunda açık bir alerjendir**. Çapraz bulaşma bilgisi doğrulanmadan varsayılmadı.

### Saklama Koşulları
Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklanmalı; ambalaj açıldıktan sonra ağzı kapalı tutulmalı.

### Menşei
MENŞEİ BİLGİSİ GEREKLİ

### Teslimat
Ortak OSSA teslimat metni kullanılabilir.

### SEO Title
Zar Kabuklu Kaju — Doğal, Az İşlenmiş

### SEO Description
İnce zar kabuklu, kavrulmamış doğal kaju. Atıştırmalık ve tariflik kullanım için 500 g ve 1 kg seçenekleri.

### İşletmeden İstenen Bilgiler
- Alerjen çapraz bulaşma teyidi
- Menşei bilgisi

---

## Genel İşletmeden İstenen Bilgiler (Kategori Geneli)

Ürün bazlı listelerin dışında, TÜM 31 ürünü ilgilendiren ortak teyit ihtiyaçları:

1. **Menşei** — hiçbir üründe gerçek/doğrulanmış menşe bilgisi yok; 31 ürünün tamamı için gerekiyor.
2. **Alerjen çapraz bulaşma** — üretim/paketleme tesisinde hangi alerjenlerin (kuruyemiş, gluten, susam vb.) birlikte işlendiği; tek bir "eser miktarda ... içerebilir" ifadesi tüm kuruyemiş ürünleri için kullanılabilir mi, yoksa ürün bazlı mı farklılaşır — işletmeden netleştirilmeli.
3. **Tuz/yağ/şeker ilaveleri** — B sınıfı 12 üründe (leblebi çeşitleri, kavurga, salamura kabak, yağlı mısır vb.) tam işleme reçetesi bilinmiyor; her biri için ayrı ayrı teyit gerekiyor.
4. **C sınıfı 3 ürün** (Şekerli leblebi, Soslu fıstık, Soslu mısır) — tam içindekiler/reçete olmadan bu ürünlerin PDP'sinde İçindekiler, Besin Değerleri ve Alerjen bölümleri doldurulamaz; öncelikli olarak tedarikçi etiketi istenmeli.
5. **Kuru üzüm ailesi** (Kuru üzüm, Kuş üzümü, Özbek üzümü, Siyah üzüm) — yapışmayı önleyici yağ kaplaması veya kükürt dioksit gibi koruyucu kullanılıp kullanılmadığı.

---

## Yöntem Notu ve Kapsam Dışı Kalanlar

Bu belge yalnızca `cerez` kategorisindeki 31 ACTIVE ürünü kapsar; diğer 5 kategoriye (lokum, kurabiye-sekerleme, cay-kahve, baharat, hurma-kuru-meyve) dokunulmamıştır. Bu ürünlerin gerçek içerik hazırlığı ayrı bir görev/aşamada ele alınmalıdır.

Bu belgede önerilen açıklama/kullanım önerisi metinleri **taslaktır** — DB'ye yazılmadan önce işletme tarafından gözden geçirilmeli, özellikle B/C sınıfı ürünlerde işleme detayları netleştikten sonra güncellenmelidir.
