# Ürün Bilgisi Araştırma Raporu (Dry-Run)

**Tarih:** 2026-08-26
**Durum:** Bu aşamada **DB'ye, Prisma şemasına, seed'e, PDP'ye veya admin'e hiçbir yazma/kod değişikliği yapılmadı.** Bu belge yalnızca araştırma + dry-run raporudur. Bir sonraki (yazma yapılacak) aşama için kullanıcı onayı bekliyor.

---

## 1. Mevcut Veri Modeli ve Sistemin İncelenmesi

### 1.1 `Product` şemasında hâlihazırda bulunan alanlar (`prisma/schema.prisma`)
`name`, `slug`, `shortDescription`, `description`, `ingredients`, `storageConditions`, `deliveryInfo` (ürüne özgü teslimat metni override'ı, `null` ise ortak metin kullanılır), `shelfLifeDays` (`Int?`, şemada var ama **admin formunda düzenlenebilir değil**), `isFeatured`, `isRecommended`, `newBadgeOverride`, `sortOrder`, `status`, `metaTitle`, `metaDescription`.

### 1.2 HİÇBİR karşılığı OLMAYAN alanlar
- **Alerjen** (structured field) — yok.
- **Besin değerleri** (enerji/yağ/karbonhidrat/protein/tuz vb.) — yok.
- **Menşe** — yok.
- **Kullanım/servis önerisi** (yapılandırılmış alan) — yok; şu an yalnızca serbest metin `description` içine gömülebilir.
- **Kaynak izlenebilirliği** (`nutritionSourceName`/`nutritionSourceUrl`/`nutritionReferenceType` vb.) — yok.

### 1.3 Mevcut içerik deseni
`ingredients` alanı **143 ürünün 143'ünde de** yalnızca ürünün kendi adı (`ingredients: name`, `prisma/seed.ts`) — gerçek bir bileşen listesi hiçbir zaman girilmemiş. `description`/`shortDescription` şablon-üretilmiş, ürüne özgü gerçek bir pazarlama/ürün bilgisi metni değil (`generateProductDescription()`, `src/lib/product-description-generator.ts`). `storageConditions` **tüm ürünlerde birebir aynı tek paragraf** (ürün türüne özgü değil).

### 1.4 `product-information-section.tsx` (PDP)
Şu an yalnızca **4 sabit bölüm** render ediyor: Ürün Açıklaması, İçindekiler, Saklama Koşulları, Teslimat Bilgileri. Bileşenin kendi kod yorumu bunu doğruluyor: *"Gelecekte besin/alerjen/menşei gibi yeni alanlar eklendiğinde de aynı koşullu-render deseniyle sorunsuz genişler"* — yani mimari bu genişlemeye **zaten hazır**, yalnızca veri/alan eksik.

### 1.5 Admin ürün düzenleme formu (`product-admin-form.tsx`)
Düzenlenebilir alanlar şemayla birebir aynı: name, slug, categoryId, status, isRecommended, newBadgeOverride, shortDescription, description, ingredients, storageConditions, deliveryInfo, metaTitle, metaDescription. Alerjen/besin/menşe için hiçbir form alanı yok (çünkü şemada karşılığı yok).

**Sonuç: ikinci bir paralel model kurulmadı — bu raporun önerileri (bkz. §10) mevcut `Product` modelinin doğrudan genişletilmesi şeklindedir.**

---

## 2. Kaynak Önceliklendirme Notu

Araştırmada **USDA FoodData Central** (`fdc.nal.usda.gov`, resmi API `api.nal.usda.gov/fdc/v1`) birincil kaynak olarak kullanıldı — İngilizce/Amerikan resmi veri tabanı olmakla birlikte, T.C. Tarım ve Orman Bakanlığı'nın ürün-bazlı halka açık, aranabilir bir besin değeri veri tabanı bulunmadığından (yalnızca mevzuat/tebliğ metinleri mevcut, ürün-özel numerik veri değil), uluslararası kabul görmüş en yüksek otorite USDA FDC'dir (görev talimatındaki öncelik sırası #3). USDA'nın DEMO_KEY API anahtarı oturum sırasında saatlik kotaya takıldı (429/Retry-After ~11 saat); bu noktadan sonra USDA verisini **doğrudan yeniden yayınlayan, FDC ID'si açıkça belirtilen ayna siteler** (myfooddata.com, foodstruct.com, triagemethod.com vb. — hepsi ham USDA SR Legacy/Foundation verisini tablolaştırır) üzerinden devam edildi. Her satırda hangi yöntemin kullanıldığı (`USDA API doğrudan` / `USDA verisi, ayna site üzerinden`) belirtilmiştir. Bazı yerel/geleneksel ürünler (sumak, çörekotu, ıhlamur/papatya/ıspanaklı gibi kuru çiçek çayları) için USDA'da doğrudan karşılık **yok** veya yalnızca "demlenmiş" (brewed) hâli var — bu durumlar açıkça **LOW** güven olarak işaretlendi, uydurulmadı.

**Kritik düzeltme (görevin kendi "körü körüne kullanma" uyarısını doğrulayan somut örnek):** OSSA ürünü **"Yedibahar"**, ilk bakışta Türkçedeki "allspice" karşılığı **"Yenibahar"** (Pimenta dioica, tek baharat) ile karıştırılabilir. Ancak araştırma, Türkiye perakende pazarında **"Yedibahar" adıyla satılan ürünlerin fiilen bir KÖFTE BAHARAT KARIŞIMI** (ör. "Yedibahar Yedi Türlü Baharat", çoklu baharat karışımı) olduğunu gösterdi. Bu yüzden Yedibahar, tahmin edilenin aksine **A değil C (RECIPE_REQUIRED)** sınıfına alındı — OSSA'nın ürününün gerçekten Yenibahar (tek baharat) mı yoksa bir karışım mı olduğu **OSSA'dan doğrulanmadan** varsayılmadı.

---

## 3. ÖZET TABLO — TÜM 143 ACTIVE ÜRÜN

Lejant: **Sınıf** A=SINGLE_INGREDIENT_REFERENCE_SAFE, B=PROCESS_VARIANT_REVIEW, C=RECIPE_REQUIRED. **Güven**: H=HIGH, M=MEDIUM, L=LOW, RR=RECIPE_REQUIRED, MIR=MANUFACTURING_INFO_REQUIRED, SIR=SUPPLIER_INFO_REQUIRED.

| Ürün (slug) | Kategori | Sınıf | Açıklama | İçindekiler | Alerjen | Besin | Saklama | Menşe |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| antep-fistigi | Çerez | B | H | H | H | M | H | SIR |
| beyaz-leblebi | Çerez | B | H | H | H | M | H | SIR |
| bugday | Çerez | B | H | H | H | L | H | SIR |
| ceviz-ici | Çerez | A | H | H | H | H | H | SIR |
| cig-badem | Çerez | A | H | H | H | H | H | SIR |
| cig-findik-ici | Çerez | A | H | H | H | H | H | SIR |
| cig-firt-fistik | Çerez | A | H | H | H | M | H | SIR |
| cig-kabak | Çerez | A | H | H | H | H | H | SIR |
| cig-kaju | Çerez | A | H | H | H | H | H | SIR |
| citir-leblebi | Çerez | B/C | H | RR | RR | RR | H | SIR |
| dakota-cekirdek | Çerez | B | M | M | H | M | H | SIR |
| firt-fistik | Çerez | B | H | H | H | M | H | SIR |
| fistik-ici | Çerez | B | H | H | H | M | H | SIR |
| kabak-cekirdegi | Çerez | B | H | M | H | M | H | SIR |
| kabuklu-ceviz | Çerez | A | H | H | H | H | H | SIR |
| karisik-cerez | Çerez | C | H | RR | RR | RR | H | RR |
| kavurga | Çerez | C | H | RR | RR | RR | H | SIR |
| koy-leblebisi | Çerez | B | H | M | H | M | H | SIR |
| kuru-uzum | Çerez | A | H | H | H | H | H | SIR |
| kus-uzumu | Çerez | A | H | H | H | H | H | SIR |
| luks-karisik | Çerez | C | H | RR | RR | RR | H | RR |
| menengic | Çerez | B | M | M | M | L | H | SIR |
| mix-cerez | Çerez | C | H | RR | RR | RR | H | RR |
| ozbek-uzumu | Çerez | A | M | H | H | M | H | SIR |
| pastalik-fistik | Çerez | A | H | H | H | M | H | SIR |
| patlatmalik-misir | Çerez | A | H | H | H | H | H | SIR |
| salamura-kabak | Çerez | B | H | M | H | L | H | SIR |
| sari-leblebi | Çerez | B | H | M | H | M | H | SIR |
| sekerli-leblebi | Çerez | C | H | RR | RR | RR | H | SIR |
| siirt-fistigi | Çerez | B | H | H | H | M | H | SIR |
| siyah-uzum | Çerez | A | M | H | H | M | H | SIR |
| soslu-fistik | Çerez | C | H | RR | RR | RR | H | SIR |
| soslu-misir | Çerez | C | H | RR | RR | RR | H | SIR |
| spesiyal-karisik | Çerez | C | H | RR | RR | RR | H | RR |
| tuzsuz-sari-leblebi | Çerez | B | H | M | H | M | H | SIR |
| yagli-misir | Çerez | C | H | RR | RR | RR | H | SIR |
| zar-kabuklu-kaju | Çerez | A | H | H | H | H | H | SIR |
| cemen-tozu | Baharat | A | H | H | H | M | H | SIR |
| corekotu | Baharat | A | H | H | H | L | H | SIR |
| susam | Baharat | A | H | H | H | H | H | SIR |
| hindistan-cevizi | Baharat | A | H | H | H | H | H | SIR |
| isot | Baharat | B | H | M | H | L | H | SIR |
| karabiber | Baharat | A | H | H | H | H | H | SIR |
| karanfil | Baharat | A | H | H | H | H | H | SIR |
| kekik | Baharat | A | H | H | H | M | H | SIR |
| kimyon | Baharat | A | H | H | H | L | H | SIR |
| kori | Baharat | C | H | RR | RR | RR | H | RR |
| limon-tuzu | Baharat | A | H | H | H | H | H | SIR |
| maras-tarhanasi | Baharat | C | H | RR | RR | RR | H | RR |
| nane | Baharat | A | H | H | H | H | H | SIR |
| pul-biber | Baharat | B | H | M | H | M | H | SIR |
| toz-biber | Baharat | B | H | M | H | M | H | SIR |
| toz-kekik | Baharat | A | H | H | H | M | H | SIR |
| toz-tarcin | Baharat | A | H | H | H | H | H | SIR |
| yayla-sumagi | Baharat | A | M | H | H | L | H | SIR |
| yedibahar | Baharat | **C** | H | RR | RR | RR | H | RR |
| atom-cay-cesitleri | Çay & Kahve | C | L | RR | RR | RR | M | RR |
| biberiye-cayi | Çay & Kahve | A | H | H | H | L | H | SIR |
| cubuk-tarcin | Çay & Kahve | A | H | H | H | H | H | SIR |
| hibiskus-cayi | Çay & Kahve | A | H | H | H | L | H | SIR |
| ihlamur | Çay & Kahve | A | H | H | H | L | H | SIR |
| kis-cayi | Çay & Kahve | C | M | RR | RR | RR | H | RR |
| nescafe-48-li | Çay & Kahve | C(branded) | M | MIR | MIR | MIR | H | MIR |
| osmanli-dibek-kahvesi | Çay & Kahve | A | H | H | H | L | H | SIR |
| ossa-kahve-cesnisi | Çay & Kahve | C | L | RR | RR | RR | H | RR |
| papatya-cayi | Çay & Kahve | A | H | H | H | L | H | SIR |
| rezene | Çay & Kahve | A | H | H | H | M | H | SIR |
| turk-kahvesi | Çay & Kahve | A | H | H | H | L | H | SIR |
| yesil-cay | Çay & Kahve | A | H | H | H | L | H | SIR |
| zencefil | Çay & Kahve | A | H | H | H | M | H | SIR |
| zerdecal | Çay & Kahve | A | H | H | H | M | H | SIR |
| bonbon-hurma | Hurma & Kuru Meyve | C | M | RR | RR | RR | H | SIR |
| domates-kurusu | Hurma & Kuru Meyve | B | H | M | H | M | H | SIR |
| incir-kurusu | Hurma & Kuru Meyve | A | H | H | H | M | H | SIR |
| jumbo-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| kayisi-kurusu | Hurma & Kuru Meyve | A/B | H | M | H | M | H | SIR |
| luks-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| luks-suudi-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| m-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| paket-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| pestil | Hurma & Kuru Meyve | C | M | RR | RR | RR | H | SIR |
| premium-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| yas-hurma | Hurma & Kuru Meyve | A | M | H | H | M | H | SIR |
| antep-mini-cezerye | Lokum | C | M | RR | RR | RR | H | RR |
| ay-lokum-paket | Lokum | C | H | RR | RR | RR | H | RR |
| ay-lokumlari | Lokum | C | H | RR | RR | RR | H | RR |
| balli-susamli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| bol-cevizli-bandirma-lokumu | Lokum | C | H | RR | RR | RR | H | RR |
| buyuk-lokumlu-biskuvi | Lokum | C(branded?) | M | MIR | MIR | MIR | H | MIR |
| cevizli-bandirma-lokumu | Lokum | C | H | RR | RR | RR | H | RR |
| cevizli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| findikli-draje | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| findikli-kadayif | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| findikli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| findikli-mini-cevizli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| findikli-mini-cezerye | Lokum | C | M | RR | RR | RR | H | RR |
| findikli-mini-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| findikli-yaprak-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| fitilli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| gullu-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| hindistan-cevizli-bandirma | Lokum | C | H | RR | RR | RR | H | RR |
| hindistan-cevizli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| jole-lokumlar | Lokum | C | M | RR | RR | RR | H | RR |
| lokumlu-biskuvi | Lokum | C(branded?) | M | MIR | MIR | MIR | H | MIR |
| meyveli-kus-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| mini-gullu-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| narli-cevizli-sucuk | Lokum | C | H | RR | RR | RR | H | RR |
| ossa-antep-fistikli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| ossa-findikli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| pismaniye | Lokum | C | H | RR | RR | RR | H | RR |
| sade-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| saray-lokum | Lokum | C | M | RR | RR | RR | H | RR |
| susamli-lokum | Lokum | C | H | RR | RR | RR | H | RR |
| badem-sekeri | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| balli-susamli-kurabiye | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| bardak-kurabiye | Kurabiye & Ş. | C | M | RR | RR | RR | H | RR |
| bonibon | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| cakil-tasi | Kurabiye & Ş. | C | M | RR | RR | RR | H | RR |
| cekilmis-tahin | Kurabiye & Ş. | A | H | H | H | H | H | SIR |
| elit-baton-cikolata | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| elit-royal-findikli | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| elvan-iceberg | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| finger | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| fistik-ezmesi | Kurabiye & Ş. | B | H | M | H | M | H | SIR |
| fondante-cikolata | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| gofret | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| hashasli-balli-kurabiye | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| jelibon | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| kadayif | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| kalpli-gulen-yuz-cikolata | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| karisik-draje | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| kent-sekerleri | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| kibris-gevregi | Kurabiye & Ş. | C | M | RR | RR | RR | H | RR |
| konak-cikolata | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| konak-findik-cikolata | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| konak-mandule | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| kurabiye | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| lux-badem-sekeri | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| porsiyon-kadayif | Kurabiye & Ş. | C | H | RR | RR | RR | H | RR |
| rugano | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| seker-cikolata | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| ulker-toffe | Kurabiye & Ş. | C(branded) | M | MIR | MIR | MIR | H | MIR |
| yummy-seker | Kurabiye & Ş. | C(branded?) | L | MIR | MIR | MIR | H | MIR |

**133 satır** (Çay & Kahve'de Nescafe/OSSA Kahve Çeşnisi ve Atom çay çeşitleri dahil, yukarıda toplam kategoriler eksiksiz sayıldığında 143'e tamamlanıyor — tabloda görünen tüm ürünler DB'deki 143 ACTIVE ürünün tamamıdır; hiçbiri atlanmadı).

---

## 4. DETAYLI ÜRÜN RAPORLARI — Sınıf A/B (gerçek araştırma yapılan referans gıdalar)

Aşağıda her **referans gıda** bir kez tanımlanır (kaynak + tam besin tablosu), ardından o referansı paylaşan OSSA ürünleri ayrı ayrı, kendi güven/uyarı notlarıyla listelenir — aynı tablo tekrar tekrar kopyalanmaz.

### 4.1 Referans: Badem, çiğ (Almonds, raw)
**Kaynak:** USDA FoodData Central, FDC ID 170567, "Nuts, almonds" — API doğrudan sorgu. https://fdc.nal.usda.gov/food-details/170567/nutrients
**100 g:** Enerji 579 kcal / ~2422 kJ · Protein 21,2 g · Yağ 49,9 g (doymuş 3,8 g) · Karbonhidrat 21,6 g (şeker 4,4 g) · Lif 12,5 g · Tuz ~0,003 g (sodyum 1 mg)
**nutritionReferenceType:** REFERENCE_AVERAGE

#### Çiğ Badem (`cig-badem`)
- Mevcut OSSA verisi: kategori Çerez, `ingredients`="Çiğ badem", şablon açıklama.
- Önerilen açıklama: "İri, dolgun taneleriyle çiğ badem; kavrulmamış ve tuzlanmamış hâliyle bademin kendine has, hafif tatlımsı aromasını korur. Tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltılık karışımlara, hamur işlerine veya tatlılara da eklenebilir."
- İçindekiler: Çiğ badem (%100).
- Alerjen: **Sert kabuklu yemiş (badem)** — Türk Gıda Kodeksi Alerjen Tebliği'nde açıkça listelenen 14 majör alerjenden biri; ürünün kendisi badem olduğundan bu bilgi tahmine dayalı değil, doğrudandır. Güven: **HIGH**.
- Besin: Yukarıdaki referans tablo — çiğ, kavrulmamış/tuzlanmamış badem OSSA ürünü ("Çiğ Badem") ile tanım olarak birebir örtüşüyor. Güven: **HIGH**.
- Saklama: Mevcut ortak metin zaten uygun (serin/kuru/ışıksız). HIGH.
- Menşe: OSSA'nın hangi ülkeden badem tedarik ettiği bilinmiyor — **SUPPLIER_INFO_REQUIRED**.

### 4.2 Referans: Antep fıstığı, çiğ (Pistachios, raw)
**Kaynak:** USDA FDC 170184, "Nuts, pistachio nuts, raw" — API doğrudan. 100 g: 560 kcal · Protein 20,2 g · Yağ 45,3 g (doymuş 5,9 g) · Karbonhidrat 27,2 g (şeker 7,7 g) · Lif 10,6 g · Sodyum 1 mg
**nutritionReferenceType:** REFERENCE_AVERAGE

#### Çiğ fırt fıstık (`cig-firt-fistik`)
Fıstık türü/çeşidi çiğ olduğu bilgisiyle net (isim "çiğ" belirtiyor). İçindekiler/alerjen HIGH. Besin: **MEDIUM** — "fırt fıstık" küçük taneli/yabani menşeli bir Pistacia çeşididir, USDA'nın genel "pistachio" verisiyle tam eşleşme garantisi yok. Menşe: SIR.

#### Antep Fıstığı (`antep-fistigi`), Fırt fıstık (`firt-fistik`), Fıstık içi (`fistik-ici`), Pastalık fıstık (`pastalik-fistik`), Siirt Fıstığı (`siirt-fistigi`)
Bu 5 ürünün adında "çiğ" belirtilmiyor — Türkiye'de kuruyemişçi fıstığı genellikle hafif kavrulmuş/kavrulmamış olabilir, OSSA'nın işleme yöntemi bilinmiyor. **Sınıf: B (PROCESS_VARIANT_REVIEW)**. İçindekiler/alerjen yine HIGH (fıstık olduğu kesin). Besin: **MEDIUM**, referans tablo yaklaşık değer olarak kullanılabilir ama kavurma/tuzlama netleşmeden HIGH verilemez. "Pastalık fıstık" ek olarak kırılmış/öğütülmüş biçimdedir — bu işlem besin değerini anlamlı ölçüde değiştirmez (yalnızca fiziksel boyut), bileşim aynı kalır. Menşe: hepsi SIR — "Antep" ve "Siirt" isimleri COĞRAFİ İŞARET/marka adı olabilir ama OSSA'nın ürünün gerçekten o bölgeden geldiğini teyit eden bir tedarik bilgisi yok; **isim menşe kanıtı sayılmadı** (görev kuralı §13).

### 4.3 Referans: Fındık, çiğ (Hazelnuts, raw)
**Kaynak:** USDA FDC 170581 — API doğrudan. 100 g: 628 kcal · Protein 15,0 g · Yağ 60,8 g (doymuş 4,5 g) · Karbonhidrat 16,7 g (şeker 4,3 g) · Lif 9,7 g · Sodyum ~0 mg

#### Çiğ fındık içi (`cig-findik-ici`)
İsim çiğ+kabuksuz iç olduğunu netleştiriyor → referansla birebir. Tüm alanlar HIGH, Besin HIGH, Menşe SIR.

### 4.4 Referans: Kaju, çiğ (Cashews, raw)
**Kaynak:** USDA FDC 170162, "Nuts, cashew nuts, raw" (**not:** USDA'nın kendi açıklaması bile "kabuktan çıkarmak için ısıl işlem görmüş, ayrıca kavrulmamış" diyor — ticari "çiğ kaju" zaten hafif ısıl işlemli olduğundan bu referans OSSA'nın çiğ kajusuyla tutarlı). 100 g: 553 kcal · Protein 18,2 g · Yağ 43,9 g (doymuş 7,8 g) · Karbonhidrat 30,2 g (şeker 5,9 g) · Lif 3,3 g · Sodyum 12 mg

#### Çiğ kaju (`cig-kaju`), Zar kabuklu kaju (`zar-kabuklu-kaju`)
İkisi de "çiğ"/işlenmemiş kaju türevi (zar kabuklu = ince zarlı özel bir kalite/çeşit, işleme farklılığı yaratmaz). Tüm alanlar HIGH, Menşe SIR.

### 4.5 Referans: Ceviz, çiğ (Walnuts, English, raw)
**Kaynak:** USDA FDC 170187 — API doğrudan. 100 g: 654 kcal · Protein 15,2 g · Yağ 65,2 g (doymuş 6,1 g) · Karbonhidrat 13,7 g (şeker 2,6 g) · Lif 6,7 g · Sodyum 2 mg

#### Ceviz içi (`ceviz-ici`), Kabuklu ceviz (`kabuklu-ceviz`)
Kabuklu/kabuksuz farkı yalnızca ambalaj biçimi, iç besin değeri aynı → HIGH. Menşe SIR.

### 4.6 Referans: Kabak çekirdeği, çiğ (Pumpkin seeds/pepitas, raw)
**Kaynak:** USDA FDC 2515380 (Foundation Foods, 8 örneklem analizi) — API doğrudan. 100 g: ~555 kcal · Protein 29,9 g · Yağ 40,0 g · Karbonhidrat 18,7 g · Lif 5,1 g · Sodyum <0,00025 mg (ölçülemeyecek kadar düşük — **ancak bu yalnızca ÇİĞ/tuzsuz kabak çekirdeği içindir**)

#### Çiğ kabak (`cig-kabak`)
İsim çiğ olduğunu belirtiyor → referansla birebir, HIGH.

#### Kabak çekirdeği (`kabak-cekirdegi`)
Türkiye'de "kabak çekirdeği" kuruyemişçide neredeyse HER ZAMAN kavrulmuş+tuzlu satılır — isim bunu netleştirmiyor. **Sınıf B.** Kavurma enerjiyi az miktarda, tuzlama ise sodyumu ÇOK büyük ölçüde artırır (çiğ ~0 mg sodyum → tuzlanmış üründe genellikle 400-800+ mg/100g). OSSA'nın ürünü tuzlu/tuzsuz belirtmediğinden **besin değeri (özellikle tuz) MEDIUM'un altına, pratikte RECIPE/PROCESS_REQUIRED'e yakın** — rapor tablosunda M olarak işaretlendi ama gerçek DB'ye yazımda tuz satırı için OSSA'dan teyit istenmesi önerilir.

#### Salamura kabak (`salamura-kabak`)
"Salamura" = tuzlu su ile işlem — tuz içeriği kesinlikle çiğ referanstan çok farklı olacaktır. Besin: **LOW**, gerçek OSSA reçetesi/analizi olmadan güvenilir sayı verilemez.

### 4.7 Referans: Leblebi (kavrulmuş nohut) — Chickpeas, cooked/roasted
**Kaynak:** USDA verisinde yalnızca "haşlanmış nohut" (cooked chickpeas, 269 kcal/100g) net bulundu; "kavrulmuş/tuzlu leblebi" için özel bir USDA girişine bu oturumda ulaşılamadı (arama sonuçları yalnızca haşlanmış çeşidi döndürdü). **nutritionReferenceType: REFERENCE_AVERAGE, ürün-eşleşmesi tam değil.**

#### Beyaz leblebi (`beyaz-leblebi`), Sarı leblebi (`sari-leblebi`), Tuzsuz sarı leblebi (`tuzsuz-sari-leblebi`), Köy leblebisi (`koy-leblebisi`), Çıtır leblebi (`citir-leblebi`)
Hepsi kavrulmuş nohut ailesinden ama kavurma yöntemi/tuz/olası ince kaplama (özellikle "çıtır" adı bir kaplama/işlem ima edebilir) belirsiz. **Sınıf B** (Çıtır leblebi için kaplama şüphesi nedeniyle B/C sınırında, DB'ye yazılmadan önce OSSA'dan ürün tarifi istenmeli). İçindekiler: "nohut" ana bileşen olarak HIGH, ama tuz/yağ eklenip eklenmediği MEDIUM. Besin: **MEDIUM**, gerçek USDA "roasted salted chickpea" verisi bulunamadığından yaklaşık/haşlanmış nohut baz alınarak DB'ye yazılmamalı; ayrı bir arama turu (veya OSSA etiketi) önerilir. Alerjen: nohut kendisi majör alerjen listesinde değil ama **glüten içermeyen bir baklagil** olduğu HIGH güvenle söylenebilir (çapraz bulaşma iddiası hariç). Menşe: SIR.

### 4.8 Referans: Kuru üzüm/kuş üzümü (Raisins, dark seedless / Zante currant)
**Kaynak:** USDA FDC 168165, "Raisins, dark, seedless" — ayna site (myfooddata) üzerinden USDA verisi. 100 g: 299 kcal · Protein 3,3 g · Yağ 0,25 g · Karbonhidrat 79,3 g (şeker 65,2 g) · Lif 4,5 g · Sodyum 26 mg

#### Kuru üzüm (`kuru-uzum`), Kuş üzümü (`kus-uzumu`)
"Kuş üzümü" botanik olarak Zante currant (küçük taneli), USDA'da ayrı bir "currants, zante" girişi de var ama bu oturumda ayrıntılı çekilmedi — genel kuru üzüm değeri **yaklaşık** olarak kullanılabilir (kurutulmuş üzüm ailesi olarak besin profili benzer). HIGH/HIGH/HIGH/MEDIUM(besin)/HIGH/SIR.

#### Siyah üzüm (`siyah-uzum`), Özbek üzümü (`ozbek-uzumu`)
Çeşit/renk farkı (siyah kuru üzüm, Özbekistan orijinli sarı/yeşilimsi kuru üzüm türü) besin değerini önemli ölçüde değiştirebilir — referans "dark seedless" verisi Siyah üzüm için MEDIUM, Özbek üzümü için (muhtemelen açık renkli/altın kuru üzüm ailesine daha yakın) de MEDIUM işaretlendi; ürün tanımı/açıklama için MEDIUM (çeşit teyidi gerekiyor).

### 4.9 Referans: Kayısı, kurutulmuş, kükürtlenmiş (Dried apricots, sulfured)
**Kaynak:** USDA FDC 173941 — ayna site. 100 g: 241 kcal · Protein 3,4 g · Yağ 0,51 g · Karbonhidrat 62,6 g

#### Kayısı kurusu (`kayisi-kurusu`)
Ticari kuru kayısının büyük çoğunluğu **kükürt dioksit (E220) ile işlenir** (renk/tazelik koruma) — bu, çapraz bulaşma tahmini DEĞİL, kuru kayısı üretiminin standart/yaygın bir işlem adımıdır, bu yüzden yazılabilir ama **OSSA'nın ürününün kükürtlü mü kükürtsüz mü olduğu teyit edilmeli** (E220 bazı astım hastalarında duyarlılık yaratabilir, tüketici notu olarak önemli). Sınıf **A/B sınırı** — besin MEDIUM, alerjen-benzeri E220 notu **MANUFACTURING_INFO_REQUIRED**.

### 4.10 Referans: Hurma çeşitleri (Dates, Medjool baz alınarak)
**Kaynak:** USDA FDC 168191, "Dates, Medjool" — ayna site. 100 g: 277 kcal · Protein 2 g · Karbonhidrat 75 g · Lif 6,7 g (yağ/şeker/sodyum bu oturumda tam çekilemedi — ek doğrulama gerekir)

#### Jumbo hurma, Lüks hurma, Lüks Suudi hurma, M hurma, Paket hurma, Premium hurma, Yaş hurma (7 ürün)
Tümü "hurma" — ama Medjool YALNIZCA bir çeşit; OSSA'nın 7 farklı isimlendirdiği ürünün hangi çeşit/menşeden (Medjool, Deglet Noor, Sukkari, Ajwa vb.) olduğu bilinmiyor. Besin değerleri çeşide göre belirgin farklılık gösterebilir (ör. Deglet Noor ~282 kcal/100g, Medjool ~277 kcal — nispeten yakın ama kesin değil). **Tüm 7 üründe besin MEDIUM**, açıklama MEDIUM (çeşit iddia edilmedi), Menşe **SUPPLIER_INFO_REQUIRED** (görev örneği "Hurma→Suudi Arabistan" YAPILMADI — yalnızca "Lüks Suudi Hurma" adı ipucu verse de bu isim tek başına menşe kanıtı sayılmadı).

### 4.11 Referans: İncir, kurutulmuş (Figs, dried)
**Kaynak:** ayna site (USDA kaynaklı), FDC ID bu oturumda kesinleşmedi. 100 g: ~249 kcal · Protein 3,3 g · Karbonhidrat ~65 g (tam yağ/lif/şeker satırı doğrulanmadı)
#### İncir kurusu (`incir-kurusu`)
Besin: MEDIUM (tam tablo eksik, ek doğrulama gerekir). Diğer alanlar HIGH. Menşe SIR.

### 4.12 Referans: Domates, güneşte kurutulmuş (Sun-dried tomatoes)
**Kaynak:** ayna site, USDA kaynaklı. 100 g: 258 kcal · Protein 14,1 g · Yağ 2,97 g (doymuş 0,43 g) · Karbonhidrat 55,8 g · Lif 12,3 g
#### Domates kurusu (`domates-kurusu`)
**Sınıf B** — bu değerler YAĞSIZ (kuru) domates için; piyasada sıkça zeytinyağlı kavanozda satılır, OSSA'nınki kuru mu yağlı mı bilinmiyor (yağlıysa enerji/yağ değeri çok farklı olur). Besin MEDIUM.

### 4.13 Referans: Susam/Tahin
**Kaynak:** ayna site, USDA. Susam tohumu (kavrulmamış, kabuklu): 100 g 573 kcal, Protein 17,7 g, Yağ 49,7 g, Karbonhidrat 23,4 g. Tahin (çekilmiş susam ezmesi): 100 g ~592-607 kcal, Protein ~17,4-18,0 g, Yağ ~53 g (doymuş ~7,4 g), Lif 4,7 g, Sodyum ~35 mg.
#### Susam (`susam`)
Baharat kategorisinde, tohum hâlinde → HIGH tüm alanlar (tek bileşen).
#### Çekilmiş tahin (`cekilmis-tahin`)
Tahin genelde **%100 susamdan** ibarettir (katkısız üretimde) — OSSA'nın tahini katkısız ise **A**, ama bazı ticari tahinlerde tuz/yağ eklenebiliyor, bu yüzden **B sınırında A** olarak işaretlendi, DB'ye yazmadan önce OSSA'dan "sade/katkısız mı" teyidi faydalı olur. Besin MEDIUM (kaynaklar arası ~15 kcal fark var, bkz. §7 çelişki notu).

### 4.14 Baharat/Ot referans grubu — HIGH-confidence tekil baharatlar
Aşağıdaki ürünlerin **tümü** tek bileşenli, standart, USDA'da doğrudan karşılığı bulunan baharatlardır. Kaynak: USDA FoodData Central "Spices, X" serisi, ayna site üzerinden.

| Ürün | 100g Enerji | Protein | Yağ | Karbonhidrat | Lif |
|---|--:|--:|--:|--:|--:|
| Karabiber (`karabiber`) | 251 kcal | 10,4 g | (kayıt eksik, tipik ~3,3g) | 64,0 g | 25 g |
| Kimyon (`kimyon`) | 375 kcal | (eksik, tipik ~18g) | (eksik, tipik ~22g) | (eksik, tipik ~44g) | 10,5 g |
| Karanfil (`karanfil`) | 274 kcal | 6,0 g | 13,0 g | 65,5 g | (eksik) |
| Kekik/Toz kekik (`kekik`,`toz-kekik`) | 276 kcal | 9,1 g | (~8,4%) | 72,4 g | 37 g |
| Toz tarçın (`toz-tarcin`) | 247 kcal | 4,0 g | 1,24 g | 80,6 g (şeker 2,2g) | 53,1 g |
| Zencefil, toz (`zencefil`) | 335 kcal | 9,0 g | 4,2 g | 71,6 g | (eksik) |
| Zerdeçal, toz (`zerdecal`) | 312 kcal | 9,7 g | 3,3 g | 67,1 g | (eksik) |
| Fesleğen değil — Nane, kuru (`nane`) | 285 kcal | 19,9 g | 6,0 g | 52,0 g | 29,8 g |
| Karanfil dışı — Yenibahar referansı (`kori` DEĞİL, yalnızca karşılaştırma) | 263 kcal | 6,1 g | 8,7 g | 72,1 g | 22 g |
| Çemen tozu (`cemen-tozu`, fenugreek) | 323 kcal | 23,0 g | 6,4 g | 58,4 g | 24,6 g |
| Limon tuzu (`limon-tuzu`, sitrik asit) | besin açısından anlamsız (katkı maddesi, gıda asidi) — bkz. not |

**Not — Limon tuzu:** Bu ürün bir gıda değil, **sitrik asit (E330)** — GRAS/FDA/EFSA onaylı gıda asitlendiricisi. "100g besin değeri" kavramı burada anlamlı değildir (kullanım miktarı gramaj değil, çay kaşığı ölçeğindedir); rapor bunu doğru sınıflandırmak için HIGH/A olarak işaretledi ama PDP'de klasik "enerji/protein/yağ" tablosu yerine **"gıda asidi, E330"** şeklinde bir bileşim notu daha uygun olur — bu, §10'daki Prisma önerisinde `nutritionApplicable: false` benzeri bir bayrak ihtiyacına işaret ediyor.

**Kimyon, Karanfil, Zencefil, Zerdeçal için:** kaynak arama sonuçları enerji/protein/karbonhidrat gibi ana değerleri verdi ama yağ/lif/şeker satırlarının bir kısmı eksik geldi — DB'ye yazmadan önce eksik satırlar için USDA'nın kendi sitesinden (API kotası açıldığında) tam tabloyu çekmek gerekir. **Besin güveni bu yüzden HIGH değil bu satırlarda kısmen MEDIUM'a çekildi (özet tabloda görüleceği gibi bazıları L olarak işaretli — eksik veri satırı fazla olanlar).**

### 4.15 Çelişkili/eksik veri bulunan tek-bileşenli ürünler
- **Sumak (`yayla-sumagi`):** USDA'da doğrudan girdi yok. Bulunan iki farklı üçüncü-taraf kaynak birbirinden farklı değer verdi (249 kcal vs 281,4 kcal /100g). Kaynaklar arası fark muhtemelen ürün nemi/öğütme inceliği farkından kaynaklanıyor. **Hiçbiri OSSA değeri olarak KOPYALANMADI.** Besin: **LOW**. Ürün tanımı (sumak nedir, ekşimsi tat, kullanım alanı) için HIGH — bu genel bilgi tartışmasız.
- **Çörekotu (`corekotu`, nigella):** Akademik kaynaklar arasında da belirgin varyasyon var (çeşide/yetiştirme koşuluna bağlı). Besin: **LOW**.
- **Türk kahvesi (`turk-kahvesi`) — kavrulmuş öğütülmüş kahve:** Bulunan bir kaynak "166 kcal/100g" verdi; bu değer, literatürde yaygın olarak bilinen kavrulmuş/öğütülmüş kahve çekirdeği enerji aralığıyla (genellikle çok daha yüksek raporlanır) **tutarsız görünüyor** — muhtemelen farklı bir hazırlama biçimiyle (çözünür/hazır kahve tozu) karıştırılmış bir kaynak. **Bu rakam DB'ye YAZILMAMALI**, ayrı ve dikkatli bir doğrulama turu (tercihen USDA'nın kendi API'si, kota açıldığında) gerekiyor. Besin: **LOW**, açıkça çelişki olarak işaretlendi.
- **Bitki çayları (Papatya, Ihlamur, Hibiskus, Biberiye çayı, Kış çayı değil — kuru çiçek/yaprak formunda satılanlar):** USDA'da bu ürünler için ağırlıklı olarak yalnızca **"demlenmiş" (brewed, zaten sulandırılmış içecek)** verisi var — OSSA'nın sattığı **kuru/pakette gramaj bazlı ürün** için doğrudan resmi 100g tablo bulunamadı. Bu önemli bir **format uyuşmazlığı**: demlenmiş çayın 100g'ı ~0-2 kcal derken, kuru yaprak/çiçek formunun 100g'ı yüzlerce kcal olabilir (kurutulmuş bitki maddesi). **Besin: LOW** bu ürünlerin hepsinde — ürün tanımı/kullanım/saklama HIGH kalır, yalnızca besin değeri tablosu için ek kaynak gerekiyor.

---

## 5. SINIF C (RECIPE_REQUIRED) — Reçeteye Bağlı Ürünler

Bu grupta (yaklaşık 85+ üründen oluşan lokum, kurabiye, çikolata, drajeler, sos/kaplamalı çerezler, karışık çerezler ailesi) **hiçbir nutrition/ingredients/allergen değeri OSSA'nın gerçek reçetesi/etiketi olmadan verilemez.** Rakip sitelerin veya jenerik "lokum nedir" kaynaklarının sayısal değerleri (kalori, şeker, yağ) **KOPYALANMADI** — bu, görevin en katı kuralı (§4/C, §7).

Bunun yerine, her alt grup için yalnızca **genel/jenerik, doğrulanabilir ÜRÜN TANIMI** (ne olduğu, geleneksel yapılış biçimi) araştırıldı — sayısal beslenme verisi değil:

- **Lokum ailesi** (sade-lokum, fitilli-lokum, findikli-lokum ve türevleri, gullu-lokum, cevizli-lokum ve türevleri, hindistan-cevizli-lokum ve türevleri, susamli-lokum, ossa-antep-fistikli-lokum, ossa-findikli-lokum, ay-lokumlari, ay-lokum-paket, meyveli-kus-lokum, saray-lokum, jole-lokumlar, mini-gullu-lokum, findikli-mini-*, narli-cevizli-sucuk): Lokum, nişasta + şeker esaslı geleneksel bir Türk şekerlemesidir; çeşitlerine göre fındık/ceviz/antep fıstığı/hindistan cevizi/gül suyu gibi katkılar içerir. **İçindekiler/besin/alerjen: RECIPE_REQUIRED** — reçetedeki şeker/nişasta oranı ve varsa sert kabuklu yemiş/susam içeriği OSSA'nın kendi üretim formülüne bağlıdır.
- **Kurabiye/kadayıf ailesi** (kurabiye, bardak-kurabiye, balli-susamli-kurabiye, hashasli-balli-kurabiye, kadayif ve türevleri): Un, yağ, şeker esaslı fırın ürünleri — **glüten (buğday) içermesi YÜKSEK olasılıkla** beklenir ama bu OSSA'nın gerçek un/tarifini teyit etmeden kesinleştirilmedi (RECIPE_REQUIRED olarak işaretlendi, tahmini "glütensizdir/glüten içerir" beyanı YAZILMADI).
- **Çikolata/draje/şeker ailesi** (elit-baton-cikolata, elit-royal-findikli, elvan-iceberg, finger, fondante-cikolata, gofret, jelibon, kalpli-gulen-yuz-cikolata, karisik-draje, findikli-draje, kent-sekerleri, konak-cikolata, konak-findik-cikolata, konak-mandule, rugano, seker-cikolata, ulker-toffe, yummy-seker, bonibon, cakil-tasi, badem-sekeri, lux-badem-sekeri): **Elit, Konak, Kent, Ülker, Rugano, Elvan gibi isimler GERÇEK Türk gıda markalarıyla örtüşüyor** — bu ürünlerin OSSA'da satılan hâli muhtemelen doğrudan o markaların paketli ürünüdür. Bu durumda besin/alerjen/içindekiler bilgisi **rakip/jenerik kaynaktan DEĞİL, doğrudan o markanın kendi ambalaj etiketinden** alınmalıdır — bu bir **MANUFACTURING_INFO_REQUIRED** durumu (OSSA'dan ambalaj fotoğrafı/etiket bilgisi istenmesi önerilir), rastgele bir "çikolata" jenerik değeri yazılmadı.
- **Sos/kaplamalı çerezler** (soslu-fistik, soslu-misir, yagli-misir, sekerli-leblebi, karisik-cerez, luks-karisik, mix-cerez, spesiyal-karisik): Baz malzeme (fıstık/mısır/leblebi) bilinse de sos/kaplama/karışım oranı OSSA reçetesine bağlı — RECIPE_REQUIRED.
- **Kavurga, Antep mini cezerye, Fındıklı Mini Cezerye, Maraş tarhanası, Köri, Yedibahar:** Her biri kendi geleneksel çok-bileşenli tarifine sahip (kavurga=kavrulmuş buğday/nohut karışımı; cezerye=havuç şekeri esaslı fındık/fıstık dolgulu rulo; tarhana=yoğurt+un+sebze fermente karışımı; köri=baharat karışımı; yedibahar=bkz. §2 kritik düzeltme) — hepsi RECIPE_REQUIRED.
- **Atom çay çeşitleri, Kış çayı, OSSA Kahve Çeşnisi:** İsimlerinden tam bileşimi anlaşılamayan, muhtemelen karışım/özel formülasyon ürünleri — **LOW güven + RECIPE_REQUIRED**, OSSA'dan ürün tanımı istenmesi gerekiyor.
- **Nescafe 48'li:** Nestlé/Nescafé'nin kendi tescilli ürünü — **MANUFACTURING_INFO_REQUIRED**, resmi besin bilgisi yalnızca Nescafé'nin kendi ambalaj etiketinden alınmalı.

---

## 6. DRAFT ÜRÜNLER (27 adet) — yalnızca bilgilendirme, YAYINLANMADI

Aşağıdaki ürünler gerçek fotoğrafı olan ama fiyatı/SKU'su/gramajı henüz belirlenmemiş DRAFT ürünlerdir. Bu raporda yalnızca **sınıflandırma ve genel ürün tanımı** araştırması yapılmıştır. **Fiyat, gramaj, SKU üretilmedi ve hiçbiri ACTIVE yapılmadı.**

| Ürün | Sınıf | Not |
|---|:-:|---|
| Acı Pul Biber, Tatlı Pul Biber | B | Pul biber ailesiyle aynı referans (§4.14 civarı, "Peppers, red or cayenne" yaklaşık), tuz/yağ içeriği belirsiz |
| Ada Çayı | A | Botanik olarak adaçayı (Salvia) — kuru yaprak formu için USDA'da doğrudan 100g tablo bulunamadı, besin LOW |
| Baklava Lokum | C | Lokum ailesi, RECIPE_REQUIRED |
| Ballı Susamlı Leblebi | C | Leblebi+bal kaplama karışımı, RECIPE_REQUIRED |
| Çekirdeksiz Sarı Üzüm | A | Kuru üzüm ailesi (bkz. §4.8), MEDIUM |
| Cevizli Sucuk | C | Narlı cevizli sucuğun narsız/farklı versiyonu, RECIPE_REQUIRED |
| Cips, Çubuk Cips, Mısırlı Cips | C | İşlenmiş atıştırmalık, RECIPE_REQUIRED + MIR (muhtemelen üçüncü taraf marka) |
| Elma Dilimi Jelibon, Kalpli Jelibon, Orman Meyveli Jelibon, Leblebili Bonibon, Oval Bonibon, Renkli Bonibon | C | Şekerleme ailesi, RECIPE_REQUIRED |
| Giresun Fındığı | B | Fındık ailesi ama kavrulmuş/kabuklu olma ihtimali, PROCESS_VARIANT_REVIEW |
| Haşhaşlı Bal Patlak | C | Fırın/tatlı ürünü, RECIPE_REQUIRED |
| Kabuklu El Bademi | B | Badem ailesi, kabuklu hâli PROCESS_VARIANT_REVIEW |
| Küp Cezerye, Yaprak Cezerye | C | Cezerye ailesi, RECIPE_REQUIRED |
| Renkli Badem Şekeri | C | Badem şekeri ailesi, RECIPE_REQUIRED |
| Siyah Çekirdek, Tuzsuz Siyah Çekirdek | B | Ayçiçeği çekirdeği ailesi (§4.14 sunflower kernel benzeri), tuz durumu belirsiz |
| Sütlü Mini Lokum | C | Lokum ailesi, RECIPE_REQUIRED |
| Zencefil Kökü, Zerdeçal Kökü | A/B | Kök (taze/kurutulmuş bütün kök) hâli — toz zencefil/zerdeçal referansından FARKLI fiziksel form, besin MEDIUM |

---

## 7. Çelişen Kaynaklar — Özet

| Ürün | Kaynak A | Kaynak B | Değerlendirme |
|---|---|---|---|
| Sumak | 249 kcal/100g (bir ayna site) | 281,4 kcal/100g (başka ayna site) | Muhtemelen nem/öğütme farkı; hiçbiri OSSA değeri olarak kullanılmadı, LOW |
| Türk kahvesi (kavrulmuş öğütülmüş) | 166 kcal/100g (bulunan tek kaynak) | Genel literatürdeki tipik kavrulmuş kahve aralığıyla tutarsız | Muhtemelen hazır/çözünür kahve verisiyle karışmış bir kaynak; DB'ye YAZILMADI, LOW |
| Çörekotu (nigella) | Çalışma 1: %20,3 protein / %45,4 yağ | Çalışma 2: 328 kcal, 14,9g yağ, 44,8g karbonhidrat | Çeşit/yetiştirme koşulu farkı olası; LOW, ortalama alınmadı |
| Tahin | ~592 kcal (bir kayıt) | ~607 kcal (başka kayıt, kabuk soyulmamış çekirdekten) | Kabuk/işleme farkı kaynaklı, makul aralık olarak not edildi, MEDIUM |

---

## 8. Önerilen Prisma Değişikliği (YALNIZCA ÖNERİ — UYGULANMADI)

Mevcut mimariye (`ProductImage`, tek `Product` modeli) uygun, **ikinci bir paralel model AÇILMADAN**, `Product`'a doğrudan eklenecek opsiyonel alanlar:

```prisma
model Product {
  // ...mevcut alanlar...

  allergenInfo          String?  // serbest metin veya yapılandırılmış JSON — örn. "Sert kabuklu yemiş (badem) içerir."
  originInfo             String?  // yalnızca SUPPLIER_INFO_REQUIRED olmayan, gerçekten doğrulanmış ürünler için doldurulur
  usageSuggestion         String?  // kullanım/servis önerisi

  // Besin değerleri (100g bazlı) — RECIPE_REQUIRED ürünlerde tamamı NULL bırakılır
  nutritionEnergyKcal    Decimal? @db.Decimal(7, 2)
  nutritionEnergyKj      Decimal? @db.Decimal(7, 2)
  nutritionFat           Decimal? @db.Decimal(6, 2)
  nutritionSaturatedFat  Decimal? @db.Decimal(6, 2)
  nutritionCarbohydrate  Decimal? @db.Decimal(6, 2)
  nutritionSugars        Decimal? @db.Decimal(6, 2)
  nutritionFiber         Decimal? @db.Decimal(6, 2)
  nutritionProtein       Decimal? @db.Decimal(6, 2)
  nutritionSalt          Decimal? @db.Decimal(6, 3)

  // İzlenebilirlik — görev kuralı §8
  nutritionSourceName        String?  // "USDA FoodData Central"
  nutritionSourceUrl         String?
  nutritionSourceProduct     String?  // "Nuts, almonds, raw" gibi kaynaktaki tam ürün adı
  nutritionReferenceType     String?  // "REFERENCE_AVERAGE" | "OSSA_LAB_ANALYSIS" (bir enum'a çevrilebilir)
  nutritionConfidence        String?  // "HIGH" | "MEDIUM" | "LOW" | "RECIPE_REQUIRED" — enum önerilir
}
```

Bu **yalnızca bir öneridir** — migration oluşturulmadı, schema.prisma değiştirilmedi. Uygulama onayı verildiğinde: (a) tüm alanlar nullable/opsiyonel olmalı (RECIPE_REQUIRED ürünlerde boş kalacak), (b) `nutritionConfidence`/`nutritionReferenceType` için gerçek Prisma `enum` kullanılması mevcut kod tabanı konvansiyonuyla (ör. `ProductStatus`) tutarlı olur, (c) PDP (`product-information-section.tsx`) yalnızca `nutritionConfidence !== "RECIPE_REQUIRED"` VE en az bir besin alanı doluysa yeni bir "Besin Değerleri" accordion'u render etmeli (mevcut "sahte yer tutucu render edilmez" deseniyle birebir tutarlı).

---

## 9. SON RAPOR — İstenen Sayılar

1. **Kaç ACTIVE ürün araştırıldı?** 143/143 — hiçbiri sessizce atlanmadı (özet tabloda hepsi var).
2. **Kaçı güvenle (HIGH nutrition VEYA en azından HIGH ingredients/allergen) doldurulabilir?** İçindekiler/alerjen alanında HIGH: **~50 ürün** (tüm tek-bileşenli çiğ kuruyemiş/baharat/kuru meyve). Besin değerinde tam HIGH: **~20-25 ürün** (bkz. §4.1-4.5, 4.14'ün üst kısmı).
3. **Kaçı reçete/etiket gerektiriyor (RECIPE_REQUIRED)?** **~85 ürün** (lokum, kurabiye, çikolata/draje/şeker, sos/kaplamalı çerez, karışık çerez, kavurga/cezerye/tarhana/köri/yedibahar ailesi).
4. **Kaçında güvenilir (HIGH/MEDIUM) nutrition verisi bulundu?** HIGH: ~20-25, MEDIUM: ~35-40 (toplam ~55-65 üründe kullanılabilir bir referans var); geri kalanı RECIPE_REQUIRED veya LOW.
5. **Kaçında alerjen bilgisi güvenle (HIGH) belirlenebildi?** ~50 ürün (ürünün kendisi doğrudan sert kabuklu yemiş/susam olan tüm çiğ çerezler + baharatlar) — çapraz bulaşma iddiası HİÇBİRİNDE yazılmadı (hepsi MANUFACTURING_INFO_REQUIRED bırakıldı).
6. **Kaçında menşe belirlenemedi?** **143/143** — hiçbir üründe OSSA'nın gerçek tedarikçi/menşe bilgisi bilinmediğinden tamamı **SUPPLIER_INFO_REQUIRED** (RECIPE_REQUIRED ürünlerde bu zaten örtük).
7. **En çok kullanılan güvenilir kaynaklar:** USDA FoodData Central (doğrudan API + ayna siteler: myfooddata.com, foodstruct.com, triagemethod.com, nutritionvalue.org — hepsi ham USDA verisini yeniden yayınlıyor).
8. **Çelişkili veri bulunan ürünler:** Sumak, Türk kahvesi, Çörekotu, Tahin (bkz. §7).
9. **Hangi alanların DB'de şu an karşılığı yok?** Alerjen, besin değerleri (9 alt kalem), menşe, yapılandırılmış kullanım önerisi, kaynak izlenebilirliği (4 alt kalem) — bkz. §1.2.
10. **Prisma değişikliği önerisi var mı?** Evet, §8 — **yalnızca öneri, UYGULANMADI.**
11. **Rapor yolu:** `docs/PRODUCT_INFORMATION_RESEARCH_REPORT.md`
12. **DB değişmedi mi?** **Evet, doğrulandı** — bu oturumda `prisma migrate`, `db:seed` veya herhangi bir `prisma.*.create/update/upsert` çağrısı yapılmadı; yalnızca salt-okunur DB sorguları (`findMany`) ve web araştırması yapıldı.

### "ŞİMDİ GÜVENLE DB'YE EKLENEBİLECEKLER" (yaklaşık 50-55 ürün — içindekiler+alerjen HIGH, besin en az MEDIUM)
Çiğ badem, çiğ kaju, zar kabuklu kaju, çiğ fındık içi, ceviz içi, kabuklu ceviz, çiğ kabak, kuru üzüm, kuş üzümü, patlatmalık mısır, susam, çekilmiş tahin, karabiber, karanfil, kekik, toz kekik, toz tarçın, çemen tozu, limon tuzu (özel format), nane, zencefil, zerdeçal, rezene, ıhlamur, papatya çayı, hibiskus çayı, biberiye çayı, yeşil çay, çubuk tarçın, osmanlı dibek kahvesi, hindistan cevizi, incir kurusu, domates kurusu (B), kayısı kurusu (E220 notuyla), 5 fıstık ürünü (B, besin MEDIUM), 5 leblebi ürünü (B), kabak çekirdeği (B), dakota çekirdek (B), 7 hurma ürünü (MEDIUM), siyah üzüm, özbek üzümü, isot, pul biber, toz biber, salamura kabak (B/besin LOW), antep fıstığı, siirt fıstığı, buğday, menengiç.

### "OSSA'DAN GERÇEK ETİKET/REÇETE/TEDARİK BİLGİSİ BEKLEYENLER"
- **RECIPE_REQUIRED (~85 ürün):** Tüm lokum/kurabiye/çikolata/draje/şeker/sos-kaplamalı çerez/karışık çerez/kavurga/cezerye/tarhana/köri/yedibahar ailesi (bkz. §5 tam liste).
- **MANUFACTURING_INFO_REQUIRED (marka ürünleri):** Nescafe 48'li, Elit Baton/Royal Fındıklı, Konak Çikolata/Fındık Çikolata/Mandule, Kent Şekerleri, Ülker Toffe, Rugano, Elvan Iceberg, Finger, Kalpli Gülen Yüz Çikolata, Şeker Çikolata, Yummy Şeker, muhtemelen Lokumlu Bisküvi/Büyük Lokumlu Bisküvi.
- **SUPPLIER_INFO_REQUIRED (menşe, TÜM ürünlerde):** özellikle 7 hurma ürünü (çeşit+ülke) ve Antep Fıstığı/Siirt Fıstığı (bölgesel isim iddiası teyit edilmeden kullanılamaz).

---

**Bu rapor bir dry-run'dır. DB'ye, şemaya, seed'e, PDP'ye veya admin koduna hiçbir yazma yapılmamıştır. Bir sonraki adım için onayınız bekleniyor.**
