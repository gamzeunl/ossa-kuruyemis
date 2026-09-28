/**
 * `docs/PRODUCT_INFORMATION_RESEARCH_REPORT.md` araştırmasının kod hâli — TEK
 * kaynak. `seed.ts` bu dosyayı import eder, ürün/fiyat/kategori/varyant
 * mantığına DOKUNMAZ.
 *
 * Her alan OPSİYONELDİR (`undefined` = bu üründe bu bilgi yazılmaz, DB'de
 * NULL kalır). `nutrition` yalnızca raporun SINGLE_INGREDIENT_REFERENCE_SAFE /
 * PROCESS_VARIANT_REVIEW (HIGH/MEDIUM confidence) sınıfındaki ~55 üründe
 * dolu — RECIPE_REQUIRED ürünlerde (lokum/kurabiye/çikolata/draje/sos-kaplamalı
 * çerez/karışık çerez/marka ürünleri) `nutrition` hiç YOK. `allergenInfo`
 * yalnızca ürünün KENDİSİ doğrudan bir alerjen olduğunda dolu — çapraz
 * bulaşma iddiası hiçbir üründe YOK. `originInfo` — rapor 143/143 ürünü
 * SUPPLIER_INFO_REQUIRED işaretlediğinden bu dosyada TEK bir üründe bile
 * doldurulmadı (bilerek, ürün adından menşe üretilmedi).
 */

export interface ProductNutritionInfo {
  energyKcal?: number;
  energyKj?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrate?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
  sourceName: string;
  sourceUrl: string;
  sourceProduct: string;
  referenceType: "REFERENCE_AVERAGE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface ProductInformationEntry {
  description?: string;
  ingredients?: string;
  usageSuggestion?: string;
  storageConditions?: string;
  allergenInfo?: string;
  nutrition?: ProductNutritionInfo;
}

const USDA = "USDA FoodData Central";
const USDA_URL = "https://fdc.nal.usda.gov/";

const STORAGE_NUTS =
  "Serin, kuru ve doğrudan güneş ışığı almayan bir ortamda saklayınız. Ambalaj açıldıktan sonra ağzını sıkıca kapatarak veya hava almayan kapaklı bir kapta muhafaza etmeniz, yağ oranı yüksek bu tür ürünlerde tazeliğin korunmasına yardımcı olur.";
const STORAGE_SPICE =
  "Aromasının ve renginin korunması için karanlık, serin bir ortamda, sıkıca kapatılmış bir kapta saklayınız. Nem, baharatın topaklanmasına ve aromasını kaybetmesine yol açabilir.";
const STORAGE_DRIED_FRUIT =
  "Serin ve kuru bir ortamda, kapalı ambalajında saklayınız. Ambalaj açıldıktan sonra hava almayan bir kapta muhafaza edilmesi, ürünün kıvamını korumasına yardımcı olur.";
const STORAGE_TEA =
  "Aroma kaybını önlemek için ışık almayan, serin ve kuru bir ortamda, kapalı ambalajında saklayınız. Nemli ortamlardan uzak tutunuz.";
const STORAGE_CONFECTIONERY =
  "Serin ve kuru bir ortamda, doğrudan güneş ışığından uzak şekilde saklayınız. Sıcak ortamlarda şekilde/kaplamada yumuşama veya renk değişimi görülebilir.";

