/**
 * Gerçek ürün fotoğrafı entegrasyonu — TEK kaynak. `seed.ts` bu dosyayı import
 * eder; ürün oluşturma/fiyat/kategori/varyant mantığına DOKUNMAZ.
 *
 * `REAL_PRODUCT_IMAGE_MAP`: mevcut (zaten var olan, fiyatlı) ürünlerin SVG
 * placeholder'ı yerine gösterilecek gerçek fotoğraf(lar)ı — slug → 1-2 görsel.
 * İlk eleman her zaman primary, varsa ikincisi gallery'dir.
 *
 * `NEW_REAL_PHOTO_PRODUCTS`: kataloğa YENİ eklenen, gerçek fotoğrafı olan ama
 * gerçek fiyatı BİLİNMEYEN ürünler — hepsi `status: DRAFT`, varyantsız
 * oluşturulur (bkz. görev kuralı: sahte/kopya fiyat üretilmez). Admin daha
 * sonra `/yonetim/urunler`'den fiyat/varyant girip ACTIVE'e çekebilir.
 *
 * `REAL_CATEGORY_IMAGE_MAP`: 6 ana kategorinin kapak görseli — o kategoride
 * GERÇEKTEN yer alan, en karakteristik/iştah açıcı gerçek fotoğraflı üründen
 * elle seçildi (bkz. kategori/grup görsel entegrasyonu görev raporu).
 */

export interface RealProductImage {
  url: string;
  altText: string;
}

export const REAL_CATEGORY_IMAGE_MAP: Record<string, RealProductImage> = {
  cerez: { url: "/images/products/antep-fistigi.webp", altText: "OSSA Antep Fıstığı" },
  lokum: { url: "/images/products/meyveli-kus-lokum.webp", altText: "OSSA Meyveli kuş lokum" },
  "kurabiye-sekerleme": { url: "/images/products/badem-sekeri.webp", altText: "OSSA Badem şekeri" },
  "cay-kahve": { url: "/images/products/turk-kahvesi.webp", altText: "OSSA Türk kahvesi" },
  baharat: { url: "/images/products/karabiber.webp", altText: "OSSA Karabiber" },
  "hurma-kuru-meyve": { url: "/images/products/luks-hurma.webp", altText: "OSSA Lüks hurma" },
};

