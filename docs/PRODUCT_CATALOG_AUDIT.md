# OSSA Kuruyemiş — Ürün Kataloğu Veri Kalitesi Denetimi

**Tarih:** 2026-08-13
**Kapsam:** DB'deki tüm `status = ACTIVE` ürünler (136 adet), ilişkili varyant/görsel/kategori/SEO alanları.
**Yöntem:** Salt-okunur SQL sorguları (psql) + Prisma şema/kod incelemesi + Python ile programatik analiz. Hiçbir tabloya `INSERT`/`UPDATE`/`DELETE` uygulanmadı, migration oluşturulmadı, seed dosyası değiştirilmedi.
**Önemli not:** Bu belge yalnızca **mevcut durumun tespitidir**. Hiçbir ürün adı, açıklaması, besin değeri, alerjen, menşei veya fiyatı bu görev kapsamında üretilmedi/tahmin edilmedi/DB'ye yazılmadı.

---

## 1. Özet Tablo

| Sorun | Ürün Sayısı |
|---|---:|
| Açıklama (`description`) — şablondan üretilmiş, ürüne özgü değil | 136 / 136 |
| İçindekiler (`ingredients`) — gerçek veri değil, alan değeri ürünün kendi adı | 136 / 136 |
| Saklama Koşulları — tüm üründe birebir aynı paylaşılan metin | 136 / 136 |
| Görsel — gerçek ürün fotoğrafı yok, otomatik üretilmiş renkli SVG placeholder | 136 / 136 |
| SEO `metaDescription` — tüm üründe aynı kalıp cümle (yalnızca ad değişiyor) | 136 / 136 |
| Grup eşleşmesi yok (mega-menu-content) | 0 / 136 |
| Kategori sorunu (0 veya 2+ ana kategori) | 0 / 136 |
| Varyant/SKU/fiyat teknik hatası (dup SKU, boş SKU, fiyat≤0, gramaj≤0) | 0 / 136 |
| Görsel `alt` metni eksik/primary eksik | 0 / 136 |
| Ürün adı kalite şüphesi (yazım/tutarlılık/kısalık) | ~16 / 136 (bkz. §3) |
| Besin değeri / alerjen / menşei alanı | DB şemasında hiç yok (bkz. §5) |

**Baştan söylenmesi gereken en önemli şey:** Kataloğun 5 sistemik sorunu (açıklama/içindekiler/saklama/görsel/SEO) 136 üründe de **birebir aynı oranda** — çünkü hepsi `prisma/seed.ts` + `src/lib/product-description-generator.ts`'teki **tek bir deterministik şablon üretecinden** geliyor. Bu, tek tek ürün hatası değil, kataloğun tamamının henüz "gerçek içerik" ile doldurulmamış, demo/placeholder aşamasında olduğu anlamına gelir.

---

## 2. Sistemik Bulgular (136 ürünün TAMAMINI etkiler — tek tek tekrar edilmiyor)

### 2.1 Ürün Açıklaması — **ZAYIF** (136/136)
`Product.description` boş değil (0 eksik) ama **136/136 satır**, `generateProductDescription()`'ın kategori başına yalnızca 3 paragraf-çifti × 4 kapanış paragrafından ürettiği şablonla bitiyor (doğrulama: her açıklama, kod içindeki 4 sabit `CLOSING_PARAGRAPHS` metninden biriyle **karakter karakter** bitiyor). Kapanış dağılımı: 38/33/36/29. Ürün adı metne enjekte edildiği için metinler birebir aynı DEĞİL ama iskelet/cümle yapısı ve iddialar aynı kalıptan geliyor — "SEO keyword doldurma" değil ama "her üründe tekrar eden jenerik paragraf" riski gerçek. Sağlık/pazarlama açısından "mükemmel", "en kaliteli", "şifa", "garanti" gibi ifadeler **bulunamadı** (temiz). Yalnızca 16 üründe (lokum/çay-kahve şablonlarında) "…en iyi halini gösterir" gibi düşük riskli, doğru hazırlamaya atıfta bulunan öznel bir ifade var — kıyaslamalı/sağlık iddiası değil, P2 düzeyinde not edilebilir.
→ Sınıf: **ZAYIF** (jenerik, ürüne özgü gerçek bilgi yok; pazarlama diliyle sağlık iddiası riski düşük).