export const PRODUCT_INFORMATION: Record<string, ProductInformationEntry> = {
  // ==================== ÇEREZ ====================
  "antep-fistigi": {
    description:
      "Antep fıstığı, Türkiye'nin en tanınan kuruyemişlerinden biri olarak iri taneleri ve kendine has, hafif tatlımsı aromasıyla öne çıkar. Çiğnendiğinde belirgin bir çıtırlık hissettiren dokusu, onu diğer sert kabuklu yemişlerden ayıran karakteristik özelliklerden biridir. Tek başına bir atıştırmalık olarak tüketilebileceği gibi, tatlı ve pasta tariflerinde süsleme veya iç malzeme olarak da sıkça tercih edilir. Misafir ikramlarında, sohbet sofralarında ve ofis molalarında pratik bir seçenek sunar; küçük porsiyonlar hâlinde paylaşılmaya uygun yapısıyla da bilinir. OSSA Kuruyemiş rafında tane büyüklüğü ve görünüm gözetilerek ayıklanmış hâliyle sunulan bu ürün, ambalajı açıldıktan sonra ağzının sıkıca kapatılması hâlinde tazeliğini daha uzun süre koruyabilir. Antep fıstığı, kuruyemiş karışımlarına eklendiğinde de görsel ve lezzet açısından zenginlik katar.",
    ingredients: "Antep fıstığı (%100).",
    usageSuggestion: "Günlük atıştırmalık, ikramlık veya tatlı/pasta yapımında kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "beyaz-leblebi": {
    description:
      "Beyaz leblebi, kavrulmuş nohuttan elde edilen ve adını açık renkli görünümünden alan geleneksel bir çerezdir. Diğer leblebi çeşitlerine kıyasla daha sade bir işlemden geçtiği düşünülen yapısıyla, nohudun doğal tadına yakın bir lezzet sunar. Çiğnendiğinde belirgin bir çıtırlık veren dokusu, uzun süredir Türk çerez kültüründe yer edinmesinin başlıca nedenlerinden biridir. Tek başına atıştırmalık olarak tüketilebileceği gibi, karışık çerez tabaklarında diğer leblebi ve kuruyemiş çeşitleriyle bir arada da sunulabilir. Günlük hayatta pratik bir ara öğün seçeneği arayanlar için uygun bir üründür; iş yerinde, okulda veya yolculukta kolayca taşınabilir. OSSA Kuruyemiş'te uygun kavurma ve ayıklama sürecinden geçirilerek hazırlanan beyaz leblebi, klasik leblebi lezzetini arayan tüketiciler için sade bir seçenektir.",
    usageSuggestion: "Günlük atıştırmalık olarak veya karışık çerez tabaklarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  bugday: {
    description:
      "Kavrulmuş buğday, Anadolu'nun köklü çerez kültüründe uzun yıllardır yer alan, sade ve doyurucu bir atıştırmalıktır. Tahıl tanelerinin kavrulmasıyla elde edilen bu ürün, çiğnendiğinde çıtır bir doku ve hafif kavrulmuş bir aroma sunar. Genellikle tuzlu hâliyle tüketilen kavrulmuş buğday, tek başına bir atıştırmalık olabileceği gibi kavurga karışımlarının da temel bileşenlerinden biridir. Sinema, maç izlerken veya arkadaş sohbetlerinde paylaşılan pratik çerezler arasında yer alır; küçük kaplarda porsiyonlanarak ikram edilmeye de uygundur. Diğer kavrulmuş taneli çerezlerle (nohut, mısır gibi) bir arada sunulduğunda karışık çerez tabaklarına farklı bir doku ve tat katkısı sağlar. OSSA Kuruyemiş'te geleneksel yöntemle kavrulmuş hâliyle sunulan buğday, sade lezzetleri tercih eden damaklar için uygun bir seçenektir.",
    usageSuggestion: "Günlük atıştırmalık veya karışık çerez karışımlarında kullanılabilir.",
    storageConditions: STORAGE_NUTS,
  },
  "ceviz-ici": {
    description:
      "Ceviz içi, kıvrımlı ve girintili yapısıyla kolayca tanınan, belirgin bir aromaya sahip bir kuruyemiştir. Kabuğundan ayıklanmış hâliyle doğrudan tüketime hazır olarak sunulan bu ürün, hafif buruk ve yağlı bir tat profiline sahiptir. Tek başına atıştırmalık olarak tercih edilebileceği gibi, kek, kurabiye, baklava ve çeşitli tatlı tariflerinde iç malzeme veya üst süsleme olarak da yaygın şekilde kullanılır. Kahvaltı sofralarında bal veya reçel ile birlikte tüketilmesi de yaygın bir alışkanlıktır. Salatalara eklendiğinde çıtır bir doku katkısı sağlayan ceviz içi, aynı zamanda ev yapımı granola ve müsli karışımlarında da tercih edilir. OSSA Kuruyemiş'te tane bütünlüğüne özen gösterilerek ayıklanan ceviz içi, hem günlük tüketim hem de mutfakta çok yönlü kullanım arayanlar için pratik bir seçenektir.",
    ingredients: "Ceviz içi (%100).",
    usageSuggestion: "Kahvaltıda, tatlı ve hamur işi tariflerinde veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (ceviz) içerir.",
    nutrition: {
      energyKcal: 654,
      protein: 15.23,
      fat: 65.21,
      saturatedFat: 6.13,
      carbohydrate: 13.71,
      sugars: 2.61,
      fiber: 6.7,
      salt: 0.005,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170187/nutrients",
      sourceProduct: "Nuts, walnuts, english",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "cig-badem": {
    description:
      "Çiğ badem, kavrulmamış ve tuzlanmamış hâliyle bademin doğal, hafif tatlımsı aromasını olduğu gibi koruyan bir kuruyemiştir. İri ve dolgun taneleri, çiğnendiğinde belirgin bir sertlik ve hafif kremamsı bir doku hissettirir. İşlenmemiş yapısı nedeniyle hem günlük atıştırmalık olarak hem de kahvaltılık karışımların, granola ve müslinin bir parçası olarak tercih edilir. Hamur işlerinde, kek ve kurabiye tariflerinde doğranarak veya bütün hâliyle kullanılabilir; tatlı süslemelerinde de sıkça yer bulur. Diyetine dikkat eden ve kavrulmamış/tuzsuz kuruyemiş arayan tüketiciler için uygun bir seçenek olan çiğ badem, aynı zamanda ev yapımı badem sütü veya badem ezmesi hazırlamak isteyenler için de tercih edilir. OSSA Kuruyemiş'te tane büyüklüğüne göre ayıklanmış hâliyle sunulan bu ürün, doğal hâliyle tüketim arayanlar için pratik bir tercihtir.",
    ingredients: "Çiğ badem (%100).",
    usageSuggestion: "Kahvaltıda, günlük atıştırmalık olarak veya tatlı/hamur işi tariflerinde kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (badem) içerir.",
    nutrition: {
      energyKcal: 579,
      protein: 21.2,
      fat: 49.9,
      saturatedFat: 3.8,
      carbohydrate: 21.6,
      sugars: 4.4,
      fiber: 12.5,
      salt: 0.003,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170567/nutrients",
      sourceProduct: "Nuts, almonds",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "cig-findik-ici": {
    description:
      "Çiğ fındık içi, kabuğundan ayıklanmış ve kavrulmamış hâliyle fındığın doğal, hafif tatlımsı aromasını koruyan bir kuruyemiştir. Yuvarlak ve dolgun taneleri, çiğnendiğinde yumuşak ama belirgin bir doku sunar. İşlenmemiş yapısıyla hem doğrudan atıştırmalık olarak hem de kahvaltılık karışımlarda, granola ve müslide tercih edilir. Kek, kurabiye ve çikolatalı tatlı tariflerinde iç malzeme veya üst süsleme olarak yaygın şekilde kullanılan çiğ fındık içi, ev yapımı fındık ezmesi veya fındık sütü hazırlamak isteyenler için de uygundur. Salatalara veya yoğurda eklendiğinde ekstra bir çıtırlık ve besin çeşitliliği katar. OSSA Kuruyemiş'te ayıklama sürecine özen gösterilerek hazırlanan bu ürün, tuzsuz ve kavrulmamış kuruyemiş tercih eden tüketiciler için pratik bir seçenek sunar; hem mutfakta hem sofrada çok yönlü kullanılabilir.",
    ingredients: "Çiğ fındık içi (%100).",
    usageSuggestion: "Kahvaltıda, günlük atıştırmalık olarak veya tatlı/hamur işi tariflerinde kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (fındık) içerir.",
    nutrition: {
      energyKcal: 628,
      energyKj: 2629,
      protein: 14.95,
      fat: 60.75,
      saturatedFat: 4.46,
      carbohydrate: 16.7,
      sugars: 4.34,
      fiber: 9.7,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170581/nutrients",
      sourceProduct: "Nuts, hazelnuts or filberts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "cig-firt-fistik": {
    description:
      "Çiğ fırt fıstık, küçük taneli ve kavrulmamış bir Antep fıstığı çeşididir; doğal hâliyle daha narin ve hafif bir aroma taşır. \"Fırt\" olarak adlandırılan bu tür, klasik iri taneli fıstıktan farklı olarak daha küçük boyutlu taneleriyle bilinir ve kabuğuyla birlikte veya iç olarak tüketilebilir. İşlenmemiş yapısı sayesinde fıstığın doğal tadını arayan tüketiciler için tercih edilir. Tek başına bir atıştırmalık olarak sunulabileceği gibi, kuruyemiş karışımlarına eklendiğinde farklı bir tat ve görsel çeşitlilik katar. Küçük tane yapısı nedeniyle çocuklar için de pratik bir porsiyon seçeneği olabilir. OSSA Kuruyemiş'te özenle ayıklanan çiğ fırt fıstık, klasik Antep fıstığına göre daha hafif ve narin bir deneyim arayan, kavrulmamış/tuzsuz kuruyemiş tercih eden tüketiciler için uygun bir alternatiftir.",
    ingredients: "Çiğ fırt fıstık (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      salt: 0.003,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "cig-kabak": {
    description:
      "Çiğ kabak çekirdeği, kavrulmamış ve tuzlanmamış hâliyle kabak çekirdeğinin doğal yapısını ve hafif yağlı dokusunu koruyan bir üründür. Yassı ve oval taneleri, çiğnendiğinde yumuşak bir doku ve hafif fındıksı bir aroma sunar. İşlenmemiş yapısı sayesinde hem doğrudan atıştırmalık olarak hem de salata, yoğurt ve kahvaltılık karışımların üzerine serpilerek tüketilir. Ev yapımı granola ve müsli tariflerinde de sıkça tercih edilen çiğ kabak çekirdeği, ekmek ve pasta hamurlarına eklenerek farklı bir doku katkısı sağlayabilir. Tuzsuz ve kavrulmamış kuruyemiş arayan, günlük beslenme rutinine çeşitlilik katmak isteyen tüketiciler için pratik bir seçenektir. OSSA Kuruyemiş'te temiz ve ayıklanmış hâliyle sunulan bu ürün, hem sofrada hem mutfakta kolayca kullanılabilecek çok yönlü bir kuruyemiştir.",
    ingredients: "Çiğ kabak çekirdeği (%100).",
    usageSuggestion: "Salata üzerinde, kahvaltıda veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    nutrition: {
      energyKcal: 555,
      protein: 29.9,
      fat: 40.0,
      carbohydrate: 18.7,
      fiber: 5.1,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/2515380/nutrients",
      sourceProduct: "Seeds, pumpkin seeds (pepitas), raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "cig-kaju": {
    description:
      "Çiğ kaju, kavrulmamış hâliyle kajunun yumuşak dokusunu ve hafif tatlımsı, kremamsı aromasını koruyan bir kuruyemiştir. Kıvrık, böbrek şeklindeki taneleri diğer kuruyemişlere kıyasla daha yumuşak bir çiğneme hissi verir. İşlenmemiş yapısı sayesinde doğal tat arayan tüketiciler için tercih edilen çiğ kaju, tek başına atıştırmalık olarak tüketilebileceği gibi karışık çerez tabaklarında ve tatlı tariflerinde de kullanılabilir. Ev yapımı kaju sütü veya kaju bazlı kremalar hazırlamak isteyenler için de uygun bir hammaddedir. Yumuşak dokusu sayesinde çiğnemesi kolay olan bu ürün, hem çocuklar hem de yetişkinler için pratik bir atıştırmalık seçeneğidir. OSSA Kuruyemiş'te özenle ayıklanan çiğ kaju, kavrulmamış ve tuzsuz kuruyemiş tercih eden, doğal lezzeti önceleyen tüketiciler için uygun bir tercihtir.",
    ingredients: "Çiğ kaju (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya karışık çerez tabaklarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (kaju) içerir.",
    nutrition: {
      energyKcal: 553,
      protein: 18.22,
      fat: 43.85,
      saturatedFat: 7.78,
      carbohydrate: 30.19,
      sugars: 5.91,
      fiber: 3.3,
      salt: 0.03,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170162/nutrients",
      sourceProduct: "Nuts, cashew nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "citir-leblebi": {
    description:
      "Çıtır leblebi, adını aldığı belirgin çıtır dokusuyla diğer leblebi çeşitlerinden ayrılan, kavrulmuş nohut esaslı bir çerezdir. Ağza atıldığında hemen hissedilen sertlik ve kırılganlık, bu ürünü özellikle çıtır dokulu atıştırmalıkları sevenler için cazip kılar. Sade veya hafif tuzlu hâliyle tek başına tüketilebileceği gibi, karışık çerez tabaklarında diğer leblebi ve kuruyemiş çeşitleriyle bir arada da sunulabilir. Ofis molalarında, yolculuklarda ve televizyon karşısında pratik bir atıştırmalık arayanlar için uygun bir seçenektir. Küçük porsiyonlar hâlinde paylaşıma da uygun olan çıtır leblebi, geleneksel leblebi lezzetine farklı bir doku deneyimi katmak isteyenler için tercih edilir. OSSA Kuruyemiş'te kavurma sürecine özen gösterilerek hazırlanan bu ürün, günlük atıştırmalık ihtiyacına pratik bir çözüm sunar.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "dakota-cekirdek": {
    description:
      "Dakota çekirdek, ayçiçeği çekirdeğinin iri taneli bir çeşidi olarak bilinir ve standart ayçiçeği çekirdeğine kıyasla daha büyük tane yapısıyla dikkat çeker. Kavrulmuş hâliyle sunulan bu ürün, çıtır dokusu ve karakteristik ayçiçeği aromasıyla Türkiye'de en yaygın tüketilen çerezlerden biri olan çekirdek ailesinin bir parçasıdır. Kabuğuyla birlikte çıtlatılarak tüketilen dakota çekirdek, sohbet sofralarında, sinema ve maç izlerken paylaşılan geleneksel atıştırmalıklar arasında yer alır. Tek başına tüketilebileceği gibi karışık çerez tabaklarında diğer çekirdek çeşitleriyle bir arada da sunulabilir. İri tane yapısı, çıtlatma sürecini daha pratik hâle getirdiğinden özellikle uzun süreli atıştırmalık oturumları için tercih edilir. OSSA Kuruyemiş'te uygun kavurma sürecinden geçirilerek hazırlanan dakota çekirdek, klasik çekirdek keyfini arayan tüketiciler için sunulur.",
    ingredients: "Ayçiçeği çekirdeği (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya karışık çerez tabaklarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
    nutrition: {
      energyKcal: 584,
      protein: 20.78,
      fat: 51.46,
      carbohydrate: 20,
      fiber: 8.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170562/nutrients",
      sourceProduct: "Seeds, sunflower seed kernels, dried",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "firt-fistik": {
    description:
      "Fırt fıstık, küçük taneli ve karakteristik bir aromaya sahip bir Antep fıstığı çeşididir. Klasik iri taneli fıstığa kıyasla daha küçük ve narin taneleriyle bilinen bu ürün, hafif ve zarif bir tat profili sunar. Tek başına atıştırmalık olarak tüketilebileceği gibi, kuruyemiş karışımlarına eklendiğinde farklı bir tat ve görsel çeşitlilik katar. Küçük tane yapısı sayesinde çocuklar için de pratik bir porsiyon seçeneği olabilen fırt fıstık, kabuğuyla birlikte çıtlatılarak veya iç hâliyle tüketilebilir. Antep fıstığı ailesinin bu özel çeşidi, geleneksel çerez sofralarında ve misafir ikramlarında da yer bulur. OSSA Kuruyemiş'te tane büyüklüğü gözetilerek ayıklanan fırt fıstık, klasik fıstık lezzetini farklı bir tane boyutunda deneyimlemek isteyen tüketiciler için uygun bir alternatiftir.",
    ingredients: "Fırt fıstık (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "fistik-ici": {
    description:
      "Fıstık içi, kabuğundan ayıklanmış Antep fıstığı taneleridir ve doğrudan tüketime hazır hâliyle sunulur. Karakteristik aroması ve dolgun dokusuyla bilinen bu ürün, tek başına bir atıştırmalık olarak tercih edilebileceği gibi, baklava, künefe ve çeşitli tatlı tariflerinde iç malzeme veya üst süsleme olarak da yaygın şekilde kullanılır. Kabuk ayıklama zahmetinden kurtulmak isteyen ve pratik bir fıstık deneyimi arayan tüketiciler için uygun bir seçenektir. Kek ve dondurma üzerine serpiştirilerek de kullanılabilen fıstık içi, mutfakta çok yönlü bir malzeme olma özelliği taşır. Kuruyemiş karışımlarına eklendiğinde görsel ve lezzet açısından zenginlik katan bu ürün, hediyelik paketlerde de tercih edilir. OSSA Kuruyemiş'te tane bütünlüğüne özen gösterilerek ayıklanan fıstık içi, hem sofra hem mutfak kullanımı için pratik bir tercihtir.",
    ingredients: "Antep fıstığı içi (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya tatlı tariflerinde iç malzeme olarak kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "kabak-cekirdegi": {
    description:
      "Kabak çekirdeği, kavrulmuş hâliyle çıtır dokusu ve karakteristik aromasıyla bilinen, Türkiye'de en yaygın tüketilen çerezlerden biridir. Yassı ve oval taneleri, çiğnendiğinde belirgin bir çıtırlık ve hafif tuzlu bir tat sunar. Kabuklu veya kabuksuz (iç) formuyla sofralarda yer bulan bu ürün, sinema, maç izlerken ve sohbet ortamlarında pratik bir atıştırmalık olarak tercih edilir. Tek başına tüketilebileceği gibi diğer çekirdek ve çerez çeşitleriyle bir arada karışık çerez tabaklarında da sunulabilir. Küçük porsiyonlar hâlinde paylaşıma uygun yapısı, ofis ve okul ortamlarında da pratik bir seçenek olmasını sağlar. OSSA Kuruyemiş'te geleneksel kavurma yöntemiyle hazırlanan kabak çekirdeği, klasik Türk çerez kültürünün vazgeçilmez ürünlerinden biri olarak sofralarda yerini korur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    nutrition: {
      energyKcal: 574,
      energyKj: 2402,
      protein: 29.8,
      fat: 49.1,
      saturatedFat: 8.5,
      carbohydrate: 14.7,
      sugars: 1.3,
      fiber: 6.5,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170557/nutrients",
      sourceProduct:
        "Seeds, pumpkin and squash seed kernels, roasted, without salt (OSSA ürünü hafif tuzlu olduğundan tuz/sodyum değeri ölçülmediği için yazılmadı; diğer değerler tuzlamadan etkilenmez)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "kabuklu-ceviz": {
    description:
      "Kabuklu ceviz, doğal kabuğuyla satılan ve kırılarak tüketilen geleneksel bir kuruyemiştir. İçindeki tane, belirgin ve hafif buruk aromasıyla bilinir; kabuğun kırılma süreci de ceviz tüketimini keyifli bir sofra etkinliğine dönüştürür. Aile sofralarında, kış akşamlarında sohbet eşliğinde tüketilen kabuklu ceviz, geleneksel Türk çerez kültüründe önemli bir yere sahiptir. Tane bütünlüğünün ve tazeliğinin korunması açısından kabuklu hâliyle satılması tercih edilen bu ürün, ihtiyaç duyuldukça kırılarak taze tüketilebilir. Tatlı ve hamur işi tariflerinde kullanılmak istendiğinde kabuğu kırılıp iç kısmı ayrılarak hazırlanabilir. OSSA Kuruyemiş'te kabuk kalitesi ve tane doluluğu gözetilerek seçilen kabuklu ceviz, hem günlük atıştırmalık hem de geleneksel kış sofralarının vazgeçilmez bir parçası olarak sunulur.",
    ingredients: "Ceviz (kabuklu) (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya tatlı/hamur işi tariflerinde kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (ceviz) içerir.",
    nutrition: {
      energyKcal: 654,
      protein: 15.23,
      fat: 65.21,
      saturatedFat: 6.13,
      carbohydrate: 13.71,
      sugars: 2.61,
      fiber: 6.7,
      salt: 0.005,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170187/nutrients",
      sourceProduct: "Nuts, walnuts, english",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "karisik-cerez": {
    description:
      "Karışık çerez, farklı kuruyemiş ve çekirdek çeşitlerinin bir arada sunulduğu, çeşitliliği seven damaklar için hazırlanmış pratik bir karışımdır. Tek bir kutuda birden fazla tat ve doku deneyimi sunan bu ürün, hangi çerezi tercih edeceğine karar veremeyenler için ideal bir çözümdür. Sohbet sofralarında, misafir ikramında ve aile toplantılarında pratik bir sunum imkânı sağlayan karışık çerez, farklı damak zevklerine hitap edecek şekilde çeşitlilik sunar. Ofis ortamlarında veya yolculuklarda da kolayca taşınabilen ambalajıyla günlük atıştırmalık ihtiyacına uygun bir seçenektir. İçeriğindeki çeşitliliğin ürün etiketinden kontrol edilmesi, alerjik hassasiyeti olan tüketiciler için önerilir. OSSA Kuruyemiş'te özenle bir araya getirilen karışık çerez, hem klasik hem de farklı lezzetleri bir arada deneyimlemek isteyenler için hazırlanmıştır.",
    usageSuggestion: "Misafir ikramında veya sohbet sofralarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  kavurga: {
    description:
      "Kavurga, kavrulmuş buğday ve nohut gibi tahıl ve baklagillerin bir araya geldiği geleneksel bir çerez karışımıdır. Anadolu'nun köklü çerez kültüründe önemli bir yere sahip olan bu ürün, çıtır dokusu ve sade, kavrulmuş lezzetiyle bilinir. Genellikle kutlama ve düğün gibi özel günlerde ikram edilen kavurga, aynı zamanda günlük atıştırmalık olarak da tercih edilir. Farklı tahıl ve baklagil türlerinin bir arada sunulması, tek bir üründe çeşitli doku ve tat deneyimi sunar. Sohbet sofralarında, misafir ağırlamada ve aile toplantılarında geleneksel bir ikram seçeneği olan kavurga, sade lezzetleri sevenler için uygun bir tercihtir. OSSA Kuruyemiş'te geleneksel kavurma yöntemiyle hazırlanan bu ürün, Anadolu çerez kültürünün özgün lezzetlerinden birini sofralara taşır.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "koy-leblebisi": {
    description:
      "Köy leblebisi, geleneksel yöntemle kavrulmuş, sade ve doğal dokusuyla öne çıkan bir nohut leblebisi çeşididir. Adından da anlaşılacağı üzere, kırsal/köy usulü hazırlama yöntemine atıfta bulunan bu ürün, ekstra işlem görmemiş hâliyle klasik leblebi lezzetini arayanlar için hazırlanmıştır. Diğer leblebi çeşitlerine kıyasla daha sade bir görünüme ve dokuya sahip olan köy leblebisi, çiğnendiğinde belirgin bir sertlik ve kavrulmuş nohut aroması sunar. Tek başına atıştırmalık olarak tüketilebileceği gibi karışık çerez tabaklarında diğer leblebi çeşitleriyle bir arada da sunulabilir. Sade ve doğal lezzetleri tercih eden, aşırı işlenmiş ürünlerden uzak durmak isteyen tüketiciler için uygun bir seçenektir. OSSA Kuruyemiş'te geleneksel kavurma sürecinden geçirilerek hazırlanan köy leblebisi, klasik leblebi keyfini arayanlara sunulur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "kuru-uzum": {
    description:
      "Kuru üzüm, üzümün güneşte veya kontrollü koşullarda kurutulmasıyla elde edilen, yoğun tatlı aromasıyla bilinen bir kuru meyvedir. Kurutma süreci sonucunda şeker içeriği yoğunlaşan üzüm taneleri, çiğnendiğinde yumuşak ve elastik bir doku sunar. Tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltılık karışımlara, müsli ve granolaya eklenerek de sıkça tercih edilir. Pilav tariflerinde tatlandırıcı bir katkı malzemesi olarak kullanılan kuru üzüm, hamur işi ve kek tariflerinde de yaygın şekilde yer alır. Doğal tatlılık arayan ve şekerli atıştırmalıklara alternatif isteyen tüketiciler için uygun bir seçenektir. Çocuk beslenmesinde de sıkça tercih edilen kuru üzüm, pratik ambalajıyla okul çantalarına veya iş çantalarına kolayca eklenebilir. OSSA Kuruyemiş'te özenle seçilen kuru üzüm, günlük beslenme rutinine doğal bir tatlılık katmak isteyenlere sunulur.",
    ingredients: "Kuru üzüm (%100).",
    usageSuggestion: "Kahvaltıda, pilav ve hamur işi tariflerinde veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 299,
      protein: 3.3,
      fat: 0.25,
      carbohydrate: 79.3,
      sugars: 65.2,
      fiber: 4.5,
      salt: 0.065,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168165/nutrients",
      sourceProduct: "Raisins, dark, seedless",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "kus-uzumu": {
    description:
      "Kuş üzümü, küçük taneli ve yoğun aromalı bir kuru üzüm çeşididir; standart kuru üzüme kıyasla daha ufak boyutlu taneleriyle bilinir. Tatlı ve hafif ekşimsi tadıyla dikkat çeken bu ürün, kahvaltılık karışımlarda, müsli ve granolada sıkça tercih edilir. Küçük tane yapısı sayesinde hamur işlerine, keklere ve kurabiyelere eşit dağılımla eklenebilen kuş üzümü, pilav tariflerinde de tatlandırıcı bir katkı malzemesi olarak kullanılır. Tek başına bir atıştırmalık olarak tüketilebileceği gibi, yoğurt ve süt ürünleriyle birlikte de sofrada yer bulabilir. Yoğun tat profili sayesinde küçük miktarlarda bile belirgin bir tatlılık hissi veren kuş üzümü, çocuk beslenmesinde ve okul çantalarında pratik bir seçenektir. OSSA Kuruyemiş'te özenle seçilen kuş üzümü, günlük beslenmeye doğal bir tatlılık katmak isteyenlere uygun bir tercihtir.",
    ingredients: "Kuş üzümü (%100).",
    usageSuggestion: "Kahvaltıda, hamur işi tariflerinde veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 299,
      protein: 3.3,
      fat: 0.25,
      carbohydrate: 79.3,
      sugars: 65.2,
      fiber: 4.5,
      salt: 0.065,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168165/nutrients",
      sourceProduct: "Raisins, dark, seedless (yaklaşık referans — kuş üzümü için ayrı resmi kayıt bulunamadı)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "luks-karisik": {
    description:
      "Lüks Karışık, seçkin kuruyemiş çeşitlerinin bir araya getirildiği, özel günler ve ikramlar için hazırlanmış premium bir çerez karışımıdır. Farklı kuruyemiş türlerinin dengeli bir oranda bir araya getirilmesiyle hazırlanan bu ürün, tek bir kutuda çeşitli tat ve doku deneyimi sunmayı amaçlar. Misafir ağırlamada, özel gün sofralarında ve hediyelik paketlerde tercih edilen lüks karışık, görsel sunumu ve içerik zenginliğiyle öne çıkar. Kuruyemiş seçiminde çeşitlilik arayan ancak tek tek ürün almak yerine hazır bir karışım tercih etmek isteyen tüketiciler için pratik bir çözüm sunar. İçeriğindeki ürün çeşitliliğinin ambalaj etiketinden kontrol edilmesi, alerjik hassasiyeti olanlar için önemlidir. OSSA Kuruyemiş'te özenle bir araya getirilen bu karışım, özel anlarınıza eşlik edecek zengin bir kuruyemiş deneyimi sunmayı hedefler.",
    usageSuggestion: "Misafir ikramında veya özel gün sofralarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  menengic: {
    description:
      "Menengiç, Antep fıstığının yabani akrabası olan bir ağacın kavrulmuş meyvesidir ve karakteristik, hafif reçinemsi bir aromasıyla bilinir. Küçük taneli yapısıyla klasik kuruyemişlerden farklılaşan menengiç, geleneksel olarak hem çerez hem de menengiç kahvesi yapımında kullanılır. Güneydoğu Anadolu mutfağında köklü bir geçmişe sahip olan bu ürün, kavrulduktan sonra doğrudan atıştırmalık olarak tüketilebileceği gibi öğütülerek kahve hazırlığında da değerlendirilebilir. Farklı ve alışılmadık bir kuruyemiş deneyimi arayan tüketiciler için ilgi çekici bir seçenek olan menengiç, geleneksel lezzetleri keşfetmek isteyenlere de hitap eder. Kuruyemiş karışımlarına eklendiğinde farklı bir aroma katkısı sağlayan menengiç, OSSA Kuruyemiş'te özenle kavrulmuş hâliyle sunularak Anadolu'nun özgün lezzetlerinden birini sofralara taşır.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "mix-cerez": {
    description:
      "Mix Çerez, farklı kuruyemiş türlerinin dengeli bir oranda bir araya getirildiği, günlük tüketime uygun pratik bir çerez karışımıdır. Çeşitlilik arayan ancak her kuruyemiş türünü ayrı ayrı satın almak istemeyen tüketiciler için hazırlanan bu ürün, tek bir ambalajda birden fazla tat ve doku deneyimi sunar. Ofis molalarında, yolculuklarda ve ev ortamında pratik bir atıştırmalık seçeneği olan mix çerez, sohbet sofralarında da kolayca paylaşılabilir. Farklı kuruyemişlerin bir arada sunulması, hem lezzet çeşitliliği hem de görsel zenginlik sağlar. İçeriğindeki ürün çeşitliliğinin ambalaj etiketinden kontrol edilmesi, alerjik hassasiyeti olan tüketiciler için önemlidir. OSSA Kuruyemiş'te özenle hazırlanan mix çerez, günlük atıştırmalık ihtiyacına pratik ve çeşitli bir çözüm sunmayı amaçlar.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "ozbek-uzumu": {
    description:
      "Özbek üzümü, açık renkli ve iri taneli bir kuru üzüm çeşididir; standart kuru üzüme kıyasla daha büyük tane yapısı ve daha açık rengiyle dikkat çeker. Yoğun tatlı aromasıyla bilinen bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltılık karışımlarda, müsli ve granolada da tercih edilir. İri taneleri sayesinde çiğnendiğinde daha belirgin bir doku hissi veren özbek üzümü, hamur işi ve kek tariflerinde de kullanılabilir. Kuru meyve çeşitliliği arayan ve farklı üzüm türlerini denemek isteyen tüketiciler için ilgi çekici bir seçenektir. Kahvaltı sofralarında peynir ve kuruyemişlerle birlikte sunulduğunda tatlı-tuzlu bir denge oluşturabilir. OSSA Kuruyemiş'te özenle seçilen özbek üzümü, kuru meyve tercihlerinde çeşitlilik arayan tüketicilere sunulur.",
    ingredients: "Kuru üzüm (%100).",
    usageSuggestion: "Kahvaltıda veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 299,
      protein: 3.3,
      fat: 0.25,
      carbohydrate: 79.3,
      sugars: 65.2,
      fiber: 4.5,
      salt: 0.065,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168165/nutrients",
      sourceProduct: "Raisins, dark, seedless (yaklaşık referans — çeşit farkı olabilir)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "pastalik-fistik": {
    description:
      "Pastalık fıstık, ince kıyılmış veya küçük parçalar hâlinde sunulan Antep fıstığıdır ve öncelikle pasta, kurabiye ve tatlı süslemelerinde kullanılmak üzere hazırlanmıştır. Kıyılmış yapısı sayesinde hamur işlerine kolayca karıştırılabilen veya üst süsleme olarak serpiştirilebilen bu ürün, mutfakta pratik bir malzeme olma özelliği taşır. Baklava, künefe, dondurma ve çeşitli tatlı tariflerinde sıkça tercih edilen pastalık fıstık, görsel sunuma da katkı sağlar. Bütün fıstığa kıyasla daha ekonomik bir seçenek olabilen bu ürün, evde tatlı yapımını sevenler için mutfak dolabında bulundurulması pratik bir malzemedir. Doğrudan atıştırmalık olarak da tüketilebilen pastalık fıstık, tatlı yapımı dışında salata ve yoğurt üzerine serpiştirilerek de kullanılabilir. OSSA Kuruyemiş'te özenle hazırlanan bu ürün, mutfakta çok yönlü kullanım arayanlara sunulur.",
    ingredients: "Antep fıstığı (kırılmış) (%100).",
    usageSuggestion: "Tatlı, pasta ve kurabiye süslemesinde kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "patlatmalik-misir": {
    description:
      "Patlatmalık mısır, patlamamış mısır taneleridir ve evde patlatılarak hazırlanan mısır patlağının hammaddesidir. Doğal ve katkısız bir atıştırmalık hazırlama imkânı sunan bu ürün, tuz, şeker veya yağ eklenmeden de tüketilebilecek şekilde evde kişiselleştirilebilir. Film gecelerinin, aile buluşmalarının ve arkadaş sohbetlerinin klasik eşlikçisi olan patlatmalık mısır, evde hazır atıştırmalık paketlerine göre daha ekonomik ve esnek bir alternatif sunar. Tencerede veya patlatma makinesinde kolayca hazırlanabilen bu ürün, hazırlama sürecinin kendisi de eğlenceli bir aktiviteye dönüşebilir. Tuzlu, tatlı veya baharatlı çeşitler hazırlamak isteyenler için temel malzeme olan patlatmalık mısır, mutfakta kendi tarifini oluşturmak isteyen tüketiciler için idealdir. OSSA Kuruyemiş'te özenle seçilen patlatmalık mısır, ev yapımı atıştırmalık keyfini arayanlara sunulur.",
    ingredients: "Mısır (patlatmalık) (%100).",
    usageSuggestion: "Evde patlatılarak atıştırmalık hazırlamak için kullanılabilir.",
    storageConditions: STORAGE_NUTS,
    nutrition: {
      energyKcal: 375,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Corn, sweet, yellow (yaklaşık referans, patlamamış mısır tanesi için genel tahıl değeri)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "LOW",
    },
  },
  "salamura-kabak": {
    description:
      "Salamura kabak çekirdeği, tuzlu su (salamura) ile işlenerek hazırlanan bir kabak çekirdeği çeşididir. Bu işleme yöntemi, çekirdeklerin karakteristik tuzlu tadını ve nem oranını klasik kavrulmuş çekirdeklere kıyasla farklılaştırır. Karakteristik tuzlu tadıyla tek başına atıştırmalık olarak tüketilen salamura kabak, çıtlatma sürecinin keyifli bulunduğu geleneksel çerez kültürünün bir parçasıdır. Sohbet sofralarında, sinema ve maç izlerken paylaşılan bu ürün, diğer çekirdek çeşitleriyle bir arada karışık çerez tabaklarında da sunulabilir. Tuz oranına dikkat eden tüketicilerin porsiyon miktarını göz önünde bulundurması önerilir. OSSA Kuruyemiş'te geleneksel salamura yöntemiyle hazırlanan bu ürün, klasik kavrulmuş çekirdekten farklı bir tat deneyimi arayan, tuzlu çerezleri seven tüketicilere sunulur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "sari-leblebi": {
    description:
      "Sarı leblebi, kavrulmuş nohuttan elde edilen klasik bir Türk çerezidir ve adını karakteristik sarı-altın rengiden alır. Çıtır dokusu ve sade, hafif tuzlu tadıyla en çok tercih edilen leblebi çeşitlerinden biri olan bu ürün, Türk çerez kültüründe uzun yıllardır yerini korumaktadır. Tek başına atıştırmalık olarak tüketilebileceği gibi, karışık çerez tabaklarında diğer leblebi ve kuruyemiş çeşitleriyle bir arada da sunulabilir. Sinema, sohbet ortamları ve yolculuklarda pratik bir atıştırmalık seçeneği olan sarı leblebi, küçük porsiyonlar hâlinde paylaşıma da uygundur. Nohudun doğal besin değerini kavrulmuş hâliyle sunan bu ürün, geleneksel çerez lezzetlerini arayan tüketiciler için klasik bir tercihtir. OSSA Kuruyemiş'te uygun kavurma sürecinden geçirilerek hazırlanan sarı leblebi, günlük atıştırmalık ihtiyacına sade bir çözüm sunar.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "sekerli-leblebi": {
    description:
      "Şekerli leblebi, kavrulmuş nohudun ince bir şeker kaplamayla bir araya geldiği tatlı bir çerezdir. Klasik leblebinin çıtır dokusu, şeker kaplamanın kattığı tatlılıkla birleşerek farklı bir atıştırmalık deneyimi sunar. Tatlı çerezleri sevenler için hazırlanan bu ürün, çay ve kahve yanında ikram edilmeye uygun bir seçenektir. Misafir ağırlamada, özel gün sofralarında ve çocuklar için hazırlanan atıştırmalık tabaklarında sıkça tercih edilen şekerli leblebi, klasik leblebinin tatlı yorumunu arayanlara hitap eder. Şeker içeriği nedeniyle tüketim miktarına dikkat edilmesi önerilen bu ürün, geleneksel leblebi lezzetine yeni bir boyut katmak isteyen tüketiciler için ilgi çekicidir. OSSA Kuruyemiş'te özenle hazırlanan şekerli leblebi, tatlı ve çıtır bir atıştırmalık arayanlara sunulur.",
    usageSuggestion: "İkramlık olarak veya çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "siirt-fistigi": {
    description:
      "Siirt Fıstığı, Siirt yöresiyle özdeşleşmiş bir Antep fıstığı çeşididir ve karakteristik aroması ile dolgun tanesiyle bilinir. Güneydoğu Anadolu'nun fıstık yetiştiriciliğinde önemli bir yere sahip olan bu bölgesel çeşit, klasik fıstık lezzetini farklı bir tat nüansıyla sunar. Tek başına atıştırmalık olarak tüketilen Siirt Fıstığı, kuruyemiş karışımlarına eklendiğinde de farklı bir tat katkısı sağlar. Bölgesel fıstık çeşitlerini merak eden ve karşılaştırmalı bir tat deneyimi arayan tüketiciler için ilgi çekici bir seçenektir. Misafir ikramlarında ve özel sofralarda da tercih edilen bu ürün, geleneksel Türk kuruyemiş kültürünün zengin çeşitliliğini yansıtır. OSSA Kuruyemiş'te tane büyüklüğü ve görünüm gözetilerek ayıklanan Siirt Fıstığı, fıstık severler için keşfedilmeye değer bir alternatif sunar.",
    ingredients: "Antep fıstığı (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    nutrition: {
      energyKcal: 560,
      protein: 20.2,
      fat: 45.3,
      saturatedFat: 5.9,
      carbohydrate: 27.2,
      sugars: 7.7,
      fiber: 10.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170184/nutrients",
      sourceProduct: "Nuts, pistachio nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "siyah-uzum": {
    description:
      "Siyah üzüm, koyu renkli taneleriyle bilinen bir kuru üzüm çeşididir ve yoğun, derin bir tat profiline sahiptir. Standart kuru üzüme kıyasla daha koyu renkli kabuğu ve daha yoğun aroması ile dikkat çeken bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltılık karışımlarda da tercih edilir. Müsli ve granolaya eklenen siyah üzüm, hamur işi ve kek tariflerinde de kullanılabilir. Yoğun tatlılığı sayesinde küçük porsiyonlarda bile belirgin bir lezzet katkısı sağlayan bu ürün, kuru meyve çeşitliliği arayan tüketiciler için tercih edilir. Peynir tabaklarıyla birlikte sunulduğunda tatlı-tuzlu bir denge oluşturabilen siyah üzüm, kahvaltı sofralarında da yer bulur. OSSA Kuruyemiş'te özenle seçilen siyah üzüm, kuru meyve tercihlerinde farklı bir seçenek arayanlara sunulur.",
    ingredients: "Kuru üzüm (%100).",
    usageSuggestion: "Kahvaltıda veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 299,
      protein: 3.3,
      fat: 0.25,
      carbohydrate: 79.3,
      sugars: 65.2,
      fiber: 4.5,
      salt: 0.065,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168165/nutrients",
      sourceProduct: "Raisins, dark, seedless",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "soslu-fistik": {
    description:
      "Soslu fıstık, Antep fıstığının özel bir sos ile kaplanarak hazırlandığı, çıtır ve lezzetli bir çerez çeşididir. Klasik fıstığın karakteristik aromasına sosun kattığı ekstra tat katmanı, farklı bir atıştırmalık deneyimi arayanlar için hazırlanmıştır. Çıtır dış kaplaması ve içindeki fıstığın dokusuyla iki farklı doku hissi sunan bu ürün, tek başına tüketilebileceği gibi karışık çerez tabaklarında da yer bulabilir. Klasik fıstığa göre daha baharatlı veya tatlı bir tat profiline sahip olabilen soslu fıstık, farklı lezzet arayışında olan tüketiciler için ilgi çekici bir seçenektir. Sosun tam içeriği ürün ambalajından kontrol edilmelidir. OSSA Kuruyemiş'te özenle hazırlanan soslu fıstık, klasik fıstık deneyimine yeni bir tat boyutu katmak isteyenlere sunulur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
  },
  "soslu-misir": {
    description:
      "Soslu mısır, mısır tanelerinin özel bir sos ile kaplanarak hazırlandığı, çıtır dokulu bir atıştırmalıktır. Karakteristik lezzeti ve çıtır yapısıyla klasik mısır çerezlerinden farklılaşan bu ürün, tek başına veya karışık çerez tabaklarında tüketilebilir. Sinema, maç izlerken ve sohbet ortamlarında paylaşılan pratik bir atıştırmalık olan soslu mısır, klasik patlamış mısırdan farklı bir tat ve doku deneyimi sunar. Baharatlı veya tatlı bir sos profiline sahip olabilen bu ürün, farklı lezzet arayışında olan tüketiciler için tercih edilir. Sosun tam içeriği ve baharat oranı ürün ambalajından kontrol edilmelidir. OSSA Kuruyemiş'te özenle hazırlanan soslu mısır, klasik çerez alışkanlıklarına yeni bir tat katmak isteyen tüketicilere sunulan pratik bir seçenektir.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "spesiyal-karisik": {
    description:
      "Spesiyal Karışık, özenle seçilmiş kuruyemiş çeşitlerinin bir araya getirildiği, kendine özgü bir oranla hazırlanan premium bir çerez karışımıdır. Standart karışık çerezlerden farklı olarak daha özel bir seçki sunmayı amaçlayan bu ürün, misafir ağırlamada ve özel gün sofralarında tercih edilir. Farklı kuruyemiş türlerinin dengeli bir oranda bir araya getirilmesiyle hazırlanan spesiyal karışık, tek bir kutuda çeşitli tat ve doku deneyimi sunar. Hediyelik paketlerde de değerlendirilebilen bu ürün, kuruyemiş seçiminde çeşitlilik ve kalite arayan tüketiciler için hazırlanmıştır. İçeriğindeki ürün çeşitliliğinin ambalaj etiketinden kontrol edilmesi, alerjik hassasiyeti olanlar için önemlidir. OSSA Kuruyemiş'te özenle bir araya getirilen spesiyal karışık, özel anlarınıza eşlik edecek zengin bir kuruyemiş deneyimi sunmayı hedefler.",
    usageSuggestion: "Misafir ikramında veya özel gün sofralarında değerlendirilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "tuzsuz-sari-leblebi": {
    description:
      "Tuzsuz sarı leblebi, kavrulmuş ama tuz eklenmemiş hâliyle nohudun doğal tadını koruyan bir leblebi çeşididir. Tuz tüketimine dikkat eden veya sade lezzetleri tercih eden tüketiciler için hazırlanan bu ürün, klasik sarı leblebinin çıtır dokusunu korurken tuzsuz bir alternatif sunar. Tek başına atıştırmalık olarak tüketilebileceği gibi, karışık çerez tabaklarında diğer leblebi çeşitleriyle bir arada da sunulabilir. Nohudun doğal besin değerini işlenmemiş bir tat profiliyle sunan bu ürün, günlük tuz alımını sınırlamak isteyenler için pratik bir seçenektir. Çocuk beslenmesinde de tercih edilebilen tuzsuz sarı leblebi, sofralarda sade bir atıştırmalık arayanlara hitap eder. OSSA Kuruyemiş'te özenle kavrulan bu ürün, klasik leblebi lezzetini tuzsuz bir formda deneyimlemek isteyenlere sunulur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "yagli-misir": {
    description:
      "Yağlı mısır, mısır tanelerinin kızartılarak hazırlandığı, çıtır dokulu bir atıştırmalıktır. Kızartma işlemi, mısır tanelerine karakteristik bir lezzet ve gevrek bir doku kazandırır. Tek başına atıştırmalık olarak tüketilebileceği gibi, karışık çerez tabaklarında diğer mısır bazlı çerezlerle bir arada da sunulabilir. Sinema, maç izlerken ve sohbet ortamlarında paylaşılan pratik bir atıştırmalık olan yağlı mısır, klasik patlamış mısırdan farklı bir hazırlama yöntemiyle üretilir. Genellikle tuzlu hâliyle tüketilen bu ürün, mısırın doğal tadını kızartma işlemiyle zenginleştirir. Çıtır ve doyurucu yapısı sayesinde uzun süreli atıştırmalık oturumları için tercih edilen yağlı mısır, klasik çerez alışkanlıklarına farklı bir seçenek katmak isteyen tüketicilere OSSA Kuruyemiş güvencesiyle sunulur.",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
  },
  "zar-kabuklu-kaju": {
    description:
      "Zar kabuklu kaju, ince zarlı, özenle ayıklanmış bir kaju çeşididir ve standart kajuya kıyasla daha ince bir iç zara sahip olmasıyla bilinir. Yumuşak dokusu ve hafif tatlımsı, kremamsı aromasıyla klasik kaju deneyimini sunan bu ürün, tek başına atıştırmalık olarak tercih edilir. İnce zarlı yapısı, tane bütünlüğünün korunmasına ve daha temiz bir görünüme katkı sağlar. Karışık çerez tabaklarında diğer kuruyemişlerle bir arada sunulabilen zar kabuklu kaju, tatlı tariflerinde ve kek süslemelerinde de kullanılabilir. Yumuşak dokusu sayesinde çiğnemesi kolay olan bu ürün, hem çocuklar hem yetişkinler için pratik bir atıştırmalık seçeneğidir. OSSA Kuruyemiş'te özenle ayıklanan zar kabuklu kaju, kaliteli tane seçimi arayan kuruyemiş severlere sunulur.",
    ingredients: "Kaju (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_NUTS,
    allergenInfo: "Sert kabuklu yemiş (kaju) içerir.",
    nutrition: {
      energyKcal: 553,
      protein: 18.22,
      fat: 43.85,
      saturatedFat: 7.78,
      carbohydrate: 30.19,
      sugars: 5.91,
      fiber: 3.3,
      salt: 0.03,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/170162/nutrients",
      sourceProduct: "Nuts, cashew nuts, raw",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },

  // ==================== BAHARAT ====================
  "cemen-tozu": {
    description:
      "Çemen tozu, çemen otu tohumlarının öğütülmesiyle elde edilen, keskin ve karakteristik bir aromaya sahip geleneksel bir baharattır. Türk mutfağında en çok pastırma çemeni yapımında kullanılan bu baharat, sarımsak, kırmızı biber ve diğer baharatlarla karıştırılarak pastırmanın karakteristik kaplamasını oluşturur. Yoğun ve belirgin kokusuyla dikkat çeken çemen tozu, küçük miktarlarda kullanılsa bile yemeğe güçlü bir aroma katma özelliğine sahiptir. Geleneksel Türk şarküteri ürünlerinin vazgeçilmez bir bileşeni olan bu baharat, ev yapımı pastırma hazırlığı yapmak isteyenler için temel bir malzemedir. Bazı yöresel yemek tariflerinde de kullanılan çemen, kendine has tadı nedeniyle ilk denemede alışılması gereken bir baharat olarak bilinir. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan çemen tozu, geleneksel lezzetleri mutfağında yaşatmak isteyen tüketicilere hitap eder.",
    ingredients: "Çemen tozu (%100).",
    usageSuggestion: "Pastırma çemeni ve et yemeklerinde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 323,
      protein: 23.0,
      fat: 6.41,
      carbohydrate: 58.35,
      fiber: 24.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/",
      sourceProduct: "Spices, fenugreek seed",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  corekotu: {
    description:
      "Çörekotu, küçük siyah taneleriyle bilinen, keskin ve hafif acımsı bir aromaya sahip bir tohum baharatıdır. Türk mutfağında ekmek ve çörek üzerine serpilerek geleneksel olarak kullanılan bu baharat, pişirme sırasında yaydığı karakteristik kokusuyla tanınır. Simit, poğaça ve çeşitli hamur işlerinin üzerine serpiştirilerek görsel ve tat açısından zenginlik katan çörekotu, ekmek yapımında hamura da eklenebilir. Küçük tane boyutu sayesinde farklı tariflerle kolayca bütünleşen bu baharat, geleneksel fırın ürünlerinin karakteristik bir parçası hâline gelmiştir. Bazı yöresel yemeklerde tohum hâliyle veya öğütülerek de kullanılabilen çörekotu, kendine özgü keskin tadı nedeniyle sınırlı miktarlarda tercih edilir. OSSA Kuruyemiş'te temiz ve elenmiş hâliyle sunulan çörekotu, ev yapımı fırın ürünlerine geleneksel bir dokunuş katmak isteyenlere sunulur.",
    ingredients: "Çörekotu (%100).",
    usageSuggestion: "Ekmek ve çörek üzerine serpilerek kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Nigella sativa (çörekotu) — akademik kaynaklar arasında belirgin varyasyon nedeniyle sayısal değer verilmedi",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "LOW",
    },
  },
  "hindistan-cevizi": {
    description:
      "Hindistan cevizi, tropikal bir meyve olan hindistan cevizinin kurutulmuş ve rendelenmiş iç kısmıdır; hafif tatlımsı aroması ve lifli dokusuyla bilinir. Pasta, kek ve çeşitli tatlı tariflerinde sıkça kullanılan bu ürün, hem hamur karışımına eklenerek hem de üst süsleme olarak değerlendirilebilir. Rendelenmiş yapısı sayesinde kolayca dağılan hindistan cevizi, kurabiye ve şekerleme tariflerinde de tercih edilir. Tropikal mutfakların vazgeçilmez bir malzemesi olan bu ürün, smoothie ve müsli karışımlarına eklendiğinde farklı bir tat ve doku katkısı sağlar. Kahvaltı sofralarında yoğurt üzerine serpiştirilerek de tüketilebilen hindistan cevizi, ev yapımı tatlı ve pasta tariflerinde vazgeçilmez bir malzeme olarak mutfak dolaplarında yerini alır. OSSA Kuruyemiş'te kurutulmuş ve rendelenmiş hâliyle sunulan bu ürün, tatlı tariflerine tropikal bir lezzet katmak isteyenlere hitap eder.",
    ingredients: "Hindistan cevizi (rendelenmiş, kurutulmuş) (%100).",
    usageSuggestion: "Pasta, kek ve tatlı tariflerinde kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 187,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Nuts, coconut meat, dried (desiccated), not sweetened",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  isot: {
    description:
      "İsot (Urfa biberi), güneşte kısmen kurutulup ardından gölgede fermente edilerek hazırlanan, koyu renkli ve tütsü aromalı bir pul biber çeşididir. Şanlıurfa mutfağının karakteristik baharatlarından biri olan isot, klasik pul biberden farklı olarak fermantasyon sürecinden geçtiği için daha derin ve dumanımsı bir tat profiline sahiptir. Kebap, köfte ve çiğ köfte gibi Güneydoğu Anadolu mutfağının simge yemeklerinde vazgeçilmez bir baharat olan isot, yemeklere hem renk hem de karakteristik bir aroma katar. Mercimek çorbası ve çeşitli et yemeklerinde de tercih edilen bu baharat, geleneksel Urfa mutfağını evde deneyimlemek isteyenler için önemli bir malzemedir. Orta düzeyde acılığa sahip olan isot, klasik pul bibere kıyasla daha yumuşak bir acılık sunar. OSSA Kuruyemiş'te özenle hazırlanan isot, otantik Güneydoğu Anadolu lezzetlerini arayan mutfak severlere sunulur.",
    usageSuggestion: "Kebap, köfte ve çiğ köfte gibi yemeklerde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
  },
  karabiber: {
    description:
      "Karabiber, dünya mutfaklarının en yaygın kullanılan baharatlarından biri olarak keskin ve hafif acı aromasıyla neredeyse her yemekte tatlandırıcı olarak kullanılır. Öğütülmüş hâliyle sunulan bu baharat, et yemeklerinden çorbalara, salatalardan soslara kadar geniş bir kullanım alanına sahiptir. Tuzla birlikte mutfaktaki en temel iki baharattan biri olan karabiber, yemeklere derinlik katan keskin bir tat profili sunar. Yemek pişirme sürecinin neredeyse her aşamasında kullanılabilen bu baharat, hem pişirme sırasında hem de servis öncesinde son dokunuş olarak eklenebilir. Kahve ve bazı özel tariflerde de az miktarda kullanılan karabiber, mutfak dolabında bulunması gereken temel baharatlardan biridir. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan karabiber, günlük yemek hazırlığının vazgeçilmez bir parçası olarak sofralara eşlik eder.",
    ingredients: "Karabiber (%100).",
    usageSuggestion: "Yemeklerde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 251,
      protein: 10.4,
      carbohydrate: 64.0,
      fiber: 25,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, pepper, black",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  karanfil: {
    description:
      "Karanfil, kurutulmuş çiçek tomurcuklarından elde edilen, yoğun ve sıcak bir aromaya sahip bir baharattır. Hem tatlı hem tuzlu tariflerde kullanılan bu çok yönlü baharat, özellikle sıcak içeceklerde (tarçınlı çay, sahlep gibi) ve kış aylarının klasik lezzetlerinde sıkça yer alır. Et yemeklerinde, pilavlarda ve bazı sos tariflerinde de tercih edilen karanfil, güçlü aroması nedeniyle küçük miktarlarda kullanılır. Bütün hâliyle yemeklere eklenip pişirme sonunda çıkarılabileceği gibi öğütülmüş hâliyle de kullanılabilir. Geleneksel Türk mutfağında turşu ve konserve yapımında da kullanılan karanfil, koruyucu özelliğiyle de bilinir. Kış aylarında sıcak içeceklere eklenen karanfil, sıcak ve baharatlı bir aroma sunarak soğuk günlerde tercih edilen bir malzemedir. OSSA Kuruyemiş'te bütün tane hâliyle sunulan karanfil, mutfağınıza sıcak ve derin bir aroma katmak isteyenlere hitap eder.",
    ingredients: "Karanfil (%100).",
    usageSuggestion: "Tatlı, sıcak içecek ve et yemeklerinde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 274,
      protein: 6.0,
      fat: 13.0,
      carbohydrate: 65.5,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, cloves, ground",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  kekik: {
    description:
      "Kekik, kurutulmuş yaprakları baharat olarak kullanılan aromatik bir bitkidir ve belirgin, hafif keskin kokusuyla Türk ve Akdeniz mutfaklarında yaygın olarak kullanılır. Et yemeklerinde, salatalarda, zeytinyağlı yemeklerde ve pizza gibi İtalyan mutfağından esinlenen tariflerde sıkça tercih edilen kekik, yemeklere ferahlatıcı bir aroma katar. Peynir tabaklarıyla birlikte sunulduğunda da lezzet dengesi oluşturan bu baharat, zeytinyağı ile karıştırılarak ekmek banma sosu hazırlamak için de kullanılabilir. Izgara etlerin üzerine serpiştirildiğinde karakteristik bir koku ve tat katan kekik, geleneksel Ege mutfağının da vazgeçilmez bir parçasıdır. Bazı bitki çayı karışımlarında da yer alan kekik, hem tatlı hem tuzlu tariflerde çok yönlü bir kullanım alanına sahiptir. OSSA Kuruyemiş'te kurutulmuş hâliyle sunulan kekik, Akdeniz mutfağının aromatik lezzetlerini evinize taşımak isteyenlere sunulur.",
    ingredients: "Kekik (%100).",
    usageSuggestion: "Yemeklerde ve salatalarda baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 276,
      protein: 9.11,
      carbohydrate: 72.4,
      fiber: 37,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, thyme, dried",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  kimyon: {
    description:
      "Kimyon, karakteristik sıcak ve hafif acımsı aromasıyla tanınan, Türk mutfağının temel baharatlarından biridir. Özellikle kıyma ve köfte tariflerinde sıkça kullanılan kimyon, etin karakteristik kokusunu dengeleyerek yemeğe derinlik katar. Çorbalarda, nohut ve mercimek gibi baklagil yemeklerinde de tercih edilen bu baharat, sindirime yardımcı olduğuna inanılan geleneksel baharatlar arasında sayılır. Kebap ve köfte harçlarının vazgeçilmez bir bileşeni olan kimyon, Ortadoğu ve Akdeniz mutfaklarında da geniş bir kullanım alanına sahiptir. Toz hâlde kullanılabileceği gibi bütün tane hâlinde kavrularak da yemeklere eklenebilir; kavrulma işlemi aromasını daha da belirginleştirir. Geleneksel Türk köftesinin karakteristik tadının arkasındaki temel baharatlardan biri olan kimyon, mutfak dolabında bulunması gereken vazgeçilmez baharatlar arasındadır. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulur.",
    ingredients: "Kimyon (%100).",
    usageSuggestion: "Köfte, kıyma yemekleri ve çorbalarda baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 375,
      fiber: 10.5,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, cumin seed",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  kori: {
    description:
      "Köri, çeşitli baharatların bir araya getirilmesiyle hazırlanan, sarı renkli ve karakteristik aromaya sahip bir baharat karışımıdır. Uzak Doğu ve Hint mutfağından esinlenen yemeklerde yaygın olarak kullanılan köri, zerdeçal, kimyon, kişniş ve çeşitli diğer baharatların bir araya gelmesiyle oluşan zengin bir tat profiline sahiptir. Tavuk, sebze ve pirinç yemeklerinde sıklıkla tercih edilen bu baharat karışımı, yemeklere hem canlı bir renk hem de belirgin bir aroma katar. Hindistan mutfağının klasik lezzetlerini evde denemek isteyenler için temel bir malzeme olan köri, sote ve güveç tariflerinde de kullanılabilir. Farklı marka ve tariflere göre içerik oranları değişebilen köri karışımları, hafif acılıdan yoğun baharatlıya kadar çeşitlilik gösterebilir. OSSA Kuruyemiş'te sunulan köri, Uzak Doğu mutfağının egzotik lezzetlerini mutfağınıza taşımak isteyenlere hitap eder.",
    usageSuggestion: "Sebze ve et yemeklerinde baharat karışımı olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
  },
  "limon-tuzu": {
    description:
      "Limon tuzu, gıdalarda ekşilik verici olarak kullanılan sitrik asitten oluşan bir katkı maddesidir ve yemeklere doğal limon ekşiliğine benzer bir tat katmak için tercih edilir. Beyaz kristal görünümündeki bu ürün, özellikle limon bulunmadığında veya pratik bir çözüm arandığında yemek ve salatalara ekşilik katmak için kullanılır. Turşu, konserve ve reçel yapımında koruyucu ve ekşilik verici olarak da tercih edilen limon tuzu, küçük miktarlarda kullanılması gereken güçlü bir katkı maddesidir. Dolma ve sarma gibi zeytinyağlı yemeklerde de sıkça kullanılan bu ürün, yemeğin tazelik hissini artırır. Mutfakta pratik bir ekşilik kaynağı olarak bulundurulması önerilen limon tuzu, taze limon bulunmayan durumlarda hızlı bir alternatif sunar. OSSA Kuruyemiş'te sunulan limon tuzu, mutfağınızda her zaman hazır bulundurabileceğiniz pratik bir malzemedir.",
    usageSuggestion: "Yemek ve salatalara ekşilik katmak için az miktarda kullanılabilir.",
    storageConditions: STORAGE_SPICE,
  },
  "maras-tarhanasi": {
    description:
      "Maraş tarhanası, yoğurt, un ve çeşitli sebzelerin fermente edilip kurutulmasıyla hazırlanan geleneksel bir çorbalık karışımdır. Kahramanmaraş yöresinin karakteristik lezzetlerinden biri olan bu ürün, fermantasyon süreci sayesinde derin ve ekşimsi bir aroma kazanır. Kış aylarının vazgeçilmez çorbalarından biri olan tarhana çorbası, bu karışımın su ile pişirilmesiyle hazırlanır ve genellikle tereyağı, nane ve pul biberle tamamlanır. Geleneksel yöntemle hazırlanan Maraş tarhanası, ev yapımı tarhananın otantik tadını arayan tüketiciler için pratik bir alternatif sunar. Soğuk kış günlerinde sıcak ve doyurucu bir çorba arayanlar için ideal olan bu ürün, Anadolu mutfağının köklü geleneklerinden birini sofralara taşır. OSSA Kuruyemiş'te sunulan Maraş tarhanası, geleneksel Türk çorba kültürünü evinizde yaşatmak isteyenlere hitap eder.",
    usageSuggestion: "Çorba yapımında kullanılabilir.",
    storageConditions: STORAGE_SPICE,
  },
  nane: {
    description:
      "Kuru nane, taze naneın kurutulmasıyla elde edilen, ferahlatıcı ve keskin aromasıyla bilinen bir baharattır. Yemeklerde, çorbalarda ve bazı içeceklerde kullanılan kuru nane, özellikle yoğurt çorbası ve nane-yoğurt soslarının karakteristik bir bileşenidir. Etli yemeklerde, dolma ve sarmalarda ferahlatıcı bir dokunuş katan bu baharat, ayran ve bazı geleneksel içeceklere de eklenebilir. Zeytinyağlı yemeklerde ve salatalarda da tercih edilen kuru nane, taze naneın bulunmadığı dönemlerde pratik bir alternatif sunar. Bazı bitki çayı karışımlarında da yer alan nane, sindirime yardımcı olduğuna inanılan geleneksel bitkiler arasında sayılır. Sıcak yaz aylarında ferahlatıcı bir tat arayanlar için ideal olan bu baharat, mutfak dolabında bulundurulması önerilen çok yönlü bir üründür. OSSA Kuruyemiş'te kurutulmuş hâliyle sunulan nane, yemeklerinize ferah bir aroma katmak isteyenlere sunulur.",
    ingredients: "Kurutulmuş nane (%100).",
    usageSuggestion: "Çorba, yoğurt ve yemeklerde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 285,
      protein: 19.9,
      fat: 6.0,
      carbohydrate: 52.0,
      fiber: 29.8,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spearmint, dried",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "pul-biber": {
    description:
      "Pul biber, kurutulmuş kırmızı biberin öğütülmesiyle elde edilen, orta-acı seviyesinde bir baharattır ve Türk mutfağının en sık kullanılan baharatlarından biridir. Çorbalarda, yemeklerde ve mezelerde sıkça tercih edilen pul biber, yemeklere hem renk hem de karakteristik bir acılık katar. Zeytinyağı ile karıştırılarak ekmek banma sosu hazırlamak için de kullanılan bu baharat, ızgara etlerin ve köftelerin üzerine serpiştirildiğinde de tercih edilir. Geleneksel Türk sofralarının vazgeçilmez bir bileşeni olan pul biber, tuz ve karabiber ile birlikte en temel üç baharattan biri sayılır. Acı seviyesi kullanılan biber çeşidine göre değişebilen pul biber, hafif acıdan belirgin acıya kadar farklı yoğunluklarda tercih edilebilir. OSSA Kuruyemiş'te sunulan pul biber, günlük yemek hazırlığının vazgeçilmez bir parçası olarak sofralara eşlik eder.",
    usageSuggestion: "Yemeklerde, çorbalarda ve mezelerde baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 318,
      protein: 12.02,
      fat: 17.26,
      carbohydrate: 56.62,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, pepper, red or cayenne (yaklaşık referans — Türk pul biberi tuz/yağ içerebilir, OSSA reçetesiyle tam örtüşme teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "toz-biber": {
    description:
      "Toz biber, kurutulmuş kırmızı biberin ince öğütülmesiyle elde edilen bir baharattır ve yemeklere renk ve hafif bir tat katmak için kullanılır. Pul bibere kıyasla daha ince öğütülmüş yapısı sayesinde yemeklere daha homojen bir şekilde karışan toz biber, özellikle sos ve marine tariflerinde tercih edilir. Et yemeklerinde, pilavlarda ve çorbalarda kullanılan bu baharat, yemeğe canlı bir kırmızı renk katarak görsel açıdan da zenginlik sağlar. Macar mutfağından esinlenen tariflerde de sıkça kullanılan toz biber, paprika olarak bilinen baharat ailesiyle akrabadır. Marine soslarında ve baharatlı karışımlarda temel bileşen olarak yer alan bu ürün, mutfakta çok yönlü bir kullanım alanına sahiptir. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan toz biber, yemeklerinize renk ve lezzet katmak isteyenlere sunulur.",
    usageSuggestion: "Yemeklerde baharat ve renklendirici olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 282,
      fat: 12.9,
      saturatedFat: 2.14,
      carbohydrate: 54.0,
      protein: 14.1,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, paprika (yaklaşık referans)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  susam: {
    description:
      "Susam, küçük ve yağlı taneleriyle bilinen bir tohum baharatıdır ve ekmek, simit ve tahin helvası üretiminde geniş bir kullanım alanına sahiptir. Kavrulduğunda belirgin bir fındıksı aroma kazanan susam, simit ve çeşitli ekmek çeşitlerinin üzerine serpiştirilerek geleneksel Türk fırıncılığının vazgeçilmez bir parçası hâline gelmiştir. Öğütülerek tahin ve helva üretiminde temel hammadde olarak kullanılan susam, aynı zamanda salata ve yemeklerin üzerine serpiştirilerek de tüketilebilir. Uzak Doğu mutfaklarında susam yağı ve soslarda da yaygın olarak kullanılan bu tohum, çok yönlü bir mutfak malzemesidir. Kurabiye ve çörek tariflerinde hamura karıştırılarak veya üst kaplama olarak kullanılabilen susam, hem tatlı hem tuzlu tariflerde tercih edilir. OSSA Kuruyemiş'te temiz ve elenmiş hâliyle sunulan susam, geleneksel Türk mutfağının vazgeçilmez malzemelerinden birini sofralara taşır.",
    ingredients: "Susam (%100).",
    usageSuggestion: "Ekmek/simit üzerinde veya yemek ve tatlı tariflerinde kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    allergenInfo: "Susam içerir.",
    nutrition: {
      energyKcal: 573,
      protein: 17.7,
      fat: 49.7,
      carbohydrate: 23.4,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Seeds, sesame seeds, whole, dried",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "toz-kekik": {
    description:
      "Toz kekik, kurutulmuş kekiğin ince öğütülmesiyle elde edilen bir baharattır ve yemeklerde kolayca karışması için tercih edilir. Bütün yaprak kekiğe kıyasla daha homojen bir dağılım sağlayan toz kekik, özellikle marine soslarında, salata soslarında ve ekmek hamurlarında tercih edilir. Zeytinyağlı yemeklerde, ızgara etlerde ve pizza tariflerinde sıkça kullanılan bu baharat, Akdeniz mutfağının karakteristik aromasını yemeklere taşır. Peynirli tariflerde ve omlet gibi kahvaltılık yemeklerde de tercih edilen toz kekik, ferahlatıcı ve hafif keskin bir tat profili sunar. Ev yapımı baharat karışımlarında da temel bileşen olarak kullanılabilen bu ürün, mutfakta çok yönlü bir kullanım alanına sahiptir. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan toz kekik, yemeklerinize Akdeniz esintili bir aroma katmak isteyenlere sunulur.",
    ingredients: "Toz kekik (%100).",
    usageSuggestion: "Yemeklerde ve salatalarda baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 276,
      protein: 9.11,
      carbohydrate: 72.4,
      fiber: 37,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, thyme, dried",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "toz-tarcin": {
    description:
      "Toz tarçın, tarçın kabuğunun öğütülmesiyle elde edilen, tatlı ve sıcak aromasıyla bilinen bir baharattır. Tatlılarda, sütlü tariflerde ve sıcak içeceklerde sıkça kullanılan toz tarçın, özellikle sütlaç, tarçınlı çörek ve elmalı tatlıların karakteristik bir bileşenidir. Kahve ve sıcak süt üzerine serpiştirilerek de tüketilen bu baharat, kış aylarının sıcak ve rahatlatıcı içeceklerinde tercih edilir. Bazı et yemeklerinde ve pilav tariflerinde de az miktarda kullanılan toz tarçın, tatlı ve tuzlu tarifler arasında dengeleyici bir rol oynayabilir. Kahvaltı sofralarında bal ile karıştırılarak ekmek üzerine sürülen tarçın, sağlıklı beslenme rutinlerinde de tercih edilen bir baharattır. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan toz tarçın, tatlı tariflerinize sıcak ve karakteristik bir aroma katmak isteyenlere sunulur.",
    ingredients: "Toz tarçın (%100).",
    usageSuggestion: "Tatlı, sütlaç ve sıcak içeceklerde kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      energyKcal: 247,
      protein: 4,
      fat: 1.24,
      carbohydrate: 80.6,
      sugars: 2.2,
      fiber: 53.1,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, cinnamon, ground",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  "yayla-sumagi": {
    description:
      "Sumak, ekşimsi ve meyvemsi aromasıyla bilinen, kırmızı-bordo renkli bir baharattır. Türk ve Ortadoğu mutfaklarında salata ve kebap yanında sıkça kullanılan sumak, limon ekşiliğine benzer ama daha kompleks bir tat profili sunar. Soğan salatasının karakteristik bir bileşeni olan sumak, kebap ve köfte servislerinde de yaygın olarak tercih edilir. Zeytinyağlı yemeklerde ve mezelerde ekşilik katmak için kullanılan bu baharat, Ortadoğu mutfağının simge tatlarından biri olan za'atar baharat karışımının da temel bileşenlerinden biridir. Et ve tavuk marinatlarında da tercih edilen sumak, yemeklere hem renk hem de ferahlatıcı bir ekşilik katar. Yayla yöresiyle özdeşleşen bu ürün, geleneksel Anadolu mutfağının özgün lezzetlerinden birini sofralara taşır. OSSA Kuruyemiş'te sunulan sumak, otantik Ortadoğu ve Anadolu lezzetlerini arayanlara hitap eder.",
    ingredients: "Sumak (%100).",
    usageSuggestion: "Salata ve kebap yanında baharat olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
    nutrition: {
      sourceName: "Çeşitli üçüncü taraf kaynaklar (resmi USDA girişi bulunamadı)",
      sourceUrl: USDA_URL,
      sourceProduct: "Sumac — kaynaklar arasında belirgin fark tespit edildi (249 vs 281 kcal/100g), sayısal değer bu nedenle verilmedi",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "LOW",
    },
  },
  yedibahar: {
    description:
      "Yedibahar, köfte ve et yemeklerinde kullanılmak üzere hazırlanan, birden fazla baharatın bir araya getirildiği bir baharat karışımıdır. Geleneksel köfte tariflerinin karakteristik lezzetini oluşturmak amacıyla hazırlanan bu karışım, farklı baharatların dengeli bir oranda bir araya gelmesiyle zengin bir aroma profili sunar. Kıyma bazlı yemeklerde, köfte harçlarında ve bazı et tariflerinde tercih edilen yedibahar, tek tek baharat eklemek yerine pratik ve dengeli bir çözüm arayan ev aşçıları için hazırlanmıştır. İçeriğindeki baharat oranları ve tam bileşimi ürün ambalajından kontrol edilmelidir. Geleneksel Türk mutfağının köfte kültüründe önemli bir yere sahip olan bu tür karışımlar, farklı bölgelerde farklı reçetelerle hazırlanabilir. OSSA Kuruyemiş'te sunulan yedibahar, köfte ve et yemeklerinize pratik ve dengeli bir baharat çözümü arayanlara hitap eder.",
    usageSuggestion: "Köfte ve et yemeklerinde baharat karışımı olarak kullanılabilir.",
    storageConditions: STORAGE_SPICE,
  },

  // ==================== ÇAY & KAHVE ====================
  "biberiye-cayi": {
    description:
      "Biberiye çayı, kurutulmuş biberiye yapraklarından hazırlanan, keskin ve reçinemsi aromasıyla bilinen bir bitki çayıdır. Akdeniz mutfağının aromatik bitkilerinden biri olan biberiye, çay olarak demlendiğinde belirgin ve karakteristik bir koku yayar. Sıcak su ile demlenerek tüketilen bu bitki çayı, günün herhangi bir saatinde tercih edilebilecek ferahlatıcı bir içecek seçeneğidir. Yemek sonrası veya sabah kahvaltısında tüketilmesi yaygın olan biberiye çayı, klasik siyah çay ve yeşil çaya alternatif arayanlar için ilgi çekici bir seçenektir. Kendine has güçlü aroması nedeniyle ilk denemede alışılması gereken bir tat profiline sahip olan bu çay, bitki çayı koleksiyonunu genişletmek isteyenler için uygundur. OSSA Kuruyemiş'te kurutulmuş yaprak hâliyle sunulan biberiye çayı, doğal bitki çaylarını keşfetmek isteyen tüketicilere sunulur.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "cubuk-tarcin": {
    description:
      "Çubuk tarçın, tarçın ağacının kabuğunun kurutulup rulo hâline getirilmesiyle elde edilen, bütün formdaki bir baharattır. Toz tarçına kıyasla daha uzun süre aromasını koruyan çubuk tarçın, sıcak içeceklerde (özellikle sahlep, tarçınlı çay ve kahve) demleme sırasında doğrudan kullanılır. Tatlı tariflerinde, komposto ve reçel yapımında da tercih edilen bu ürün, pişirme sonunda kolayca çıkarılabilir olması nedeniyle pratik bir kullanım sunar. Kış aylarının sıcak ve baharatlı içeceklerinde vazgeçilmez bir malzeme olan çubuk tarçın, aynı zamanda dekoratif amaçla da kullanılabilir. Bütün form yapısı sayesinde toz tarçına göre daha uzun raf ömrüne sahip olan bu ürün, mutfak dolabında uzun süre saklanabilir. OSSA Kuruyemiş'te sunulan çubuk tarçın, sıcak içeceklerinize ve tatlılarınıza doğal ve yoğun bir aroma katmak isteyenlere hitap eder.",
    ingredients: "Tarçın (çubuk) (%100).",
    usageSuggestion: "Sıcak içecek ve tatlı tariflerinde kullanılabilir.",
    storageConditions: STORAGE_TEA,
    nutrition: {
      energyKcal: 247,
      protein: 4,
      fat: 1.24,
      carbohydrate: 80.6,
      sugars: 2.2,
      fiber: 53.1,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, cinnamon, ground (yaklaşık referans — bütün çubuk formu için)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "hibiskus-cayi": {
    description:
      "Hibiskus çayı, kurutulmuş hibiskus çiçeği taç yapraklarından (kaliks) hazırlanan, canlı kırmızı rengi ve ekşimsi aromasıyla bilinen bir bitki çayıdır. Sıcak veya soğuk su ile demlenerek tüketilebilen bu çay, özellikle yaz aylarında buzlu içecek olarak da tercih edilir. Karakteristik ekşimsi ve meyvemsi tat profili sayesinde klasik çaylardan farklı bir deneyim sunan hibiskus çayı, canlı kırmızı rengiyle de görsel olarak dikkat çeker. Meyve çaylarına alternatif arayan ve farklı bitki çaylarını denemek isteyen tüketiciler için ilgi çekici bir seçenektir. Misafir ağırlamada estetik sunumu ile de tercih edilebilen bu çay, soğuk demlenip limon ile karıştırılarak ferahlatıcı bir yaz içeceğine dönüştürülebilir. OSSA Kuruyemiş'te kurutulmuş çiçek hâliyle sunulan hibiskus çayı, bitki çayı koleksiyonunu zenginleştirmek isteyenlere sunulur.",
    usageSuggestion: "Sıcak veya soğuk su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  ihlamur: {
    description:
      "Ihlamur, ıhlamur ağacının kurutulmuş çiçeklerinden hazırlanan, hafif tatlımsı ve rahatlatıcı aromasıyla bilinen geleneksel bir bitki çayıdır. Özellikle kış aylarında sıcak içecek olarak tercih edilen ıhlamur, Türk kültüründe uzun yıllardır soğuk havalarda tüketilen köklü bir gelenektir. Sıcak su ile demlenerek hazırlanan bu bitki çayı, sade hâliyle tüketilebileceği gibi bal veya limon eklenerek de içilebilir. Akşam saatlerinde rahatlatıcı bir mola içeceği olarak tercih edilen ıhlamur, sıcak çiçek kokusuyla evin içine ferahlık katar. Misafir ağırlamada da sıkça sunulan bu çay, kış aylarının vazgeçilmez sıcak içeceklerinden biri olarak Türk ev kültüründe önemli bir yere sahiptir. OSSA Kuruyemiş'te kurutulmuş çiçek hâliyle sunulan ıhlamur, geleneksel ve rahatlatıcı bir çay deneyimi arayan tüketicilere sunulur.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "kis-cayi": {
    description:
      "Kış çayı, soğuk aylarda tercih edilen, çeşitli bitki ve meyve aromalarının bir araya getirildiği bir çay karışımıdır. Soğuk havalarda vücudu ısıtan ve rahatlatan bir içecek arayışına yönelik hazırlanan bu ürün, genellikle tarçın, karanfil, zencefil gibi sıcak baharat notaları içerir. Sıcak su ile demlenerek tüketilen kış çayı, akşam saatlerinde veya soğuk kış günlerinde sıcak bir mola arayanlar için tercih edilir. İçeriğindeki tam bileşim ve karışım oranları ürün ambalajından teyit edilmelidir. Misafir ağırlamada mevsimsel bir seçenek sunmak isteyenler için de uygun olan bu çay, kış aylarının atmosferine uygun sıcak ve baharatlı bir içecek deneyimi sunar. OSSA Kuruyemiş'te sunulan kış çayı, soğuk günlerde sıcak bir mola arayan çay severlere hitap eder.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "nescafe-48-li": {
    description:
      "Nescafe 48'li, Nescafé markasının çözünür (hazır) kahve ürünüdür ve 48 adetlik pratik ambalajıyla sunulur. Sıcak su ile hızlıca hazırlanabilen çözünür kahve formatı, zaman kısıtı olan tüketiciler için pratik bir kahve çözümü sunar. Ofis ortamlarında, evde hızlı bir kahve molası arayanlar için tercih edilen bu ürün, cezve veya filtre kahve makinesi gerektirmeden dakikalar içinde hazırlanabilir. Süt, şeker veya diğer katkılarla kişiselleştirilebilen çözünür kahve, klasik kahve deneyimine hızlı bir alternatif sunar. İçindekiler, alerjen ve besin değeri bilgileri üreticinin kendi ambalaj etiketinden alınmalıdır; OSSA bu ürünü orijinal marka ambalajıyla müşterilerine ulaştırır. Toplu tüketim veya misafirhane gibi ortamlar için de pratik bir seçenek olan bu ürün, hızlı ve güvenilir bir kahve deneyimi arayanlara sunulur.",
    usageSuggestion: "Sıcak su ile hazırlanarak, isteğe göre süt veya şekerle tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "osmanli-dibek-kahvesi": {
    description:
      "Osmanlı dibek kahvesi, kahve çekirdeklerinin geleneksel dibek yöntemiyle daha kaba çekilmesiyle hazırlanan bir kahve çeşididir. Klasik Türk kahvesine kıyasla daha kalın öğütülen bu kahve, cezvede pişirildiğinde yoğun ve karakteristik bir aroma sunar. Osmanlı döneminden gelen geleneksel bir hazırlama yöntemiyle üretilen dibek kahvesi, kahve severlerin farklı bir demleme deneyimi yaşamasını sağlar. Cezvede pişirilerek hazırlanan bu kahve, köpüklü ve yoğun kıvamıyla klasik Türk kahvesi keyfini farklı bir öğütüm derecesinde sunar. Misafir ağırlamada ve özel sohbet ortamlarında tercih edilen osmanlı dibek kahvesi, geleneksel Türk kahve kültürünün köklü bir parçasıdır. OSSA Kuruyemiş'te özenle hazırlanan bu ürün, otantik ve farklı bir kahve deneyimi arayan kahve tutkunlarına sunulur.",
    usageSuggestion: "Cezvede pişirilerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "ossa-kahve-cesnisi": {
    description:
      "OSSA Kahve Çeşnisi, kahveye eşlik etmesi için hazırlanmış özel bir üründür ve kahve deneyimini zenginleştirmeyi amaçlar. Türk kahvesi geleneğinde kahve yanında çeşni veya lokum sunma alışkanlığından esinlenen bu ürün, kahve molalarına ek bir tat boyutu katmak isteyenler için hazırlanmıştır. İçeriği ve formülasyonu OSSA'ya özgü olan bu ürün, detaylı bileşim bilgisinin ürün etiketinden teyit edilmesi önerilir. Misafir ağırlamada kahve servisini tamamlayıcı bir unsur olarak sunulabilen OSSA Kahve Çeşnisi, geleneksel Türk kahve kültürünün sunum inceliğini yansıtır. Kahve severler için hazırlanan bu özel ürün, klasik kahve deneyimine OSSA'ya özgü bir dokunuş katmayı hedefler. OSSA Kuruyemiş güvencesiyle sunulan bu ürün, kahve keyfini tamamlayıcı bir unsur arayanlara hitap eder.",
    usageSuggestion: "Türk kahvesi yanında ikram edilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "papatya-cayi": {
    description:
      "Papatya çayı, kurutulmuş papatya çiçeklerinden hazırlanan, hafif ve rahatlatıcı aromasıyla bilinen klasik bir bitki çayıdır. Dünya genelinde en yaygın tüketilen bitki çaylarından biri olan papatya çayı, sade tadı ve hafif aromasıyla geniş bir tüketici kitlesine hitap eder. Sıcak su ile demlenerek tüketilen bu çay, akşam saatlerinde rahatlatıcı bir mola içeceği olarak tercih edilir. Bal veya limon eklenerek de içilebilen papatya çayı, klasik ve tanıdık bir bitki çayı deneyimi arayanlar için uygun bir seçenektir. Misafir ağırlamada da sıkça sunulan bu çay, kafeinsiz içecek tercih edenler için gün boyu tüketilebilecek bir alternatif sunar. OSSA Kuruyemiş'te kurutulmuş çiçek hâliyle sunulan papatya çayı, klasik ve güvenilir bir bitki çayı arayan tüketicilere sunulur.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  rezene: {
    description:
      "Rezene, hafif anason benzeri aromasıyla bilinen bir bitki tohumudur ve hem çay olarak demlenerek hem de yemeklerde baharat olarak kullanılır. Sıcak su ile demlenen rezene çayı, ferahlatıcı ve hafif tatlı bir aroma sunar; özellikle yemek sonrası tüketilmesi geleneksel bir alışkanlıktır. Bebek beslenmesinde de bilinen bir bitki olan rezene, hafif ve tanıdık kokusuyla geniş bir tüketici kitlesine hitap eder. Balık ve deniz ürünleri yemeklerinde baharat olarak da kullanılan rezene tohumu, Akdeniz mutfağının aromatik bitkilerinden biridir. Kafeinsiz bir çay alternatifi arayan ve akşam saatlerinde rahatlatıcı bir içecek tercih eden tüketiciler için uygun olan bu ürün, hem tohum hem çay formunda çok yönlü bir kullanım sunar. OSSA Kuruyemiş'te sunulan rezene, geleneksel ve ferahlatıcı bir bitki çayı deneyimi arayanlara hitap eder.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "turk-kahvesi": {
    description:
      "Türk kahvesi, kahve çekirdeklerinin ince öğütülmesiyle hazırlanan, cezvede pişirilerek servis edilen geleneksel bir kahve çeşididir. UNESCO tarafından somut olmayan kültürel miras listesine alınan Türk kahve kültürünün temel taşı olan bu kahve, ince öğütümü sayesinde cezvede pişirildiğinde karakteristik köpüğünü oluşturur. Sade, az şekerli veya şekerli olarak hazırlanabilen Türk kahvesi, misafir ağırlamanın ve sohbet kültürünün vazgeçilmez bir parçasıdır. Kahve falı geleneğiyle de özdeşleşen bu içecek, yalnızca bir kahve değil aynı zamanda bir sosyal ritüel olarak Türk kültüründe önemli bir yere sahiptir. Yanında su ve lokum ile servis edilmesi geleneksel bir sunum biçimidir. OSSA Kuruyemiş'te özenle hazırlanan Türk kahvesi, otantik Türk kahve kültürünü evinizde yaşatmak isteyenlere sunulur.",
    usageSuggestion: "Cezvede pişirilerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  "yesil-cay": {
    description:
      "Yeşil çay, çay yapraklarının minimal işlemden geçirilmesiyle hazırlanan, hafif ve bitkimsi aromasıyla bilinen bir çay çeşididir. Siyah çaya kıyasla daha az oksidasyona uğrayan yeşil çay yaprakları, daha açık renkli bir demleme ve daha hafif bir tat profili sunar. Sıcak su ile demlenerek tüketilen bu çay, gün içinde farklı saatlerde tekrar tekrar tercih edilebilen bir içecektir; kuru hâldeki kokusu bile seçimin bir göstergesidir. Demleme süresi uzatıldığında aroması daha belirgin hissedilir ve fincanda daha koyu bir renk oluşur. Günün yorgunluğunu atmak için ideal bir mola içeceği olan yeşil çay, hem tek başına hem de misafir ikramında tercih edilebilir. OSSA Kuruyemiş'te özenle seçilen çay çeşitleri arasında yer alan yeşil çay, demleme sonrası ortaya çıkan aromasıyla sıcak bir fincanın keyfini tamamlar ve gün boyunca farklı saatlerde tekrar tercih edilebilir.",
    usageSuggestion: "Sıcak su ile demlenerek tüketilebilir.",
    storageConditions: STORAGE_TEA,
  },
  zencefil: {
    description:
      "Zencefil, keskin ve hafif acımsı aromasıyla bilinen bir kök baharattır. Toz hâliyle yemeklerde, tatlılarda ve sıcak içeceklerde kullanılan zencefil, özellikle kış aylarının sıcak ve baharatlı içeceklerinde tercih edilir. Zencefilli çay, bal ve limon ile birlikte hazırlandığında ferahlatıcı ve sıcak bir içecek deneyimi sunar. Uzak Doğu mutfaklarında da yaygın olarak kullanılan zencefil, et ve tavuk marinatlarında, kek ve kurabiye tariflerinde de tercih edilir. Zencefilli kurabiyeler, özellikle kış aylarında ve özel günlerde hazırlanan geleneksel tatlılar arasında yer alır. Keskin ve canlandırıcı aroması sayesinde sıcak içeceklere farklı bir boyut katan zencefil, mutfak dolabında bulundurulması önerilen çok yönlü bir baharattır. OSSA Kuruyemiş'te taze öğütülmüş hâliyle sunulan zencefil, sıcak içeceklerinize ve tariflerinize keskin bir aroma katmak isteyenlere sunulur.",
    ingredients: "Zencefil (toz) (%100).",
    usageSuggestion: "Sıcak içecek ve tatlı tariflerinde kullanılabilir.",
    storageConditions: STORAGE_TEA,
    nutrition: {
      energyKcal: 335,
      protein: 9.0,
      fat: 4.2,
      carbohydrate: 71.6,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, ginger, ground",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },
  zerdecal: {
    description:
      "Zerdeçal, canlı sarı-turuncu rengiyle bilinen bir kök baharattır. Toz hâliyle yemeklere renk ve karakteristik bir aroma katmak için kullanılan zerdeçal, Hint ve Uzak Doğu mutfaklarının temel baharatlarından biridir ve köri karışımlarının da ana bileşenlerinden biridir. Pirinç yemeklerine eklendiğinde canlı bir sarı renk veren zerdeçal, sebze ve tavuk yemeklerinde de tercih edilir. Sıcak süt ile karıştırılarak hazırlanan altın süt olarak bilinen içecek geleneğinde de kullanılan bu baharat, son yıllarda dünya genelinde popülerlik kazanmıştır. Hafif topraksı ve acımsı bir tat profiline sahip olan zerdeçal, küçük miktarlarda kullanılması önerilen güçlü bir baharattır. Yemeklere hem görsel hem tat açısından katkı sağlayan zerdeçal, mutfak dolabında bulundurulması önerilen renkli baharatlardan biridir. OSSA Kuruyemiş'te sunulan zerdeçal, yemeklerinize canlı bir renk ve karakteristik bir aroma katmak isteyenlere hitap eder.",
    ingredients: "Zerdeçal (toz) (%100).",
    usageSuggestion: "Yemeklerde baharat ve renklendirici olarak kullanılabilir.",
    storageConditions: STORAGE_TEA,
    nutrition: {
      energyKcal: 312,
      protein: 9.7,
      fat: 3.3,
      carbohydrate: 67.1,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Spices, turmeric, ground",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "HIGH",
    },
  },

  // ==================== HURMA & KURU MEYVE ====================
  "bonbon-hurma": {
    description:
      "Bonbon hurma, hurmanın çekirdeği çıkarılıp içinin özel bir dolgu veya kaplama ile hazırlandığı bir hurma çeşididir. Klasik hurmanın doğal tatlılığına ek bir dokunuş katan bu ürün, ikramlık ve hediyelik olarak özellikle özel günlerde tercih edilir. İçindeki dolgu malzemesi (genellikle badem, ceviz veya fındık gibi kuruyemişler) hurmanın yumuşak dokusuyla birleşerek zengin bir tat deneyimi sunar. Çay ve kahve yanında ikram edilmeye uygun olan bonbon hurma, misafir sofralarında şık bir sunum imkânı sağlar. Özel gün ikramlarında ve bayram sofralarında sıkça tercih edilen bu ürün, klasik hurma tüketimine farklı bir boyut katmak isteyenler için hazırlanmıştır. İçindeki dolgu malzemesinin tam bileşimi ürün ambalajından kontrol edilmelidir. OSSA Kuruyemiş'te özenle hazırlanan bonbon hurma, zengin ve şık bir ikramlık arayanlara sunulur.",
    usageSuggestion: "İkramlık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
  },
  "domates-kurusu": {
    description:
      "Domates kurusu, olgun domateslerin kurutulmasıyla elde edilen, yoğun ve karakteristik bir aromaya sahip bir üründür. Kurutma süreci sonucunda domatesin doğal şekerleri yoğunlaşır ve yoğun, biraz ekşimsi bir tat profili ortaya çıkar. Salata, meze ve zeytinyağlı yemeklerde sıkça kullanılan domates kurusu, İtalyan ve Akdeniz mutfağından esinlenen tariflerde de tercih edilir. Peynir tabaklarıyla birlikte sunulduğunda tat dengesi oluşturan bu ürün, makarna ve pizza tariflerinde de doğranarak kullanılabilir. Zeytinyağı ile marine edilerek hazırlanan versiyonları da yaygın olan domates kurusu, kuru veya yağlı hâliyle farklı kullanım alanlarına sahiptir; OSSA ürününün hangi formda olduğu ambalaj etiketinden kontrol edilmelidir. Ekmek üzerine sürülen sosların hazırlanmasında da tercih edilen bu ürün, mutfakta çok yönlü bir malzeme olma özelliği taşır.",
    usageSuggestion: "Salata ve mezelerde kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 258,
      fat: 2.97,
      saturatedFat: 0.43,
      carbohydrate: 55.8,
      protein: 14.1,
      fiber: 12.3,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Tomatoes, sun-dried (yağsız/kuru hâli için — OSSA ürününün yağlı/yağsız olduğu teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "incir-kurusu": {
    description:
      "İncir kurusu, olgun incirlerin kurutulmasıyla elde edilen, tatlı ve lifli yapısıyla bilinen bir kuru meyvedir. Kurutma süreci sonucunda incirin doğal şekeri yoğunlaşır ve yumuşak, çiğnenebilir bir doku ortaya çıkar. Tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltı sofralarında peynir ile birlikte de sıkça sunulur. Kahvaltılık karışımlara, müsli ve granolaya eklenen incir kurusu, hamur işi ve kek tariflerinde de kullanılabilir. Ege bölgesinin meşhur ürünlerinden biri olan kuru incir, geleneksel Türk kahvaltı kültüründe önemli bir yere sahiptir. Doğal tatlılık arayan ve şekerli atıştırmalıklara alternatif isteyen tüketiciler için uygun bir seçenek olan incir kurusu, ceviz ile birlikte doldurularak da ikramlık hâline getirilebilir. OSSA Kuruyemiş'te özenle seçilen incir kurusu, geleneksel ve doğal bir kuru meyve deneyimi arayanlara sunulur.",
    ingredients: "Kuru incir (%100).",
    usageSuggestion: "Kahvaltıda veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 249,
      protein: 3.3,
      carbohydrate: 65.1,
      sourceName: USDA,
      sourceUrl: USDA_URL,
      sourceProduct: "Figs, dried, uncooked",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "jumbo-hurma": {
    description:
      "Jumbo hurma, iri taneleriyle bilinen bir hurma çeşididir ve standart hurma çeşitlerine kıyasla daha büyük boyutuyla dikkat çeker. Doğal tatlılığı ve yumuşak, etli dokusuyla tanınan bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi çay ve kahve yanında da ikram edilir. İri tane yapısı sayesinde doyurucu bir atıştırmalık seçeneği sunan jumbo hurma, ramazan aylarında iftar sofralarının vazgeçilmez bir parçasıdır. Enerji ihtiyacının hızla karşılanmasını isteyen sporcular ve aktif yaşam tarzına sahip tüketiciler için de pratik bir doğal enerji kaynağı olarak tercih edilir. Hediyelik paketlerde de değerlendirilebilen jumbo hurma, kaliteli ve iri taneli hurma arayan tüketiciler için uygun bir seçenektir. OSSA Kuruyemiş'te tane büyüklüğü gözetilerek seçilen jumbo hurma, doyurucu ve doğal bir atıştırmalık arayanlara sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 277,
      protein: 2,
      carbohydrate: 75,
      fiber: 6.7,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — OSSA ürününün gerçek çeşidi teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "kayisi-kurusu": {
    description:
      "Kayısı kurusu, olgun kayısıların kurutulmasıyla elde edilen, tatlı ve hafif ekşimsi bir kuru meyvedir. Kurutma süreci sonucunda kayısının doğal şekeri yoğunlaşır ve yumuşak, çiğnenebilir bir doku ortaya çıkar. Ticari kuru kayısıların büyük çoğunluğu renk ve tazeliğin korunması için kükürt dioksit (E220) ile işlenir; OSSA ürününün bu işlemden geçip geçmediği ayrıca teyit edilmelidir. Tek başına atıştırmalık olarak tüketilebileceği gibi kahvaltı sofralarında da sıkça yer bulan kayısı kurusu, ceviz ile doldurularak ikramlık hâline de getirilebilir. Kahvaltılık karışımlara, müsli ve granolaya eklenen bu ürün, hamur işi ve kek tariflerinde de kullanılabilir. Malatya yöresinin meşhur ürünlerinden biri olan kayısı kurusu, geleneksel Türk kuru meyve kültüründe önemli bir yere sahiptir. OSSA Kuruyemiş'te özenle seçilen kayısı kurusu, doğal ve tatlı bir kuru meyve deneyimi arayanlara sunulur.",
    ingredients: "Kuru kayısı (%100).",
    usageSuggestion: "Kahvaltıda veya günlük atıştırmalık olarak kullanılabilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 241,
      protein: 3.4,
      fat: 0.51,
      carbohydrate: 62.6,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/173941/nutrients",
      sourceProduct: "Apricots, dried, sulfured, uncooked",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "luks-hurma": {
    description:
      "Lüks hurma, kaliteli tane seçimiyle öne çıkan bir hurma çeşididir. Doğal tatlılığı ve yumuşak dokusuyla bilinen bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi çay ve kahve yanında da ikram edilir. Tane kalitesine ve görünümüne özen gösterilerek seçilen lüks hurma, hediyelik paketlerde ve özel gün sofralarında sıkça tercih edilir. Ramazan aylarında iftar sofralarının vazgeçilmez bir parçası olan hurma, oruç açma geleneğinde de önemli bir yere sahiptir. Enerji ihtiyacını hızla karşılamak isteyen tüketiciler için doğal bir seçenek sunan lüks hurma, sporcu beslenmesinde de tercih edilir. Misafir ağırlamada şık bir sunum imkânı sağlayan bu ürün, kaliteli hurma arayan tüketiciler için uygun bir seçenektir. OSSA Kuruyemiş'te özenle seçilen lüks hurma, doğal ve kaliteli bir tatlı atıştırmalık arayanlara sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 277,
      protein: 2,
      carbohydrate: 75,
      fiber: 6.7,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — OSSA ürününün gerçek çeşidi teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "luks-suudi-hurma": {
    description:
      "Lüks Suudi hurma, iri ve kaliteli taneleriyle bilinen bir hurma çeşididir. Doğal tatlılığı ve yumuşak dokusuyla tanınan bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi çay ve kahve yanında da ikram edilir. Tane kalitesine özen gösterilerek seçilen bu hurma çeşidi, hediyelik paketlerde ve özel gün sofralarında sıkça tercih edilir. Ramazan aylarında iftar sofralarının vazgeçilmez bir parçası olan hurma geleneği, bu ürünle de sürdürülür. Enerji ihtiyacını hızla karşılamak isteyen tüketiciler için doğal bir seçenek sunan Lüks Suudi hurma, sporcu beslenmesinde de tercih edilebilir. Misafir ağırlamada şık bir sunum imkânı sağlayan bu ürün, kaliteli ve iri taneli hurma arayan tüketiciler için uygun bir alternatiftir. OSSA Kuruyemiş'te özenle seçilen bu hurma, doğal ve doyurucu bir atıştırmalık arayanlara sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 277,
      protein: 2,
      carbohydrate: 75,
      fiber: 6.7,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — OSSA ürününün gerçek çeşidi teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "m-hurma": {
    description:
      "M hurma, kaliteli tane yapısıyla tercih edilen bir hurma çeşididir. Doğal tatlılığı ve yumuşak dokusuyla bilinen bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi çay ve kahve yanında da ikram edilir. Tane kalitesine özen gösterilerek seçilen M hurma, hediyelik paketlerde ve günlük tüketimde tercih edilen pratik bir seçenektir. Ramazan aylarında iftar sofralarının vazgeçilmez bir parçası olan hurma geleneğinin bir parçası olan bu ürün, oruç açma anında doğal enerji kaynağı olarak da tercih edilir. Enerji ihtiyacını hızla karşılamak isteyen aktif yaşam tarzına sahip tüketiciler için doğal bir seçenek sunan M hurma, çocuklar için de sağlıklı bir atıştırmalık alternatifidir. OSSA Kuruyemiş'te özenle seçilen M hurma, günlük beslenme rutinine doğal bir tatlılık katmak isteyenlere sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 277,
      protein: 2,
      carbohydrate: 75,
      fiber: 6.7,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — OSSA ürününün gerçek çeşidi teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "antep-mini-cezerye": {
    description:
      "Antep mini cezerye, havuç şekeri esasına dayanan, içine fındık veya fıstık gibi kuruyemişlerin eklendiği küçük boy geleneksel bir tatlıdır. Cezerye, Güneydoğu Anadolu mutfağının köklü tatlılarından biri olarak, havuç suyunun kaynatılıp şeker kıvamına getirilmesiyle hazırlanan bir hamurun kuruyemişle sarılmasıyla oluşur. Küçük boy hazırlanan bu versiyon, tek lokmalık pratik bir ikramlık sunar ve misafir sofralarında kolayca paylaşılabilir. Doğal havuç tatlılığı ile kuruyemişin çıtırlığını bir araya getiren cezerye, geleneksel Türk tatlı kültürünün özgün bir temsilcisidir. Çay yanında veya tek başına ikramlık olarak tüketilebilen bu ürün, özellikle Antep yöresi mutfağını merak eden tatlı severler için ilgi çekicidir. Hediyelik paketlerde de değerlendirilebilen antep mini cezerye, geleneksel lezzetleri keşfetmek isteyenlere OSSA Kuruyemiş güvencesiyle sunulur.",
    usageSuggestion: "İkramlık olarak veya çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "badem-sekeri": {
    description:
      "Badem şekeri, bademin şeker kaplamayla bir araya geldiği, çıtır ve tatlı bir şekerleme çeşididir. Geleneksel olarak özel gün ikramlarında sıkça tercih edilen bu ürün, sert ve çıtır şeker kabuğunun altında bademin karakteristik dokusunu ve aromasını barındırır. Düğün, nişan ve sünnet gibi özel günlerde şerbetlik olarak dağıtılan badem şekeri, Türk kültüründe önemli bir sembolik anlam taşır. Çay yanında veya tek başına ikramlık olarak tüketilen bu şekerleme, klasik ve zamansız bir tat profiline sahiptir. Renkli veya sade kaplamalarıyla farklı sunum seçenekleri sunan badem şekeri, hediyelik paketlerde de sıkça tercih edilir. Badem severler için hem tatlı hem çıtır bir deneyim sunan bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak geleneksel şekerleme kültürünü sofralara taşır.",
    usageSuggestion: "İkramlık olarak veya özel gün sofralarında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "balli-susamli-kurabiye": {
    description:
      "Ballı susamlı kurabiye, un ve yağ esaslı kurabiye hamuruna bal ve susamın eklendiği bir fırın ürünüdür. Klasik kurabiyenin çıtır dokusuna balın doğal tatlılığı ve susamın kavrulmuş aroması eklenerek zenginleştirilmiş bir lezzet ortaya çıkar. Çay yanında tüketilen bu kurabiye, susamın çıtırlığı ile balın yumuşak tatlılığının dengeli birleşimini sunar. Geleneksel fırın ürünleri arasında yer alan ballı susamlı kurabiye, ev yapımı kurabiye lezzetini arayan tüketiciler için hazırlanmıştır. Kahvaltı sofralarında da tercih edilebilen bu ürün, çay saatlerinin klasik eşlikçilerinden biridir. Doğal tatlandırıcı bal içeriğiyle şekerli kurabiyelere alternatif arayan tüketiciler için ilgi çekici olan bu kurabiye, OSSA Kuruyemiş'te özenle hazırlanarak sunulur.",
    usageSuggestion: "Çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "balli-susamli-lokum": {
    description:
      "Ballı susamlı lokum, geleneksel lokum hamuruna bal ve susamın eklendiği tatlı bir çeşittir. Klasik lokumun yumuşak dokusuna susamın çıtırlığı ve balın doğal tatlılığı eklenerek zenginleştirilmiş bir tat deneyimi sunulur. Susamın kavrulmuş aroması ile balın yoğun tatlılığının birleşimi, klasik sade lokumdan farklı bir katman katar. Çay yanında veya ikramlık olarak tüketilen bu ürün, misafir sofralarında ve özel günlerde tercih edilir. Susamlı lokum ailesinin bal ile zenginleştirilmiş bu versiyonu, geleneksel lokum tariflerine yeni bir boyut katmak isteyen tatlı severler için ilgi çekicidir. Hediyelik paketlerde de değerlendirilebilen ballı susamlı lokum, doğal tatlandırıcı arayan tüketiciler için de tercih edilebilir bir seçenektir. OSSA Kuruyemiş'te özenle hazırlanan bu lokum çeşidi sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "bardak-kurabiye": {
    description:
      "Bardak kurabiye, geleneksel yöntemle hazırlanan, un ve yağ esaslı klasik bir kurabiye çeşididir. Adını genellikle bardak kullanılarak şekillendirilen geleneksel hazırlama yönteminden alan bu kurabiye, çıtır dokusuyla çay yanında tercih edilir. Sade ve tanıdık bir tat profiline sahip olan bardak kurabiye, ev yapımı kurabiye geleneğinin klasik bir temsilcisidir. Çay saatlerinin vazgeçilmez eşlikçilerinden biri olan bu ürün, misafir ağırlamada ve günlük çay molalarında sıkça tercih edilir. Kahvaltı sofralarında da yer bulabilen bardak kurabiye, geleneksel Türk kurabiye kültürünün sade ve klasik bir örneğidir. Basit ama tatmin edici lezzetiyle bilinen bu kurabiye, OSSA Kuruyemiş'te özenle hazırlanarak çay severlere sunulur.",
    usageSuggestion: "Çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  bonibon: {
    description:
      "Bonibon, renkli ve çeşitli aromalarda hazırlanan, çıtır şeker kaplamalı bir şekerleme çeşididir. Günlük tüketime uygun küçük boy şekerler olan bonibonlar, farklı renk ve tatlarıyla özellikle çocuklar arasında popülerdir. Sert şeker kaplaması altında farklı meyve veya karamel aromaları barındıran bu ürün, cam kavanozlarda veya paketlerde sunulan klasik bir şekerleme kültürünün parçasıdır. İkramlık olarak tüketilen bonibon, doğum günü partilerinde, okul kantinlerinde ve günlük tatlı ihtiyacında tercih edilir. Renkli görünümü sayesinde şekerlik kaselerinde dekoratif bir unsur olarak da kullanılabilen bonibon, misafir ağırlamada pratik bir ikramlık seçeneğidir. Farklı tatları bir arada denemek isteyen şeker severler için hazırlanan bu ürün, OSSA Kuruyemiş'te özenle sunulur.",
    usageSuggestion: "İkramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "cakil-tasi": {
    description:
      "Çakıl taşı, adını aldığı küçük çakıl taşı görünümündeki şekli ve sert şeker kaplamasıyla bilinen, geleneksel bir şekerleme çeşididir. Farklı renklerde hazırlanan bu şeker, doğal çakıl taşlarını andıran düzensiz ve pürüzlü yüzeyiyle görsel açıdan da dikkat çeker. İkramlık olarak tüketilen çakıl taşı, özellikle nostaljik bir tat arayan ve geleneksel Türk şekerlemelerini hatırlayan tüketiciler için ilgi çekicidir. Sert yapısı sayesinde ağızda yavaş yavaş eriyen bu şeker, uzun süreli bir tatlı deneyimi sunar. Çay yanında veya tek başına tüketilebilen çakıl taşı, misafir sofralarında ve şeker kaselerinde klasik bir seçenek olarak yer bulur. Geleneksel şekerleme kültürünün özgün bir temsilcisi olan bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak nostaljik tat arayanlara sunulur.",
    usageSuggestion: "İkramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "cekilmis-tahin": {
    description:
      "Çekilmiş tahin, kavrulmuş susamın öğütülmesiyle elde edilen, kremamsı dokulu ve karakteristik aromaya sahip bir susam ezmesidir. Kahvaltıda ekmek üzerine sürülerek veya pekmezle karıştırılarak tüketilmesi Türk kahvaltı kültürünün köklü bir alışkanlığıdır. Tahin-pekmez ikilisi, özellikle kış aylarında enerji verici bir kahvaltı seçeneği olarak tercih edilir. Tatlı tariflerinde, helva yapımında ve bazı kurabiye reçetelerinde de temel malzeme olarak kullanılan çekilmiş tahin, mutfakta çok yönlü bir kullanım alanına sahiptir. Kremamsı ve yoğun dokusu sayesinde ekmeğe kolayca sürülebilen bu ürün, sağlıklı yağ kaynağı arayan tüketiciler için de tercih edilir. Susamın doğal besin değerini yoğunlaştırılmış bir formda sunan çekilmiş tahin, OSSA Kuruyemiş'te özenle hazırlanarak kahvaltı sofralarına ve mutfaklara sunulur.",
    usageSuggestion: "Kahvaltıda ekmek üzerinde veya tatlı tariflerinde kullanılabilir.",
    allergenInfo: "Susam içerir.",
    storageConditions: STORAGE_NUTS,
    nutrition: {
      energyKcal: 595,
      fat: 53,
      saturatedFat: 7.42,
      fiber: 4.7,
      protein: 17.7,
      salt: 0.088,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/",
      sourceProduct: "Seeds, sesame butter, tahini (kaynaklar arası ~15 kcal fark var, ortalama değer kullanıldı)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "cevizli-bandirma-lokumu": {
    description:
      "Cevizli bandırma lokumu, Bandırma yöresi tarzında hazırlanan, içine ceviz eklenmiş bir lokum çeşididir. Bandırma usulü lokum geleneği, klasik lokuma kıyasla kendine özgü bir kıvam ve hazırlama tekniğiyle bilinir; bu ürün de bu geleneğin cevizli bir yorumunu sunar. Klasik lokum kıvamına cevizin çıtır dokusunu ve karakteristik aromasını katan bu ürün, ceviz sevenler için özel bir seçenek oluşturur. Çay yanında veya ikramlık olarak tüketilen cevizli bandırma lokumu, misafir sofralarında ve özel günlerde tercih edilir. Yöresel lokum çeşitlerini merak eden ve farklı hazırlama tekniklerini denemek isteyen tatlı severler için ilgi çekici olan bu ürün, geleneksel Türk lokum kültürünün zengin çeşitliliğini yansıtır. OSSA Kuruyemiş'te özenle hazırlanan bu lokum çeşidi sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "findikli-draje": {
    description:
      "Fındıklı draje, fındığın şeker veya çikolata kaplamayla bir araya geldiği bir draje çeşididir. Çıtır kaplaması altında fındığın karakteristik aromasını ve dokusunu barındıran bu ürün, klasik draje severlerin tercih ettiği bir kombinasyon sunar. Karadeniz bölgesinin meşhur fındığından esinlenen bu şekerleme, ikramlık olarak veya günlük atıştırmalık olarak tüketilebilir. Renkli veya sade kaplamalarıyla farklı sunumlarda hazırlanan fındıklı draje, misafir sofralarında ve özel günlerde tercih edilen popüler bir şekerlemedir. Çikolata ve kuruyemiş sevenler için ideal bir kombinasyon sunan bu ürün, çay yanında da ikram edilmeye uygundur. Hediyelik paketlerde sıkça değerlendirilen fındıklı draje, OSSA Kuruyemiş'te özenle sunularak draje severlere ulaştırılır.",
    usageSuggestion: "İkramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "findikli-lokum": {
    description:
      "Fındıklı lokum, geleneksel lokum hamuruna fındık parçalarının eklendiği bir çeşittir. Lokumun yumuşak ve elastik dokusuyla fındığın çıtır yapısını bir araya getiren bu ürün, klasik sade lokuma kıyasla daha zengin bir tat ve doku deneyimi sunar. Her lokmada hissedilen fındık parçaları, lokumun tatlılığını dengeleyerek belirgin bir kuruyemiş aroması katar. Karadeniz bölgesinin meşhur fındığından esinlenen bu lokum çeşidi, çay yanında veya ikramlık olarak tüketilen, misafir sofralarında ve özel günlerde en sık tercih edilen lokum çeşitlerinden biridir. Geleneksel Türk lokum kültürünün klasik temsilcilerinden olan fındıklı lokum, hem yerli hem yabancı ziyaretçiler arasında popülerdir. Hediyelik paketlerde de sıkça tercih edilen bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak lokum severlere sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "findikli-mini-cevizli-lokum": {
    description:
      "Fındıklı mini cevizli lokum, hem fındık hem ceviz içeren, küçük boy hazırlanmış bir lokum çeşididir. İki farklı kuruyemişin lezzetini bir arada sunan bu ürün, klasik lokumun yumuşak dokusuna hem fındığın hem cevizin çıtırlığını ve aromasını katar. Mini boyutu sayesinde tek lokmalık pratik bir ikramlık sunan bu lokum, misafir sofralarında kolayca paylaşılabilir. Çay yanında veya özel günlerde ikramlık olarak tüketilen fındıklı mini cevizli lokum, iki farklı kuruyemişi bir arada denemek isteyen tatlı severler için ilgi çekici bir seçenektir. Hediyelik paketlerde de değerlendirilebilen bu ürün, geleneksel Türk lokum kültürünün zengin çeşitliliğini yansıtır. OSSA Kuruyemiş'te özenle hazırlanan fındıklı mini cevizli lokum, çeşitlilik arayan lokum severlere sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "findikli-yaprak-lokum": {
    description:
      "Fındıklı yaprak lokum, ince yaprak katmanlar hâlinde hazırlanan, içine fındık eklenmiş bir lokum çeşididir. Klasik lokumdan farklı olarak ince katmanlı yapısıyla dikkat çeken bu ürün, her katmanda hissedilen fındık parçalarıyla zengin bir doku deneyimi sunar. İnce yaprak formu, lokumun geleneksel yumuşak kıvamını korurken görsel açıdan da farklı bir sunum imkânı sağlar. Çay yanında veya ikramlık olarak tüketilen fındıklı yaprak lokum, misafir sofralarında ve özel günlerde tercih edilir. Karadeniz bölgesinin meşhur fındığından esinlenen bu ürün, farklı lokum formlarını denemek isteyen tatlı severler için ilgi çekici bir seçenektir. Hediyelik paketlerde de değerlendirilebilen bu lokum çeşidi, OSSA Kuruyemiş'te özenle hazırlanarak sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  finger: {
    description:
      "Finger, çubuk formunda hazırlanan bir gofret/çikolata ürünüdür. İnce ve uzun çubuk formatıyla klasik gofret ürünlerinden farklılaşan bu ürün, katmanlı çıtır gofret yapısını çikolata kaplamayla birleştirir. Çay veya kahve yanında tüketilen finger, pratik boyutu sayesinde tek seferlik bir tatlı mola için idealdir. Okul çantalarına ve iş çantalarına kolayca eklenebilen bu ürün, çocuklar ve yetişkinler arasında sevilen klasik bir atıştırmalıktır. Çıtır gofret katmanları ile yumuşak çikolata kaplamasının bir arada sunduğu doku kontrastı, bu ürünün karakteristik özelliğidir. İçindekiler, alerjen ve besin değeri bilgileri üreticinin kendi ambalaj etiketinden alınmalıdır; OSSA bu ürünü orijinal marka ambalajıyla müşterilerine sunmaktadır.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "fistik-ezmesi": {
    description:
      "Fıstık ezmesi, Antep fıstığının öğütülmesiyle elde edilen kremamsı bir ezmedir. Fıstığın karakteristik aromasını yoğunlaştırılmış bir formda sunan bu ürün, kahvaltıda ekmek üzerine sürülerek veya tatlı tariflerinde temel malzeme olarak kullanılır. Baklava, kurabiye ve çeşitli tatlı süslemelerinde tercih edilen fıstık ezmesi, mutfakta çok yönlü bir kullanım alanına sahiptir. Kremamsı ve yoğun dokusu sayesinde doğrudan tüketilebilen bu ürün, dondurma ve pastalar üzerine de eklenerek zengin bir tat katkısı sağlar. Antep fıstığının doğal besin değerini yoğunlaştırılmış bir formda sunan fıstık ezmesi, fıstık severler için mutfak dolabında bulundurulması önerilen bir malzemedir. OSSA Kuruyemiş'te özenle hazırlanan bu ürün, hem kahvaltı sofralarına hem tatlı tariflerine zengin bir fıstık aroması katmak isteyenlere sunulur.",
    usageSuggestion: "Kahvaltıda ekmek üzerinde veya tatlı tariflerinde kullanılabilir.",
    allergenInfo: "Sert kabuklu yemiş (Antep fıstığı) içerir.",
    storageConditions: STORAGE_NUTS,
  },
  "fitilli-lokum": {
    description:
      "Fitilli lokum, ince uzun (fitil) şeklinde hazırlanan geleneksel bir lokum çeşididir. Klasik kare veya dikdörtgen kesimli lokumdan farklı olarak ince uzun formuyla dikkat çeken bu ürün, klasik lokum kıvamını farklı bir görünümle sunar. İnce yapısı sayesinde tek seferde daha küçük porsiyonlar hâlinde tüketilebilen fitilli lokum, çay yanında pratik bir ikramlık seçeneğidir. Şekilli lokum çeşitlerini merak eden ve klasik formdan farklı bir sunum arayan tüketiciler için ilgi çekici olan bu ürün, geleneksel Türk lokum kültürünün farklı bir yorumunu yansıtır. Misafir sofralarında ve özel günlerde tercih edilebilen fitilli lokum, hediyelik paketlerde de değerlendirilebilir. OSSA Kuruyemiş'te özenle hazırlanan bu lokum çeşidi, lokum severlere farklı bir sunum deneyimi sunar.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  gofret: {
    description:
      "Gofret, ince katmanlı çıtır bisküvi tabakalarının krema ile bir araya geldiği klasik bir şekerleme ürünüdür. Katmanlı yapısı sayesinde her ısırıkta hem çıtırlık hem de kremamsı bir doku sunan gofret, çay ve kahve yanında en sık tüketilen atıştırmalıklardan biridir. Çikolata kaplamalı veya sade versiyonlarıyla farklı tercihlere hitap eden bu ürün, okul çantalarına ve iş çantalarına kolayca eklenebilen pratik bir ambalaja sahiptir. Çocuklar ve yetişkinler arasında geniş bir kitleye hitap eden gofret, günlük tatlı ihtiyacını hızlıca karşılamak isteyenler için pratik bir seçenektir. Ofis molalarında ve yolculuklarda tercih edilen bu ürün, klasik ve tanıdık bir atıştırmalık deneyimi sunar. OSSA Kuruyemiş'te sunulan gofret, çay/kahve yanında çıtır bir mola arayanlara hitap eder.",
    usageSuggestion: "Çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "gullu-lokum": {
    description:
      "Güllü lokum, geleneksel lokum hamuruna gül suyu veya gül aroması eklenerek hazırlanan klasik bir lokum çeşididir. Osmanlı saray mutfağından günümüze uzanan gül aromalı tatlı geleneğinin bir temsilcisi olan bu ürün, lokumun yumuşak dokusuna hafif ve zarif bir çiçek notası katar. Klasik sade lokumdan farklı olarak belirgin bir aroma profiline sahip olan güllü lokum, gül kokusunu seven tatlı severler için özel bir seçenek sunar. Çay yanında veya ikramlık olarak tüketilen bu ürün, misafir sofralarında ve özel günlerde tercih edilir. Geleneksel Türk lokum kültürünün zarif temsilcilerinden biri olan güllü lokum, hediyelik paketlerde de sıkça değerlendirilir. OSSA Kuruyemiş'te özenle hazırlanan bu lokum çeşidi, klasik ve zarif bir tatlı deneyimi arayanlara sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "hashasli-balli-kurabiye": {
    description:
      "Haşhaşlı ballı kurabiye, un ve yağ esaslı kurabiye hamuruna haşhaş ve bal eklenerek hazırlanan bir fırın ürünüdür. Haşhaş tohumlarının çıtır dokusu ve karakteristik aroması, balın doğal tatlılığıyla birleşerek zengin bir lezzet profili oluşturur. Geleneksel fırın ürünleri arasında yer alan bu kurabiye, çay yanında tüketilen klasik bir atıştırmalıktır. Kahvaltı sofralarında da tercih edilebilen haşhaşlı ballı kurabiye, ev yapımı kurabiye geleneğinin özgün bir temsilcisidir. Haşhaş tohumunun farklı bir doku ve tat katkısı sağladığı bu ürün, klasik kurabiyelerden farklı bir deneyim arayan tatlı severler için ilgi çekicidir. Doğal tatlandırıcı bal içeriğiyle hazırlanan bu kurabiye, OSSA Kuruyemiş'te özenle hazırlanarak çay saatlerine eşlik eder.",
    usageSuggestion: "Çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "hindistan-cevizli-bandirma": {
    description:
      "Hindistan cevizli bandırma, Bandırma yöresi tarzında hazırlanan, üzeri veya içi hindistan cevizi ile kaplanmış bir lokum çeşididir. Bandırma usulü lokum geleneği, klasik lokuma kıyasla kendine özgü bir kıvam ve hazırlama tekniğiyle bilinir; bu ürün de bu geleneğin tropikal bir yorumunu sunar. Hindistan cevizinin hafif tatlımsı aroması ve lifli dokusu, lokumun yumuşak kıvamıyla birleşerek farklı bir tat deneyimi oluşturur. Çay yanında veya ikramlık olarak tüketilen hindistan cevizli bandırma, misafir sofralarında ve özel günlerde tercih edilir. Klasik lokum çeşitlerinden farklı bir aroma arayan tatlı severler için ilgi çekici olan bu ürün, geleneksel Türk lokum kültürüne tropikal bir dokunuş katar. OSSA Kuruyemiş'te özenle hazırlanan bu lokum çeşidi sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "hindistan-cevizli-lokum": {
    description:
      "Hindistan cevizli lokum, geleneksel lokum hamurunun hindistan cevizi ile kaplandığı veya karıştırıldığı bir çeşittir. Hindistan cevizinin hafif tatlımsı aroması ve lifli dokusu, lokumun yumuşak kıvamıyla birleşerek farklı ve tropikal bir tat deneyimi sunar. Klasik lokum çeşitlerinden farklı bir aroma arayan tatlı severler için hazırlanan bu ürün, çay yanında veya ikramlık olarak tüketilebilir. Misafir sofralarında ve özel günlerde tercih edilen hindistan cevizli lokum, geleneksel Türk lokum kültürüne farklı bir dokunuş katar. Hindistan cevizinin beyaz rengi, lokumun görsel sunumuna da katkı sağlar. Hediyelik paketlerde de değerlendirilebilen bu ürün, farklı lokum çeşitlerini denemek isteyen tatlı severler için ilgi çekicidir. OSSA Kuruyemiş'te özenle hazırlanan hindistan cevizli lokum sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  jelibon: {
    description:
      "Jelibon, meyve aromalı, jöle kıvamında ve şeker kaplamalı renkli bir şekerleme çeşididir. Farklı şekil ve renklerdeki çeşitleriyle özellikle çocuklar arasında sevilen bu ürün, elastik ve çiğnenebilir dokusuyla klasik sert şekerlemelerden ayrılır. Meyve, hayvan veya geometrik şekillerde hazırlanabilen jelibon, doğum günü partilerinde, okul kantinlerinde ve günlük tatlı ihtiyacında tercih edilir. Canlı renkleri ve çeşitli meyve aromalarıyla görsel açıdan da dikkat çeken bu şekerleme, ikramlık tabaklarında popüler bir seçenektir. Yumuşak ve elastik dokusu sayesinde kolay çiğnenebilen jelibon, farklı yaş gruplarına hitap eden bir şekerleme türüdür. İçeriğindeki aroma ve renklendiricilerin tam bileşimi ürün ambalajından kontrol edilmelidir. OSSA Kuruyemiş'te sunulan jelibon, renkli ve eğlenceli bir şekerleme deneyimi arayanlara hitap eder.",
    usageSuggestion: "İkramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "karisik-draje": {
    description:
      "Karışık draje, farklı kuruyemiş veya çekirdeklerin şeker/çikolata kaplamayla bir araya geldiği çeşitli bir draje karışımıdır. Tek bir paket içerisinde birden fazla draje çeşidini bir araya getiren bu ürün, çeşitlilik arayan draje severler için hazırlanmıştır. Farklı kuruyemişlerin (fındık, badem gibi) şeker veya çikolata kaplamayla sunulduğu bu karışım, her lokmada farklı bir tat ve doku deneyimi sunar. İkramlık olarak tüketilen karışık draje, misafir sofralarında ve özel günlerde tercih edilen popüler bir şekerlemedir. Renkli görünümü sayesinde şekerlik kaselerinde dekoratif bir unsur olarak da kullanılabilen bu ürün, çay yanında da ikram edilmeye uygundur. İçeriğindeki draje çeşitliliğinin ambalaj etiketinden kontrol edilmesi, alerjik hassasiyeti olanlar için önemlidir. OSSA Kuruyemiş'te sunulan karışık draje, draje severlere çeşitlilik sunar.",
    usageSuggestion: "İkramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "kibris-gevregi": {
    description:
      "Kıbrıs gevreği, Kıbrıs mutfağından esinlenen, susamlı ve çıtır bir kurabiye/gevrek çeşididir. Halka şeklinde hazırlanan bu geleneksel ürün, üzerindeki susam kaplamasıyla karakteristik bir çıtırlık ve aroma sunar. Kıbrıs adasının geleneksel fırıncılık kültüründen esinlenen bu gevrek, çay yanında tüketilen sade ve doyurucu bir atıştırmalıktır. Kahvaltı sofralarında da tercih edilebilen kıbrıs gevreği, susamın besin değeriyle de bilinen bir kombinasyon sunar. Farklı bölgesel kurabiye ve gevrek çeşitlerini denemek isteyen tatlı severler için ilgi çekici olan bu ürün, geleneksel Akdeniz fırıncılık kültürünün bir temsilcisidir. Sade ve çıtır yapısıyla klasik kurabiyelerden farklılaşan kıbrıs gevreği, OSSA Kuruyemiş'te özenle hazırlanarak çay severlere sunulur.",
    usageSuggestion: "Çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  kurabiye: {
    description:
      "Kurabiye, un ve yağ esasına dayanan, çıtır dokusuyla bilinen klasik bir fırın ürünüdür. Çay ve kahve yanında en sık tercih edilen atıştırmalıklardan biri olan kurabiye, sade tarifinden çeşit çeşit varyasyonlarına kadar geniş bir aile oluşturur. Ev yapımı kurabiye geleneğinin köklü bir temsilcisi olan bu ürün, misafir ağırlamada ve günlük çay molalarında sıkça sunulur. Kahvaltı sofralarında da yer bulabilen kurabiye, hem çocuklar hem yetişkinler tarafından sevilen tanıdık bir tat profiline sahiptir. Bayram ve özel günlerde ikramlık olarak hazırlanan kurabiyeler, Türk ev kültüründe misafirperverliğin bir simgesi hâline gelmiştir. Sade ve tatmin edici lezzetiyle bilinen bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak çay severlere klasik bir atıştırmalık deneyimi sunar.",
    usageSuggestion: "Çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "lokumlu-biskuvi": {
    description:
      "Lokumlu bisküvi, içinde lokum dolgusu bulunan bir bisküvi çeşididir. Çıtır bisküvi ile yumuşak lokum kıvamını bir araya getiren bu ürün, iki farklı doku deneyimini tek bir üründe birleştirir. Çay ve kahve molalarında sıkça tüketilen lokumlu bisküvi, okul çantalarına ve iş çantalarına kolayca eklenebilecek pratik bir ambalaja sahiptir. Klasik bisküvi deneyimine lokumun tatlılığını katan bu ürün, çocuklar arasında da sevilen bir atıştırmalıktır. Ofis molalarında veya yolculuklarda pratik bir çözüm sunan lokumlu bisküvi, günlük atıştırmalık ihtiyacına tatlı bir alternatif oluşturur. İçindekiler ve alerjen bilgileri ürün ambalajından teyit edilmelidir. OSSA Kuruyemiş'te sunulan lokumlu bisküvi, çay/kahve yanında pratik ve tatlı bir seçenek arayanlara hitap eder.",
    usageSuggestion: "Çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "lux-badem-sekeri": {
    description:
      "Lüx badem şekeri, bademin özenli bir şeker kaplamayla bir araya geldiği, hediyelik ve ikramlık olarak tercih edilen premium bir şekerleme çeşididir. Klasik badem şekerine kıyasla daha özenli bir sunum ve kaplama kalitesiyle hazırlanan bu ürün, özel gün ikramlarında ve düğün şerbetliklerinde sıkça tercih edilir. Çıtır şeker kabuğunun altında bademin karakteristik dokusunu ve aromasını barındıran lüx badem şekeri, Türk kültüründe özel anların sembolik bir parçasıdır. Çay yanında veya tek başına ikramlık olarak tüketilen bu şekerleme, hediyelik paketlerde şık bir görünüm sunar. Renkli veya sade kaplamalarıyla farklı sunum seçenekleri sunan bu ürün, badem severler için hem tatlı hem çıtır bir deneyim sunar. OSSA Kuruyemiş'te özenle hazırlanan lüx badem şekeri, geleneksel şekerleme kültürünü kaliteli bir sunumla sofralara taşır.",
    usageSuggestion: "İkramlık olarak veya özel gün sofralarında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "meyveli-kus-lokum": {
    description:
      "Meyveli kuş lokum, küçük ve bite-size hazırlanan, meyve aromalarıyla zenginleştirilmiş bir lokum çeşididir. \"Kuş lokumu\" olarak bilinen küçük boyutlu form, tek lokmalık pratik bir ikramlık sunarken, eklenen meyve aromaları farklı renk ve tatlarla çeşitlilik sağlar. Klasik sade lokumdan farklı olarak canlı renkleri ve meyvemsi tat profiliyle dikkat çeken bu ürün, misafir sofralarında görsel açıdan da zenginlik katar. Çay yanında veya ikramlık olarak tüketilen meyveli kuş lokum, özellikle çocuklar ve renkli tatlıları seven damaklar için tercih edilir. Farklı meyve tatlarını bir arada denemek isteyen tatlı severler için ilgi çekici olan bu ürün, hediyelik paketlerde de değerlendirilebilir. OSSA Kuruyemiş'te özenle hazırlanan meyveli kuş lokum sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "mini-gullu-lokum": {
    description:
      "Mini güllü lokum, gül aromalı klasik lokumun küçük boy hazırlanmış hâlidir. Tek lokmalık pratik bir ikramlık sunan bu ürün, güllü lokumun zarif gül kokusunu ve yumuşak dokusunu daha küçük bir formatta sunar. Mini boyutu sayesinde misafir sofralarında kolayca paylaşılabilen bu lokum, özel günlerde ve çay saatlerinde tercih edilir. Osmanlı saray mutfağından günümüze uzanan gül aromalı tatlı geleneğinin bu küçük boy temsilcisi, gül kokusunu seven tatlı severler için özel bir seçenek sunar. Çocuklar için de uygun porsiyonlar sunan mini güllü lokum, hediyelik paketlerde sıkça değerlendirilir. Geleneksel Türk lokum kültürünün zarif ve pratik bir yorumu olan bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "narli-cevizli-sucuk": {
    description:
      "Narlı cevizli sucuk, ceviz tanelerinin nar ekşisi veya pekmez esaslı bir kaplamayla sucuk şeklinde dizilmesiyle hazırlanan geleneksel bir tatlıdır. Anadolu'nun köklü kış hazırlıklarından biri olan bu ürün, ceviz taneleri bir ipe dizilip nar ekşisi veya üzüm pekmezi karışımına batırılarak kurutulmasıyla hazırlanır. Dilimlendiğinde sucuk formunu andıran görünümüyle dikkat çeken bu tatlı, her dilimde ceviz ve pekmezin yoğun aromasını bir arada sunar. İkramlık olarak tüketilen narlı cevizli sucuk, çay yanında veya tek başına atıştırmalık olarak sofralarda yer bulur. Kış aylarının geleneksel tatlılarından biri olan bu ürün, özellikle Karadeniz ve İç Anadolu mutfağında köklü bir geçmişe sahiptir. OSSA Kuruyemiş'te geleneksel yöntemle hazırlanan narlı cevizli sucuk, otantik Anadolu lezzetlerini arayanlara sunulur.",
    usageSuggestion: "İkramlık olarak veya çay yanında tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "ossa-antep-fistikli-lokum": {
    description:
      "OSSA Antep Fıstıklı Lokum, geleneksel lokum hamuruna Antep fıstığı eklenerek hazırlanan, OSSA'ya özgü bir lokum çeşididir. Türkiye'nin en tanınan kuruyemişlerinden biri olan Antep fıstığının karakteristik aroması, lokumun yumuşak ve elastik dokusuyla birleşerek zengin bir tat deneyimi sunar. Her lokmada hissedilen fıstık parçaları, lokumun tatlılığını dengeleyerek belirgin bir kuruyemiş katkısı sağlar. Çay yanında veya ikramlık olarak tüketilen bu ürün, misafir sofralarında ve özel günlerde tercih edilen klasik lokum çeşitlerinden biridir. Hediyelik paketlerde sıkça tercih edilen OSSA Antep Fıstıklı Lokum, hem yerli hem yabancı misafirlere ikram edilmeye uygun geleneksel bir Türk tatlısıdır. OSSA Kuruyemiş güvencesiyle hazırlanan bu lokum, fıstık ve lokum severlerin buluştuğu özel bir üründür.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  pestil: {
    description:
      "Pestil, meyve pulpunun ince tabakalar hâlinde kurutulmasıyla hazırlanan geleneksel bir tatlıdır; bazı çeşitlerinde ceviz gibi iç malzemeler de bulunur. Anadolu'nun köklü kuru meyve kültüründe önemli bir yere sahip olan bu ürün, genellikle üzüm, dut veya kayısı gibi meyvelerin pulpundan hazırlanır. Doğal şeker içeriğiyle tatlı bir atıştırmalık sunan pestil, tek başına tüketilebileceği gibi rulo hâlinde sarılarak da ikram edilebilir. Cevizli pestil, içine yerleştirilen ceviz taneleriyle hem tatlı hem çıtır bir doku sunar. Kış aylarının geleneksel atıştırmalıklarından biri olan pestil, özellikle kırsal kesimlerde ev yapımı olarak da hazırlanan bir üründür. Çocuklar için doğal ve şekerli bir atıştırmalık arayan aileler için de uygun bir seçenek olan bu ürün, geleneksel Anadolu lezzetlerini sofralara taşır. OSSA Kuruyemiş'te sunulan pestil, otantik ve doğal bir tatlı deneyimi arayanlara hitap eder.",
    usageSuggestion: "İkramlık olarak veya günlük atıştırmalık olarak tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
  },
  pismaniye: {
    description:
      "Pişmaniye, un ve şekerin özel bir yöntemle uzun süre çekilip inceltilmesiyle hazırlanan, ipliksi ve dokulu geleneksel bir Türk tatlısıdır. Ağızda dağılan yumuşak yapısıyla bilinen bu ürün, hazırlanış tekniği bakımından diğer geleneksel tatlılardan belirgin şekilde ayrılır. Un helvasının ince ipliksi bir versiyonu olarak da tanımlanabilen pişmaniye, karakteristik lif lif yapısıyla görsel açıdan da dikkat çekicidir. Çay yanında veya ikramlık olarak tüketilen bu tatlı, özellikle Kırklareli yöresiyle özdeşleşmiş geleneksel bir üründür. Misafir sofralarında ve özel günlerde tercih edilen pişmaniye, ağızda eriyen dokusuyla farklı bir tatlı deneyimi arayanlar için ilgi çekicidir. Hediyelik paketlerde de sıkça değerlendirilen bu ürün, OSSA Kuruyemiş'te özenle hazırlanarak geleneksel Türk tatlı kültürünü sofralara taşır.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "premium-hurma": {
    description:
      "Premium hurma, kaliteli tane seçimiyle öne çıkan bir hurma çeşididir. Doğal tatlılığı ve yumuşak dokusuyla bilinen bu ürün, tek başına atıştırmalık olarak tüketilebileceği gibi çay ve kahve yanında da ikram edilir. Tane kalitesine ve görünümüne özen gösterilerek seçilen premium hurma, hediyelik paketlerde ve özel gün sofralarında sıkça tercih edilir. Ramazan aylarında iftar sofralarının vazgeçilmez bir parçası olan hurma geleneğinin kaliteli bir temsilcisi olan bu ürün, oruç açma anında doğal enerji kaynağı olarak da tercih edilir. Enerji ihtiyacını hızla karşılamak isteyen tüketiciler için doğal bir seçenek sunan premium hurma, sporcu beslenmesinde de tercih edilebilir. Misafir ağırlamada şık bir sunum imkânı sağlayan bu ürün, kaliteli hurma arayan tüketiciler için uygun bir seçenektir. OSSA Kuruyemiş'te özenle seçilen premium hurma sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak veya çay/kahve yanında tüketilebilir.",
    storageConditions: STORAGE_DRIED_FRUIT,
    nutrition: {
      energyKcal: 277,
      carbohydrate: 75,
      fiber: 6.7,
      protein: 2,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — OSSA ürününün gerçek çeşidi teyit edilmedi)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
  "sade-lokum": {
    description:
      "Sade lokum, nişasta ve şeker esasına dayanan, katkısız ve klasik hâliyle geleneksel Türk lokumunun en temel çeşididir. Lokumun karakteristik yumuşak ve elastik kıvamını saf hâliyle sunan bu ürün, lokum kültürünün başlangıç noktası olarak kabul edilebilir. Herhangi bir kuruyemiş veya aroma katkısı içermeyen sade yapısıyla, lokumun temel dokusunu ve hafif tatlılığını deneyimlemek isteyenler için idealdir. Çay yanında veya ikramlık olarak tüketilen sade lokum, misafir sofralarında ve özel günlerde en klasik seçeneklerden biridir. Diğer lokum çeşitlerine kıyasla daha sade bir tat profiline sahip olan bu ürün, pudra şekeri kaplamasıyla da karakteristik bir görünüme sahiptir. OSSA Kuruyemiş'te geleneksel yöntemle hazırlanan sade lokum, klasik Türk lokum kültürünü olduğu gibi deneyimlemek isteyenlere sunulur.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "susamli-lokum": {
    description:
      "Susamlı lokum, geleneksel lokum hamurunun susam ile kaplandığı veya karıştırıldığı bir çeşittir. Susamın çıtır dokusuyla lokumun yumuşaklığını bir araya getiren bu ürün, klasik sade lokumdan farklı bir doku deneyimi sunar. Kavrulmuş susamın karakteristik aroması, lokumun tatlılığıyla dengelenerek zengin bir tat profili oluşturur. Çay yanında veya ikramlık olarak tüketilen susamlı lokum, misafir sofralarında ve özel günlerde tercih edilir. Susamın besin değeriyle de bilinen bu ürün, klasik lokum çeşitlerine farklı bir doku katmak isteyen tatlı severler için ilgi çekicidir. Hediyelik paketlerde de değerlendirilebilen susamlı lokum, geleneksel Türk lokum kültürünün çıtır dokulu bir temsilcisi olarak OSSA Kuruyemiş'te özenle hazırlanır.",
    usageSuggestion: "Çay yanında veya ikramlık olarak tüketilebilir.",
    storageConditions: STORAGE_CONFECTIONERY,
  },
  "yas-hurma": {
    description:
      "Yaş hurma, henüz tam kurutulmamış, yumuşak ve sulu dokusuyla bilinen bir hurma çeşididir. Kuru hurmaya kıyasla daha yüksek nem oranına sahip olan bu ürün, daha yumuşak bir çiğneme hissi ve daha taze bir tat profili sunar. Doğal tatlılığıyla tek başına atıştırmalık olarak tüketilen yaş hurma, ramazan aylarında iftar sofralarında da tercih edilir. Nem oranının yüksek olması nedeniyle kuru hurmaya göre daha kısa raf ömrüne sahip olan bu ürün, serin ortamda ve tercihen buzdolabında saklanmasıyla tazeliğini daha uzun süre koruyabilir. Taze hurma deneyimi arayan ve kuru hurmadan farklı bir doku tercih eden tüketiciler için ilgi çekici bir seçenek olan yaş hurma, hurma çeşitliliğini genişletmek isteyenlere hitap eder. OSSA Kuruyemiş'te özenle seçilen yaş hurma, taze ve yumuşak bir hurma deneyimi arayanlara sunulur.",
    ingredients: "Hurma (%100).",
    usageSuggestion: "Günlük atıştırmalık olarak tüketilebilir.",
    storageConditions:
      "Serin ve kuru bir ortamda saklayınız; yaş hurmanın nem oranı yüksek olduğundan buzdolabında saklanması tazeliğinin korunmasına yardımcı olabilir.",
    nutrition: {
      energyKcal: 277,
      carbohydrate: 75,
      fiber: 6.7,
      protein: 2,
      sourceName: USDA,
      sourceUrl: "https://fdc.nal.usda.gov/food-details/168191/nutrients",
      sourceProduct: "Dates, Medjool (yaklaşık referans — yaş hurma nem oranı daha yüksek olabilir)",
      referenceType: "REFERENCE_AVERAGE",
      confidence: "MEDIUM",
    },
  },
};