export const REAL_PRODUCT_IMAGE_MAP: Record<string, RealProductImage[]> = {
  "antep-fistigi": [{ url: "/images/products/antep-fistigi.webp", altText: "OSSA Antep Fıstığı" }],
  "badem-sekeri": [{ url: "/images/products/badem-sekeri.webp", altText: "OSSA Badem şekeri" }],
  "beyaz-leblebi": [{ url: "/images/products/beyaz-leblebi.webp", altText: "OSSA Beyaz leblebi" }],
  bugday: [{ url: "/images/products/bugday.webp", altText: "OSSA Buğday" }],
  "biberiye-cayi": [{ url: "/images/products/biberiye-cayi.webp", altText: "OSSA Biberiye çayı" }],
  "ceviz-ici": [{ url: "/images/products/ceviz-ici.webp", altText: "OSSA Ceviz içi" }],
  "fistik-ezmesi": [{ url: "/images/products/fistik-ezmesi.webp", altText: "OSSA Fıstık ezmesi" }],
  "fistik-ici": [{ url: "/images/products/fistik-ici.webp", altText: "OSSA Fıstık içi" }],
  "firt-fistik": [{ url: "/images/products/firt-fistik.webp", altText: "OSSA Fırt fıstık" }],
  "hibiskus-cayi": [{ url: "/images/products/hibiskus-cayi.webp", altText: "OSSA Hibiskus çayı" }],
  "hindistan-cevizi": [{ url: "/images/products/hindistan-cevizi.webp", altText: "OSSA Hindistan cevizi" }],
  jelibon: [
    { url: "/images/products/jelibon.webp", altText: "OSSA Jelibon" },
    { url: "/images/products/jelibon-2.webp", altText: "OSSA Jelibon" },
  ],
  "kabuklu-ceviz": [{ url: "/images/products/kabuklu-ceviz.webp", altText: "OSSA Kabuklu ceviz" }],
  karabiber: [{ url: "/images/products/karabiber.webp", altText: "OSSA Karabiber" }],
  karanfil: [{ url: "/images/products/karanfil.webp", altText: "OSSA Karanfil" }],
  "karisik-cerez": [{ url: "/images/products/karisik-cerez.webp", altText: "OSSA Karışık Çerez" }],
  kavurga: [{ url: "/images/products/kavurga.webp", altText: "OSSA Kavurga" }],
  kekik: [{ url: "/images/products/kekik.webp", altText: "OSSA Kekik" }],
  "kus-uzumu": [{ url: "/images/products/kus-uzumu.webp", altText: "OSSA Kuş üzümü" }],
  "koy-leblebisi": [{ url: "/images/products/koy-leblebisi.webp", altText: "OSSA Köy leblebisi" }],
  kimyon: [{ url: "/images/products/kimyon.webp", altText: "OSSA Kimyon" }],
  "lux-badem-sekeri": [{ url: "/images/products/lux-badem-sekeri.webp", altText: "OSSA Lüx badem şekeri" }],
  "limon-tuzu": [{ url: "/images/products/limon-tuzu.webp", altText: "OSSA Limon tuzu" }],
  menengic: [{ url: "/images/products/menengic.webp", altText: "OSSA Menengiç" }],
  "narli-cevizli-sucuk": [{ url: "/images/products/narli-cevizli-sucuk.webp", altText: "OSSA Narlı cevizli sucuk" }],
  "papatya-cayi": [{ url: "/images/products/papatya-cayi.webp", altText: "OSSA Papatya çayı" }],
  "pastalik-fistik": [{ url: "/images/products/pastalik-fistik.webp", altText: "OSSA Pastalık fıstık" }],
  "sade-lokum": [{ url: "/images/products/sade-lokum.webp", altText: "OSSA Sade lokum" }],
  "soslu-fistik": [{ url: "/images/products/soslu-fistik.webp", altText: "OSSA Soslu fıstık" }],
  "soslu-misir": [{ url: "/images/products/soslu-misir.webp", altText: "OSSA Soslu mısır" }],
  "siyah-uzum": [{ url: "/images/products/siyah-uzum.webp", altText: "OSSA Siyah üzüm" }],
  "siirt-fistigi": [{ url: "/images/products/siirt-fistigi.webp", altText: "OSSA Siirt Fıstığı" }],
  "toz-kekik": [{ url: "/images/products/toz-kekik.webp", altText: "OSSA Toz kekik" }],
  "toz-tarcin": [{ url: "/images/products/toz-tarcin.webp", altText: "OSSA Toz tarçın" }],
  "turk-kahvesi": [{ url: "/images/products/turk-kahvesi.webp", altText: "OSSA Türk kahvesi" }],
  "yayla-sumagi": [{ url: "/images/products/yayla-sumagi.webp", altText: "OSSA Yayla sumağı" }],
  "yagli-misir": [{ url: "/images/products/yagli-misir.webp", altText: "OSSA Yağlı mısır" }],
  "yesil-cay": [{ url: "/images/products/yesil-cay.webp", altText: "OSSA Yeşil çay" }],
  "zar-kabuklu-kaju": [{ url: "/images/products/zar-kabuklu-kaju.webp", altText: "OSSA Zar kabuklu kaju" }],
  zencefil: [{ url: "/images/products/zencefil.webp", altText: "OSSA Zencefil" }],
  zerdecal: [{ url: "/images/products/zerdecal.webp", altText: "OSSA Zerdeçal" }],
  "cakil-tasi": [{ url: "/images/products/cakil-tasi.webp", altText: "OSSA Çakıl taşı" }],
  "citir-leblebi": [{ url: "/images/products/citir-leblebi.webp", altText: "OSSA Çıtır leblebi" }],
  "cubuk-tarcin": [{ url: "/images/products/cubuk-tarcin.webp", altText: "OSSA Çubuk tarçın" }],
  corekotu: [{ url: "/images/products/corekotu.webp", altText: "OSSA Çörekotu" }],
  "cig-badem": [
    { url: "/images/products/cig-badem.webp", altText: "OSSA Çiğ badem" },
    { url: "/images/products/cig-badem-2.webp", altText: "OSSA Çiğ badem" },
  ],
  "cig-kaju": [
    { url: "/images/products/cig-kaju.webp", altText: "OSSA Çiğ kaju" },
    { url: "/images/products/cig-kaju-2.webp", altText: "OSSA Çiğ kaju" },
  ],
  isot: [{ url: "/images/products/isot.webp", altText: "OSSA İsot" }],
  "sekerli-leblebi": [{ url: "/images/products/sekerli-leblebi.webp", altText: "OSSA Şekerli leblebi" }],
  "fitilli-lokum": [{ url: "/images/products/fitilli-lokum.webp", altText: "OSSA Fitilli lokum" }],
  ihlamur: [{ url: "/images/products/ihlamur.webp", altText: "OSSA Ihlamur" }],
  "luks-karisik": [{ url: "/images/products/luks-karisik.webp", altText: "OSSA Lüks Karışık" }],
  "kabak-cekirdegi": [{ url: "/images/products/kabak-cekirdegi.webp", altText: "OSSA Kabak çekirdeği" }],
  nane: [{ url: "/images/products/nane.webp", altText: "OSSA Nane" }],
  "luks-hurma": [{ url: "/images/products/luks-hurma.webp", altText: "OSSA Lüks hurma" }],
  rezene: [{ url: "/images/products/rezene.webp", altText: "OSSA Rezene" }],
  "salamura-kabak": [{ url: "/images/products/salamura-kabak.webp", altText: "OSSA Salamura kabak" }],
  "spesiyal-karisik": [{ url: "/images/products/spesiyal-karisik.webp", altText: "OSSA Spesiyal Karışık" }],
  "toz-biber": [{ url: "/images/products/toz-biber.webp", altText: "OSSA Toz biber" }],
  "sari-leblebi": [{ url: "/images/products/sari-leblebi.webp", altText: "OSSA Sarı leblebi" }],
  "tuzsuz-sari-leblebi": [{ url: "/images/products/tuzsuz-sari-leblebi.webp", altText: "OSSA Tuzsuz sarı leblebi" }],
  "cig-kabak": [{ url: "/images/products/cig-kabak.webp", altText: "OSSA Çiğ kabak" }],
  "mix-cerez": [{ url: "/images/products/mix-cerez.webp", altText: "OSSA Mix Çerez" }],
  "cig-findik-ici": [{ url: "/images/products/cig-findik-ici.webp", altText: "OSSA Çiğ fındık içi" }],
  susam: [{ url: "/images/products/susam.webp", altText: "OSSA Susam" }],
  "meyveli-kus-lokum": [
    { url: "/images/products/meyveli-kus-lokum.webp", altText: "OSSA Meyveli kuş lokum" },
    { url: "/images/products/meyveli-kus-lokum-2.webp", altText: "OSSA Meyveli kuş lokum" },
  ],
  "balli-susamli-kurabiye": [{ url: "/images/products/balli-susamli-kurabiye.webp", altText: "OSSA Ballı susamlı kurabiye" }],
  bonibon: [{ url: "/images/products/bonibon.webp", altText: "OSSA Bonibon" }],
  gofret: [{ url: "/images/products/gofret.webp", altText: "OSSA Gofret" }],
  "hashasli-balli-kurabiye": [{ url: "/images/products/hashasli-balli-kurabiye.webp", altText: "OSSA Haşhaşlı ballı kurabiye" }],
  "karisik-draje": [{ url: "/images/products/karisik-draje.webp", altText: "OSSA Karışık draje" }],
  kurabiye: [{ url: "/images/products/kurabiye.webp", altText: "OSSA Kurabiye" }],
  "kis-cayi": [{ url: "/images/products/kis-cayi.webp", altText: "OSSA Kış çayı" }],
  "nescafe-48-li": [{ url: "/images/products/nescafe-48-li.webp", altText: "OSSA Nescafe 48'li" }],
  "ossa-kahve-cesnisi": [{ url: "/images/products/ossa-kahve-cesnisi.webp", altText: "OSSA Kahve Çeşnisi" }],
  "osmanli-dibek-kahvesi": [{ url: "/images/products/osmanli-dibek-kahvesi.webp", altText: "OSSA Osmanlı dibek kahvesi" }],
  yedibahar: [{ url: "/images/products/yedibahar.webp", altText: "OSSA Yedibahar" }],
  "bardak-kurabiye": [{ url: "/images/products/bardak-kurabiye.webp", altText: "OSSA Bardak kurabiye" }],
  "cekilmis-tahin": [{ url: "/images/products/cekilmis-tahin.webp", altText: "OSSA Çekilmiş tahin" }],
  "cemen-tozu": [{ url: "/images/products/cemen-tozu.webp", altText: "OSSA Çemen tozu" }],
  "cig-firt-fistik": [{ url: "/images/products/cig-firt-fistik.webp", altText: "OSSA Çiğ fırt fıstık" }],
  "dakota-cekirdek": [{ url: "/images/products/dakota-cekirdek.webp", altText: "OSSA Dakota çekirdek" }],
  finger: [{ url: "/images/products/finger.webp", altText: "OSSA Finger" }],
  "findikli-draje": [{ url: "/images/products/findikli-draje.webp", altText: "OSSA Fındıklı draje" }],
  kori: [{ url: "/images/products/kori.webp", altText: "OSSA Köri" }],
  "kuru-uzum": [{ url: "/images/products/kuru-uzum.webp", altText: "OSSA Kuru üzüm" }],
  "kibris-gevregi": [{ url: "/images/products/kibris-gevregi.webp", altText: "OSSA Kıbrıs gevreği" }],
  "ozbek-uzumu": [{ url: "/images/products/ozbek-uzumu.webp", altText: "OSSA Özbek üzümü" }],
  "patlatmalik-misir": [{ url: "/images/products/patlatmalik-misir.webp", altText: "OSSA Patlatmalık mısır" }],
  "pul-biber": [{ url: "/images/products/pul-biber.webp", altText: "OSSA Pul biber" }],

  // "Eksik Ürünler" klasöründen eklenen gerçek fotoğraflar (katalog temizliği +
  // görsel entegrasyonu görevi — bkz. o görevin sonu raporu).
  "bonbon-hurma": [{ url: "/images/products/bonbon-hurma.webp", altText: "OSSA Bonbon hurma" }],
  "m-hurma": [{ url: "/images/products/m-hurma.webp", altText: "OSSA M hurma" }],
  "antep-mini-cezerye": [{ url: "/images/products/antep-mini-cezerye.webp", altText: "OSSA Antep mini cezerye" }],
  "balli-susamli-lokum": [{ url: "/images/products/balli-susamli-lokum.webp", altText: "OSSA Ballı susamlı lokum" }],
  "cevizli-bandirma-lokumu": [
    { url: "/images/products/cevizli-bandirma-lokumu.webp", altText: "OSSA Cevizli bandırma lokumu" },
  ],
  "domates-kurusu": [{ url: "/images/products/domates-kurusu.webp", altText: "OSSA Domates kurusu" }],
  "findikli-lokum": [{ url: "/images/products/findikli-lokum.webp", altText: "OSSA Fındıklı lokum" }],
  "findikli-mini-cevizli-lokum": [
    { url: "/images/products/findikli-mini-cevizli-lokum.webp", altText: "OSSA Fındıklı mini cevizli lokum" },
  ],
  "findikli-yaprak-lokum": [
    { url: "/images/products/findikli-yaprak-lokum.webp", altText: "OSSA Fındıklı yaprak lokum" },
  ],
  "gullu-lokum": [{ url: "/images/products/gullu-lokum.webp", altText: "OSSA Güllü lokum" }],
  "hindistan-cevizli-bandirma": [
    { url: "/images/products/hindistan-cevizli-bandirma.webp", altText: "OSSA Hindistan cevizli bandırma" },
  ],
  "hindistan-cevizli-lokum": [
    { url: "/images/products/hindistan-cevizli-lokum.webp", altText: "OSSA Hindistan cevizli lokum" },
  ],
  "incir-kurusu": [{ url: "/images/products/incir-kurusu.webp", altText: "OSSA İncir kurusu" }],
  "jumbo-hurma": [{ url: "/images/products/jumbo-hurma.webp", altText: "OSSA Jumbo hurma" }],
  "kayisi-kurusu": [{ url: "/images/products/kayisi-kurusu.webp", altText: "OSSA Kayısı kurusu" }],
  "lokumlu-biskuvi": [{ url: "/images/products/lokumlu-biskuvi.webp", altText: "OSSA Lokumlu bisküvi" }],
  "luks-suudi-hurma": [{ url: "/images/products/luks-suudi-hurma.webp", altText: "OSSA Lüks Suudi hurma" }],
  "mini-gullu-lokum": [{ url: "/images/products/mini-gullu-lokum.webp", altText: "OSSA Mini güllü lokum" }],
  "ossa-antep-fistikli-lokum": [
    { url: "/images/products/ossa-antep-fistikli-lokum.webp", altText: "OSSA Antep Fıstıklı Lokum" },
  ],
  pestil: [{ url: "/images/products/pestil.webp", altText: "OSSA Pestil" }],
  pismaniye: [{ url: "/images/products/pismaniye.webp", altText: "OSSA Pişmaniye" }],
  "premium-hurma": [{ url: "/images/products/premium-hurma.webp", altText: "OSSA Premium hurma" }],
  "susamli-lokum": [{ url: "/images/products/susamli-lokum.webp", altText: "OSSA Susamlı lokum" }],
  "yas-hurma": [{ url: "/images/products/yas-hurma.webp", altText: "OSSA Yaş hurma" }],
};