### 2.2 İçindekiler — **EKSİK** (136/136)
`Product.ingredients` alanı **hiçbir üründe boş değil** ama değeri **her zaman ürünün kendi adı** (`ingredients: name` — bkz. `prisma/seed.ts:438`, kodun kendi yorumu: *"Gerçek reçete/bileşen verisi olmadığından hayali içerik üretilmez — görevin belirttiği güvenli yedek: ürünün kendi adı."*). Yani DB'de "İçindekiler: Fıstık ezmesi" gibi bir satır var — gerçek bir bileşen listesi değil. Özellikle soslu ürünler (Soslu fıstık, Soslu mısır), şekerlemeler, lokumlar, çikolatalar, kurabiyeler için bu **kritik** bir eksik.
→ Sınıf: **EKSİK** (gerçek veri yok, güvenli placeholder).

### 2.3 Saklama Koşulları — **ZAYIF/ŞÜPHELİ** (136/136 aynı metin)
`Product.storageConditions`, TÜM ürünlerde `prisma/seed.ts`'teki tek bir `STORAGE_CONDITIONS_TEXT` sabitiyle birebir aynı: *"Ürünü serin, kuru ve doğrudan güneş ışığı almayan bir ortamda muhafaza ediniz…"*. Metnin kendisi güvenli/genel geçer (yanlış bir iddia içermiyor). Ancak ürün türüne özel değil:
- **"Yaş hurma"** için bu genel "kuru ortamda saklayın" metni **ŞÜPHELİ** — taze/yaş bir ürün için soğuk zincir/buzdolabı bilgisi gerekebilir, doğrulanmadan bırakıldı.
- Diğer 135 ürün (kuru gıda: çerez, baharat, lokum, kahve vb.) için metin makul/güvenli.
→ Sınıf: 135 ürün **ZAYIF** (jenerik ama güvenli), 1 ürün (**Yaş hurma**) **ŞÜPHELİ**.

### 2.4 Teslimat Bilgileri — **TAM** (ürün bazlı alan DEĞİL, tek kaynaktan geliyor)
`Product` şemasında `deliveryInfo` diye bir alan **yok**. PDP'deki "Teslimat Bilgileri" bölümü `src/lib/delivery-info.ts::getDeliveryInformationText()`'ten, tek merkezi kaynaktan (`FREE_SHIPPING_THRESHOLD_TRY = 1500`) geliyor, tüm ürünlerde aynı. İçerik kontrol edildi: **kaynağı olmayan kesin bir teslim süresi iddiası ("1-3 iş günü", "aynı gün kargo" vb.) YOK** — metin bilinçli olarak "teslimat süresi… değişebilir" diyor. ₺1.500 eşiği doğru kaynaktan okunuyor, ₺120 standart ücret metinde açıkça yazmıyor ama çelişmiyor de.
→ Sınıf: **TAM**, iş kuralıyla çelişki yok.

### 2.5 Görseller — **EKSİK** (136/136 gerçek fotoğraf değil)
Yapısal olarak (primary var mı, alt var mı, tek görsel mi) **hepsi kusursuz**: 136 üründe 136 görsel, 136/136 `isPrimary=true`, 136/136 dolu ve ürün adıyla eşleşen `altText`, hiç kırık URL yok, hiç aynı görselin iki farklı üründe kullanıldığı durum yok. **Ancak** her görsel `public/images/products/{slug}.svg` yolunda, gerçek fotoğraf DEĞİL — düz renkli dikdörtgen + ürün adı yazısından oluşan otomatik üretilmiş placeholder (örnek incelendi, ~370-420 bayt, salt metin+renk). **Gerçek ürün fotoğrafı: 0/136.**

**Sayılar (görev formatı):**
```
Görseli Tam Ürün Sayısı (yapısal - primary+alt dolu): 136
Görseli Eksik Ürün Sayısı (hiç görseli olmayan):        0
Alt Metni Eksik:                                         0
Primary Eksik:                                           0
Gerçek fotoğrafı olan ürün sayısı:                       0 / 136
```