export interface NewRealPhotoProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

// Kategori id'leri `CATEGORY_PLANS` (seed.ts) ile birebir aynı (cat-cerez, cat-lokum, ...).
// Hepsi status=DRAFT olarak oluşturulur (bkz. main() içindeki upsert) — gerçek
// fiyatı bilinmediğinden storefront'ta hiçbir zaman görünmezler.
export const NEW_REAL_PHOTO_PRODUCTS: NewRealPhotoProduct[] = [
  { id: "prod-aci-pul-biber", slug: "aci-pul-biber", name: "Acı Pul Biber", categoryId: "cat-baharat", imageUrl: "/images/products/aci-pul-biber.webp", altText: "OSSA Acı Pul Biber", sortOrder: 200 },
  { id: "prod-tatli-pul-biber", slug: "tatli-pul-biber", name: "Tatlı Pul Biber", categoryId: "cat-baharat", imageUrl: "/images/products/tatli-pul-biber.webp", altText: "OSSA Tatlı Pul Biber", sortOrder: 201 },
  { id: "prod-elma-dilimi-jelibon", slug: "elma-dilimi-jelibon", name: "Elma Dilimi Jelibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/elma-dilimi-jelibon.webp", altText: "OSSA Elma Dilimi Jelibon", sortOrder: 202 },
  { id: "prod-kalpli-jelibon", slug: "kalpli-jelibon", name: "Kalpli Jelibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/kalpli-jelibon.webp", altText: "OSSA Kalpli Jelibon", sortOrder: 203 },
  { id: "prod-orman-meyveli-jelibon", slug: "orman-meyveli-jelibon", name: "Orman Meyveli Jelibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/orman-meyveli-jelibon.webp", altText: "OSSA Orman Meyveli Jelibon", sortOrder: 204 },
  { id: "prod-leblebili-bonibon", slug: "leblebili-bonibon", name: "Leblebili Bonibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/leblebili-bonibon.webp", altText: "OSSA Leblebili Bonibon", sortOrder: 205 },
  { id: "prod-oval-bonibon", slug: "oval-bonibon", name: "Oval Bonibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/oval-bonibon.webp", altText: "OSSA Oval Bonibon", sortOrder: 206 },
  { id: "prod-renkli-bonibon", slug: "renkli-bonibon", name: "Renkli Bonibon", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/renkli-bonibon.webp", altText: "OSSA Renkli Bonibon", sortOrder: 207 },
  { id: "prod-giresun-findigi", slug: "giresun-findigi", name: "Giresun Fındığı", categoryId: "cat-cerez", imageUrl: "/images/products/giresun-findigi.webp", altText: "OSSA Giresun Fındığı", sortOrder: 208 },
  { id: "prod-kup-cezerye", slug: "kup-cezerye", name: "Küp Cezerye", categoryId: "cat-lokum", imageUrl: "/images/products/kup-cezerye.webp", altText: "OSSA Küp Cezerye", sortOrder: 209 },
  { id: "prod-yaprak-cezerye", slug: "yaprak-cezerye", name: "Yaprak Cezerye", categoryId: "cat-lokum", imageUrl: "/images/products/yaprak-cezerye.webp", altText: "OSSA Yaprak Cezerye", sortOrder: 210 },
  { id: "prod-sutlu-mini-lokum", slug: "sutlu-mini-lokum", name: "Sütlü Mini Lokum", categoryId: "cat-lokum", imageUrl: "/images/products/sutlu-mini-lokum.webp", altText: "OSSA Sütlü Mini Lokum", sortOrder: 211 },
  { id: "prod-siyah-cekirdek", slug: "siyah-cekirdek", name: "Siyah Çekirdek", categoryId: "cat-cerez", imageUrl: "/images/products/siyah-cekirdek.webp", altText: "OSSA Siyah Çekirdek", sortOrder: 212 },
  { id: "prod-tuzsuz-siyah-cekirdek", slug: "tuzsuz-siyah-cekirdek", name: "Tuzsuz Siyah Çekirdek", categoryId: "cat-cerez", imageUrl: "/images/products/tuzsuz-siyah-cekirdek.webp", altText: "OSSA Tuzsuz Siyah Çekirdek", sortOrder: 213 },
  // Kategori düzeltmesi (iş kararı): kök hâlindeki Zencefil/Zerdeçal semantik olarak
  // Baharat kategorisine ait — DRAFT statüsü ve sortOrder değişmedi, yalnızca categoryId.
  { id: "prod-zencefil-koku", slug: "zencefil-koku", name: "Zencefil Kökü", categoryId: "cat-baharat", imageUrl: "/images/products/zencefil-koku.webp", altText: "OSSA Zencefil Kökü", sortOrder: 214 },
  { id: "prod-zerdecal-koku", slug: "zerdecal-koku", name: "Zerdeçal Kökü", categoryId: "cat-baharat", imageUrl: "/images/products/zerdecal-koku.webp", altText: "OSSA Zerdeçal Kökü", sortOrder: 215 },
  { id: "prod-cekirdeksiz-sari-uzum", slug: "cekirdeksiz-sari-uzum", name: "Çekirdeksiz Sarı Üzüm", categoryId: "cat-cerez", imageUrl: "/images/products/cekirdeksiz-sari-uzum.webp", altText: "OSSA Çekirdeksiz Sarı Üzüm", sortOrder: 216 },
  { id: "prod-ada-cayi", slug: "ada-cayi", name: "Ada Çayı", categoryId: "cat-cay-kahve", imageUrl: "/images/products/ada-cayi.webp", altText: "OSSA Ada Çayı", sortOrder: 217 },
  { id: "prod-baklava-lokum", slug: "baklava-lokum", name: "Baklava Lokum", categoryId: "cat-lokum", imageUrl: "/images/products/baklava-lokum.webp", altText: "OSSA Baklava Lokum", sortOrder: 218 },
  { id: "prod-balli-susamli-leblebi", slug: "balli-susamli-leblebi", name: "Ballı Susamlı Leblebi", categoryId: "cat-cerez", imageUrl: "/images/products/balli-susamli-leblebi.webp", altText: "OSSA Ballı Susamlı Leblebi", sortOrder: 219 },
  { id: "prod-cevizli-sucuk", slug: "cevizli-sucuk", name: "Cevizli Sucuk", categoryId: "cat-lokum", imageUrl: "/images/products/cevizli-sucuk.webp", altText: "OSSA Cevizli Sucuk", sortOrder: 220 },
  { id: "prod-cips", slug: "cips", name: "Cips", categoryId: "cat-cerez", imageUrl: "/images/products/cips.webp", altText: "OSSA Cips", sortOrder: 221 },
  { id: "prod-cubuk-cips", slug: "cubuk-cips", name: "Çubuk Cips", categoryId: "cat-cerez", imageUrl: "/images/products/cubuk-cips.webp", altText: "OSSA Çubuk Cips", sortOrder: 222 },
  { id: "prod-misirli-cips", slug: "misirli-cips", name: "Mısırlı Cips", categoryId: "cat-cerez", imageUrl: "/images/products/misirli-cips.webp", altText: "OSSA Mısırlı Cips", sortOrder: 223 },
  { id: "prod-hashasli-bal-patlak", slug: "hashasli-bal-patlak", name: "Haşhaşlı Bal Patlak", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/hashasli-bal-patlak.webp", altText: "OSSA Haşhaşlı Bal Patlak", sortOrder: 224 },
  { id: "prod-kabuklu-el-bademi", slug: "kabuklu-el-bademi", name: "Kabuklu El Bademi", categoryId: "cat-cerez", imageUrl: "/images/products/kabuklu-el-bademi.webp", altText: "OSSA Kabuklu El Bademi", sortOrder: 225 },
  { id: "prod-renkli-badem-sekeri", slug: "renkli-badem-sekeri", name: "Renkli Badem Şekeri", categoryId: "cat-kurabiye-sekerleme", imageUrl: "/images/products/renkli-badem-sekeri.webp", altText: "OSSA Renkli Badem Şekeri", sortOrder: 226 },
];