### 2.6 SEO — metaTitle **TAM**, metaDescription **ŞÜPHELİ (şablon)**
- `metaTitle`: 136/136 dolu, hepsi = ürün adı (kök `layout.tsx`'teki `title.template` zaten " | OSSA Kuruyemiş" ekliyor — çift marka tekrarı yok, tasarım kasıtlı). 60 karakteri aşan yok. **Duplicate yok** (isimler tekil olduğundan).
- `metaDescription`: 136/136 dolu ama **136/136'sı** birebir aynı kalıp: `"{ad} ürününü OSSA Kuruyemiş'te inceleyin. Taze, güvenilir alışveriş ve hızlı kargo."` (yalnızca `{ad}` değişiyor). Literal duplicate string sayısı 0 (ad farklı olduğu için), ama SEO açısından **ayırt edici değer neredeyse yok** — arama motoru için 136 sayfa da aynı kalıp cümleyi taşıyor. "hızlı kargo" ifadesi somut bir süre vaat etmiyor (○ "1-3 gün" gibi bir iddia yok) ama doğrulanmamış bir hız iması taşıyor — düşük risk, P2.
- Slug'lar: 136/136 temiz (Türkçe karaktersiz, `[a-z0-9-]`), duplicate yok (DB `@unique`).
→ Sınıf: metaTitle **TAM**, metaDescription **ŞÜPHELİ (şablon/düşük ayırt edicilik)**.

---

## 3. Ürün İsmi Kalitesi — Aday Düzeltmeler (yalnızca RAPOR, otomatik değiştirilmedi)

Otomatik kontroller (çift boşluk, baş/son boşluk, küçük harfle başlama, ada gömülü gramaj) **hiçbir üründe** bulgu vermedi — bu açıdan liste temiz. Manuel/karşılaştırmalı incelemede şu **tutarlılık** şüpheleri bulundu (yazım hatası iddiası değil, çoğu marka/stil kararı):

| # | Mevcut | Önerilen | Neden |
|---|---|---|---|
| 1 | `Nescafe 48'li` | `Nescafé 48'li` (doğrulanmalı) | Marka adının resmî yazımı aksanlı "é" içerir; DB'de aksansız. Bilinçli bir sadeleştirme mi yoksa eksik karakter mi belirsiz — **İNCELENMELİ**. |
| 2 | `Elvan Iceberg` | değiştirilmesin, doğrulansın | Katalogdaki tek İngilizce/Latin yazımlı ürün adı (marka ürünü olabilir). Yanlış olduğuna dair kanıt yok — sadece kataloğun geri kalanından biçim olarak farklı. **İNCELENMELİ**, tahmini "doğru" biçim üretilmedi. |
| 3 | `Konak Mandule` | değiştirilmesin, doğrulansın | "Mandule" yaygın bir Türkçe sözcük değil; yazım hatası mı marka/ürün terimi mi emin değilim — **İNCELENMELİ**, tahmin üretilmedi. |
| 4 | `M hurma` | anlamlı bir açık isim önerilir (ör. "M Boy Hurma") | Tek harfli kısaltma, müşteri için anlamsız/belirsiz. Gerçek anlamı (Medium/marka kodu?) bilinmediğinden önerilen isim UYDURULMADI — yalnızca "netleştirilmeli" olarak işaretleniyor. |
| 5 | `OSSA Antep Fıstıklı Lokum`, `OSSA Fındıklı Lokum`, `OSSA Kahve Çeşnisi` | tutarlılık kararı gerekli | Kataloğun yalnızca **3 üründe** "OSSA" marka öneki var, diğer 133 üründe yok (ör. aynı kategoride "Fındıklı lokum" önekssiz, "OSSA Fındıklı Lokum" önekli — iki ayrı üründe kısmen örtüşen isim). Ya tüm katalog markalanmalı ya da bu 3 üründen kaldırılmalı — iş kararı gerekiyor. |
| 6 | 13 ürün Title Case (`Elit Baton Çikolata`, `Elit Royal Fındıklı`, `Fondante Çikolata`, `Kalpli Gülen Yüz Çikolata`, `Konak Çikolata`, `Konak Fındık Çikolata`, `Konak Mandule`, `Ülker Toffe`, `Yummy Şeker`, + yukarıdaki 3 "OSSA" ürünü + Elvan Iceberg) | değişiklik gerekmeyebilir | Bu 13 ürün *Her Kelimenin Büyük Harfle* yazılmış, kalan 95 ürün cümle biçiminde ("Badem şekeri"). Örtüşme neredeyse tamamen "marka adı içeren ürünler" ile birebir — muhtemelen **kasıtlı** (marka + ürün adı → Title Case). Yine de tek bir yazım kuralına bağlanması önerilir. |
| 7 | `Fırt fıstık` / `Çiğ fırt fıstık` | değiştirilmesin | "Fırt" bölgesel/piyasa terimi olabilir (kavrulmuş küçük fıstık); yazım hatası olduğuna dair güvenilir bir kanıtım yok — **düzeltme önerilmiyor**, yalnızca not düşülüyor. |

**Duplicate/near-duplicate isim taraması** (normalize edilmiş tam eşleşme): **0 kesin duplicate.** Fuzzy benzerlik (yalnızca rapor amaçlı, DB eşleştirmede KULLANILMADI) en yüksek skorlu 12 çift bulundu (ör. `Bol cevizli bandırma lokumu` ↔ `Cevizli bandırma lokumu`, `Badem şekeri` ↔ `Lüx badem şekeri`, `Fındıklı lokum` ↔ `Fındıklı mini lokum`/`Fındıklı yaprak lokum`/`OSSA Fındıklı Lokum`) — incelendiğinde bunların **gerçek, birbirinden farklı ürün çeşitleri** (gramaj/tarif/marka varyasyonu) olduğu görülüyor; **kesin veya güçlü duplicate aday YOK**.

---

## 4. Varyant / Gramaj / Fiyat Denetimi

Tüm 167 varyant tek tek tarandı — **teknik anlamda tamamen temiz**:

- Varyantsız ürün: **0**
- Tüm varyantları pasif (satın alınamaz) ürün: **0**
- Aynı üründe tekrarlayan gramaj: **0**
- Duplicate SKU (global): **0**
- Boş SKU: **0**
- `weightGram ≤ 0`: **0**
- `price ≤ 0` veya null: **0**
- Gramaj etiketi (`"500 g"`/`"1 kg"`) ile `weightGram` sayısal değeri uyumsuzluğu: **0**

**Desen (anomali DEĞİL, kasıtlı tasarım):** 31 ürün (kategori: **yalnızca cerez**, 31/31) 2 varyantlı (250 g + 1 kg), kalan 105 ürün (diğer 5 kategori) tek varyantlı. Kullanılan gramaj etiketleri: 100 g (19), 250 g (47), 400 g (27), 500 g (43), 1 kg (31) — tümü standart, format tutarsızlığı yok.

**Fiyat:** Kategori başına dar bir aralıkta (ör. baharat ₺24,9–₺32,9; cerez ₺224,9–₺457,9), gram başı fiyatta kategori medyanının 3 katını aşan/altında kalan tek bir aykırı değer bulunamadı. **Önemli:** `prisma/seed.ts` bu fiyatları `basePricePer100g` sabitinden **formülle** üretiyor ve kod içinde açıkça *"DEMO fiyat tabanı… gerçek tedarik veya piyasa fiyatını temsil etmez"* diyor — yani 136 ürünün TAMAMI şu an sentetik/demo fiyatlı, gerçek maliyet/piyasa verisi girilmemiş. Bu, teknik bir hata değil ama gerçek satışa geçmeden önce **P0** düzeyinde doldurulması gereken bir alan.

**İndirim (`resolveVariantPricing` kurallarıyla):** `discountPrice ≥ price`, geçersiz tarih aralığı, `isDiscountActive=true` iken `discountPrice=null` gibi hiçbir çelişki bulunamadı. Şu an **1 varyantta** (`Çiğ badem / 1 kg`, ₺457,90 → ₺400,00, 2026-08-13 15:09–2026-08-19 15:09) gerçek, geçerli bir aktif indirim var — bilgi amaçlı not edildi, **dokunulmadı**.

---

## 5. Besin Değeri / Alerjen / Menşei / Sağlık İddiaları

`Product` ve `ProductVariant` şeması incelendi: **kalori, protein, yağ, karbonhidrat, lif, tuz, alerjen, menşei, üretici/paketleyici veya "sağlık faydası" için DB'de hiçbir alan YOK.** Bu veriler şu an ne DB'de ne de kodda (component/type) hiçbir yerde tutulmuyor — yani "eksik veri" değil, "henüz modellenmemiş veri". Görev talimatına uygun olarak **hiçbir değer üretilmedi/internetten alınmadı**.

→ **DOĞRULAMA GEREKİYOR:** Bu alanlar ileride gerçek ambalaj/tedarikçi etiketinden girileceği için önce şemaya (muhtemelen `NutritionInfo`/`AllergenInfo` gibi ayrı, opsiyonel bir model olarak) eklenmesi, sonra ürün ürün gerçek etiket verisiyle doldurulması gerekiyor. Bu görev kapsamında şema değişikliği **yapılmadı**.

---

## 6. Kategori / Grup Doğrulama

- Her ürün **tam 1** ana kategoriye bağlı: **136/136** ✅ (SQL ile doğrulandı: `ProductCategory` sayısı ≠ 1 olan ürün: 0)
- 0 kategorili ürün: **0** ✅
- 2+ kategorili ürün: **0** ✅ (`ProductCategory.productId @unique` DB kısıtı hâlâ yürürlükte)
- Mega-menu grup eşleşmesi olmayan ürün: **0 / 136** ✅ — kategori-grup yapısı önceki iki görevde düzeltildiği hâliyle **tam** korunuyor, bu görevde değiştirilmedi.
- Özel doğrulama: **Elvan Iceberg → Kurabiye & Şekerleme / Çikolatalar** ✅, **Toz kekik → Baharat / Ot Baharatları** ✅, **Pestil → Hurma & Kuru Meyve / Geleneksel Tatlılar** ✅ — üçü de bir önceki görevde eklenen doğru gruplarında.

---

## 7. Duplicate / Benzer Ürünler

Bkz. §3 sonu — kesin duplicate **0**, güçlü duplicate adayı **0**. Bulunan 12 fuzzy-benzer çiftin tamamı incelendiğinde gerçek, birbirinden farklı ürünler (aynı ana ürünün farklı gramaj/tarif/marka çeşitleri) olduğu görülüyor.

---

## 8. PDP Hazırlık Skoru

Kriterler: açıklama, içindekiler, saklama, görsel, fiyat, varyant, kategori (besin değeri zorunlu alan sayılmadı).

| Skor | Ürün Sayısı | Gerekçe |
|---|---:|---|
| A — Yayına hazır | 0 | Hiçbir üründe gerçek fotoğraf ve gerçek içindekiler verisi yok. |
| B — Küçük eksikler | 0 | — |
| **C — İçerik çalışması gerekli** | **136** | Fiyat/varyant/kategori TAM; açıklama şablon, içindekiler placeholder, görsel placeholder — üçü birden gerçek içerik gerektiriyor. |
| D — Kritik veri eksik | 0 | Hiçbir üründe satışı engelleyen eksik yok (fiyat/varyant/kategori hepsi dolu ve tutarlı). |

**136/136 ürün aynı objektif nedenle C sınıfında** — bu, ürünler arası bir kalite farkı değil, kataloğun *tamamının* aynı üretim (seed) aşamasında olmasından kaynaklanıyor. §3'teki ~16 isim şüphesi PDP skorunu değiştirmiyor (isim mevcut, okunabilir, yalnızca stil/tutarlılık notu).

---

## 9. Admin Paneli — `/yonetim/urunler/[id]` Düzenleme Kapsamı

Kod incelendi (`src/components/admin/product-admin-form.tsx`, `src/actions/admin-products.ts`).

| Alan | Düzenlenebilir mi? | Not |
|---|---|---|
| Ürün adı (`name`) | ❌ Hayır | Yalnızca oluşturmada girilir, edit formunda alan yok. |
| Slug | ❌ Hayır | Aynı şekilde yalnızca oluşturmada. |
| Ana Kategori | ✅ Evet | Bu denetimden bir önceki görevde eklendi (tek `<select>`, yalnızca aktif kategoriler). |
| Ürün Açıklaması | ✅ Evet | `description` textarea. |
| Kısa Açıklama | ✅ Evet | `shortDescription` textarea. |
| İçindekiler | ✅ Evet | `ingredients` textarea (ama gerçek veri girmek admin'in elinde — sistem hâlâ placeholder tutuyor). |
| Saklama Koşulları | ✅ Evet | `storageConditions` textarea. |
| Teslimat Bilgileri | ➖ Yok (ürün bazlı alan değil) | Zaten DB'de yok, tek kaynaktan geliyor (bkz. §2.4) — beklenen davranış. |
| Görseller (ekleme/değiştirme) | ❌ Hayır | Yalnızca oluşturmada yüklenir; edit formunda görsel alanı YOK — bir ürünün fotoğrafı hatalıysa DEĞİŞTİRİLEMİYOR. |
| `imageAlt` | ❌ Hayır | Aynı nedenle. |
| Varyant ekleme/çıkarma | ❌ Hayır | Yalnızca oluşturmada tanımlanır. |
| Gramaj (`weightGram`) | ❌ Hayır | Edit formunda yok. |
| Normal fiyat (`price`) | ❌ Hayır | Edit formunda yalnızca **indirim** alanları var, normal fiyat değiştirilemiyor. |
| SKU | ❌ Hayır | Edit formunda yok. |
| İndirim (`discountPrice`/tarih/aktif) | ✅ Evet | Varyant başına düzenlenebilir. |
| SEO (`metaTitle`/`metaDescription`) | ❌ Hayır | Yalnızca oluşturmada girilir; edit formunda yok — seed her çalıştığında bu ikisini koşulsuz ezdiği için de zaten admin düzenlemesi kalıcı olmazdı. |
| OSSA Öneriyor (`isRecommended`) | ✅ Evet | Checkbox. |
| Yeni rozeti override | ✅ Evet | Select. |

**En kritik eksik:** Bir ürünün **adı, görselleri, gramaj/fiyat/SKU'su ve SEO alanları oluşturulduktan sonra hiçbir admin ekranından değiştirilemiyor.** Bu denetimde tespit edilen 136 placeholder görsel ve 16 isim şüphesi gibi bulguların **hiçbiri şu anki admin panelinden düzeltilemez** — ya doğrudan DB/seed müdahalesi ya da form genişletmesi gerekir (bu görevin kapsamı dışında, form genişletilmedi).

---

## 10. Öncelik Sıralaması

### Öncelik P0 — Satışı/veri doğruluğunu bozanlar
1. **Fiyatlar tamamen sentetik/demo** (`basePricePer100g` formülü) — gerçek tedarik/piyasa fiyatı girilmeden canlıya çıkılamaz.
2. **İçindekiler alanı gerçek veri değil** (136/136 = ürün adı) — özellikle soslu ürün/şekerleme/lokum/çikolata/kurabiye/karışımlarda alerjen riski açısından **kritik**.
3. Admin panelinden ürün adı/görsel/gramaj/fiyat/SKU/SEO **hiç düzenlenemiyor** — herhangi bir düzeltme yalnızca yeni seed/DB müdahalesiyle mümkün.

### Öncelik P1 — PDP kalitesini ciddi etkileyenler
4. **136/136 ürün görseli gerçek fotoğraf değil**, placeholder SVG.
5. Açıklama/saklama koşulları şablon kaynaklı, ürüne özgü gerçek bilgi içermiyor.
6. `Yaş hurma` için jenerik "kuru ortamda saklayın" metni ürün türüyle çelişebilir — doğrulanmalı.
7. "OSSA" marka öneki yalnızca 3 üründe tutarsız kullanılıyor.

### Öncelik P2 — SEO/görsel/içerik polish
8. `metaDescription` 136/136 aynı kalıp cümle — ayırt edicilik düşük.
9. `Nescafe 48'li`, `Elvan Iceberg`, `Konak Mandule`, `M hurma` isim/yazım doğrulaması.
10. Title Case/sentence case tutarlılığı (13 ürün).
11. Açıklamalardaki "…en iyi halini gösterir" gibi düşük riskli öznel ifadeler.
12. `shelfLifeDays` alanı 136/136 boş ve zaten hiçbir yerde render edilmiyor (ölü alan, düşük öncelik).

---

## 11. Kategori Bazlı Bireysel Bulgular

Sistemik 5 sorun (§2) her kategoride %100 oranında geçerli olduğundan burada tekrar edilmiyor. Yalnızca **kategoriye/ürüne özgü** ek bulgular:

- **Hurma & Kuru Meyve:** `Yaş hurma` → saklama koşulu ŞÜPHELİ (§2.3). `M hurma` → isim belirsiz (§3).
- **Çay & Kahve:** `Nescafe 48'li` → marka yazımı doğrulanmalı (§3). `OSSA Kahve Çeşnisi` → marka öneki tutarsızlığı (§3).
- **Lokum:** `OSSA Antep Fıstıklı Lokum`, `OSSA Fındıklı Lokum` → marka öneki tutarsızlığı (§3).
- **Kurabiye & Şekerleme:** `Elvan Iceberg` → biçim doğrulaması (§3); `Konak Mandule` → terim doğrulaması (§3); 9 ürün Title Case stil notu (§3).
- **Çerez, Baharat:** Bireysel ek bulgu yok — yalnızca sistemik 5 sorun geçerli.

---

## Yöntem Notu

Bu belge; `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/product-description-generator.ts`, `src/lib/mega-menu-content.ts`, `src/lib/delivery-info.ts`, `src/lib/product-pricing.ts`, `src/components/admin/product-admin-form.tsx`, `src/actions/admin-products.ts` kaynak kodu okunarak ve dev veritabanına karşı salt-okunur SQL sorgularıyla (136 ürün, 167 varyant, 136 görsel, tam tarama) hazırlanmıştır. Hiçbir satır değiştirilmedi/eklenmedi/silinmedi.
