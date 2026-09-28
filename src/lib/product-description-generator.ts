/**
 * Seed/backfill için kategoriye özel, ürün adına göre deterministik olarak
 * seçilen ürün açıklaması üretir. Rastgelelik İÇERMEZ — aynı ürün adı her
 * zaman aynı metni üretir, bu yüzden `prisma/seed.ts` güvenle tekrar tekrar
 * çalıştırılabilir. Doğrulanamayan özellikler (kavrulmuş/çiğ/tuzlu vb.)
 * iddia edilmez; ürün adında AÇIKÇA geçen gerçek bilgiler (ör. "Çiğ ...")
 * dışında nötr, kategoriye uygun dil kullanılır. Sağlık/tedavi iddiası yok.
 * Hedef uzunluk: ~120-220 kelime (2 kategoriye özel paragraf + 1 kapanış).
 */

type ParagraphPair = (name: string) => [string, string];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[seed % items.length];
}

const CLOSING_PARAGRAPHS: readonly string[] = [
  "OSSA Kuruyemiş'te her ürün, raflara çıkmadan önce özenle seçilir ve uygun koşullarda saklanır. Siparişiniz, tazeliğini korumaya yardımcı olacak şekilde itina ile paketlenir ve bu haliyle adresinize ulaştırılır. Kalite kontrolünden geçen her parti, aynı standardı korumayı amaçlar; hem hammadde seçiminde hem depolama koşullarında bu titizlik sürdürülür. Böylece siparişiniz açıldığında raftaki hâliyle aynı kaliteyi bulursunuz.",
  "Seçkimize giren her ürün, kalite ve tazelik standartlarımızdan geçer. OSSA güvencesiyle hazırlanan bu ürün, özenli paketleme ile adresinize kadar bu kalitesini korur. Sipariş sürecinin her adımında tazelik ve hijyen önceliğimizdir; depolamadan kargoya kadar bu standart korunur. Müşterilerimize her seferinde aynı güveni sunmayı amaçlıyoruz.",
  "Bu ürünü seçerken kalite ve tazelik önceliğimiz oldu. OSSA Kuruyemiş, ürünlerini uygun koşullarda saklayarak ve özenle paketleyerek müşterisine ulaştırmayı ilke edinir. Böylece raftaki halinden farksız bir ürün sofranıza gelir; ambalajından çıktığı andaki tazelik hissini korumayı hedefleriz. Bu yaklaşım, seçkimizdeki tüm ürünler için geçerli ortak bir standarttır.",
  "OSSA Kuruyemiş güvencesiyle sunulan bu ürün, özenli bir seçim ve saklama sürecinden geçer. Siparişiniz size ulaşana kadar tazeliğini koruyacak şekilde paketlenir. Bu titizlik, her siparişte aynı memnuniyeti hedefler; ürün seçiminden kargoya teslime kadar her aşama bu anlayışla yürütülür. Sofranıza güvenilir bir lezzet sunmak temel önceliğimizdir.",
];

function rawNote(name: string): string {
  return name.toLocaleLowerCase("tr-TR").startsWith("çiğ")
    ? " Kavrulma işlemine tabi tutulmadan, doğal haliyle sunulur."
    : "";
}

const CEREZ_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in özenle seçilmiş çerez raflarında yerini alır. Karakteristik aroması ve dokusuyla ilk lokmadan itibaren fark edilen bu ürün, kaliteli hammaddenin özenli bir ayıklama sürecinden geçmesiyle sofralara ulaşır.${rawNote(name)} Seçim aşamasında tane büyüklüğü ve görünüm de dikkate alınan kriterler arasındadır; kırık veya kusurlu taneler daha ambalajlama öncesinde ayıklanır.`,
    `Gün içinde pratik bir atıştırmalık arayanlar için uygun olan ${name}, tek başına tüketilebileceği gibi kuruyemiş karışımlarına da güzel bir katkı sağlar. Ofis molalarında, yolculukta ya da misafir ikramında rahatlıkla sofranızda yer bulur. Küçük porsiyonlar hâlinde tüketilmesi, tazeliğinin daha uzun süre korunmasına da yardımcı olur; açılan ambalajın sıkıca kapatılması bu açıdan önemlidir.`,
  ],
  (name) => [
    `Kuruyemiş seçkimizin dikkat çeken isimlerinden biri olan ${name}, dokusu ve aromasıyla klasik çerez keyfini arayanlara hitap eder.${rawNote(name)} OSSA'nın seçim sürecinde kalite her zaman ilk kriterdir; bu nedenle raflara çıkan her parti tane bazında gözden geçirilir ve görsel bütünlüğü bozan taneler ayrılır.`,
    `${name}, hem tek başına atıştırmalık olarak hem de kuruyemiş tabaklarında diğer çeşitlerle bir arada güzel durur. Televizyon karşısında, ev sohbetlerinde veya iş molalarında keyifle tüketilebilecek bir seçenektir. Misafir ağırlarken sunum tabaklarında da şık bir görünüm sağlar; farklı çerez çeşitleriyle bir arada sunulduğunda çeşitliliği artırır.`,
  ],
  (name) => [
    `${name} seçiminde OSSA Kuruyemiş, dokusu ve aroması dengeli ürünleri raflarına taşımayı ilke edinir.${rawNote(name)} Bu özenli seçim, ürünün her paketinde aynı kaliteyi hissettirmeyi amaçlar ve tüketiciye tutarlı bir deneyim sunar; tedarik sürecinde kalite kriterlerinden ödün verilmez.`,
    `Atıştırmalık olarak tek başına tüketilebilen ${name}, kuruyemiş karışımlarında da tamamlayıcı bir lezzet sunar. Günün her saatinde, evde veya dışarıda pratik bir seçenek olarak öne çıkar. Uygun boyutlu ambalajı sayesinde çantada taşınması da kolaydır; okul veya iş çıkışı atıştırmalık olarak da tercih edilebilir.`,
  ],
];

const LOKUM_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, geleneksel Türk lokumu ustalığını OSSA Kuruyemiş kalitesiyle bir araya getirir. Yumuşak dokusu ve dengeli tatlılığıyla her lokmada bu geleneğin izlerini taşır. Kesim ve şekillendirme aşamalarında görsel bütünlüğe de özen gösterilir; her parça, servise hazır bir görünümle ambalajlanır.`,
    `Çay veya Türk kahvesi eşliğinde ikram edilmeye çok uygun olan ${name}, misafir sofralarında olduğu kadar günlük tatlı ihtiyacında da tercih edilir. Özel günlerde hediyelik bir seçenek olarak da değerlendirilebilir; şık ambalajıyla ikram sofralarında dikkat çeker ve sohbetin tatlı bir eşlikçisi olur.`,
  ],
  (name) => [
    `OSSA'nın lokum seçkisinde yer alan ${name}, yumuşak ve elastik dokusuyla geleneksel lokum keyfini yansıtır. Aroması, ilk ısırıkta kendini belli eder ve damakta uzun süre kalıcı bir tat bırakır; bu denge, hazırlık sürecindeki özenden gelir.`,
    `${name}, özellikle çay saatlerinde ve kahve sohbetlerinde tercih edilen bir tatlıdır. İkram tabaklarında şık bir görünüm sunarken, günlük küçük tatlı molalarında da rahatlıkla yerini alır. Kutu ambalajı, hediyelik kullanım için de pratik bir seçenek sağlar ve taşıma sırasında ürünü korur.`,
  ],
  (name) => [
    `${name}, Türk lokumunun karakteristik yumuşaklığını ve tatlı dengesini bir arada sunar. OSSA Kuruyemiş güvencesiyle hazırlanan bu ürün, geleneksel tarifin izinden gider ve otantik lezzet arayışına yanıt verir; kıvamı ve tatlılık düzeyi bu dengeyi yansıtacak şekilde ayarlanır.`,
    `Bir fincan kahve ya da sıcak çay yanında ikram edildiğinde en iyi halini gösteren ${name}, hem günlük tüketim hem de misafirlik için pratik bir tatlı seçeneğidir. Bayram ve özel gün ikramlarında da sıkça tercih edilir; ikram tabağında diğer tatlılarla birlikte de güzel durur.`,
  ],
];

const KURABIYE_SEKERLEME_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in kurabiye ve şekerleme seçkisinde tatlı bir mola arayanlara hitap eder. Dokusu ve tadı, klasik atıştırmalık beklentisini karşılayacak şekilde dengelenmiştir. Küçük parça büyüklüğü, paylaşarak tüketime de uygundur ve porsiyon kontrolünü kolaylaştırır.`,
    `Çay veya kahve eşliğinde tüketilmeye uygun olan ${name}, hem günlük tatlı ihtiyacında hem de misafir ikramında pratik bir seçenektir. Küçük bir mola anına eşlik etmesi için idealdir; iş yerinde veya evde elinizin altında bulundurabileceğiniz bir tatlıdır ve çabuk hazırlanan bir ikram seçeneği sunar.`,
  ],
  (name) => [
    `Şekerleme ve kurabiye raflarımızın dikkat çeken ürünlerinden ${name}, tadı ve dokusuyla tatlı krizlerine iyi gelen bir seçenektir. Sunumu ve ambalajı, hem kişisel tüketim hem de ikram için pratiktir ve rahatça paylaşılabilir.`,
    `${name}, kahve veya çay molalarında olduğu kadar çocuklar için de sevilen bir atıştırmalıktır. İkram tabaklarında renkli ve davetkâr bir görünüm sunar. Misafir ağırlarken sofraya küçük bir tatlı dokunuşu katmak isteyenler için uygundur; farklı şekerleme çeşitleriyle bir arada da güzel durur.`,
  ],
  (name) => [
    `${name}, OSSA'nın özenle seçtiği şekerleme çeşitleri arasında yer alır. Tadı ve dokusuyla küçük bir tatlı molasına eşlik edecek nitelikte hazırlanmıştır. Ambalaj boyutu, hem bireysel tüketime hem de ikrama uygundur ve raf ömrü boyunca tazeliğini korumaya yardımcı olur.`,
    `Günlük tüketimin yanı sıra misafir ikramında da rahatlıkla sunulabilen ${name}, çay veya kahve sohbetlerine keyifli bir eşlik sağlar. Ofis ortamlarında paylaşılan küçük bir tatlı molası için de pratik bir seçenektir ve masada uzun süre tazeliğini kaybetmeden bekleyebilir.`,
  ],
];

const KAHVE_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in kahve seçkisinde geleneksel demleme keyfini arayanlara hitap eder. Karakteristik aroması, her demlemede kendini hissettirir ve fincana döküldüğü anda fark edilir bir koku yayar; bu aroma, seçim sürecinde gözetilen önemli bir kriterdir.`,
    `İster sabah rutininin bir parçası olarak ister misafir ağırlarken, ${name} sıcak bir fincanın vazgeçilmez lezzetini sunar. Türk kahvesi geleneğine uygun şekilde demlenerek en iyi halini gösterir; ince öğütülmüş yapısı köpüklü bir pişirim için de uygundur ve fincanda uzun süre sıcaklığını korur.`,
  ],
  (name) => [
    `Kahve seçkimizde yer alan ${name}, aroması ve karakteriyle klasik bir fincan kahve keyfi arayanlar için hazırlanmıştır. Ambalajı, tazeliğini korumaya yardımcı olacak şekilde tasarlanmıştır ve açıldıktan sonra da aromasını bir süre daha koruyabilir.`,
    `${name}, günün herhangi bir saatinde bir mola anına eşlik edebilecek şekilde demlenir. Misafir ağırlarken ya da yalnız başına keyif anlarında tercih edilen bir seçenektir. Yavaş demleme, aromasının daha belirgin hissedilmesine yardımcı olur ve geleneksel fincan sunumuna uygun bir kıvam sağlar.`,
  ],
  (name) => [
    `${name}, OSSA Kuruyemiş güvencesiyle sunulan kahve çeşitleri arasında yer alır. Demlendiğinde ortaya çıkan aroması, kahve severler için tanıdık bir keyif sunar ve fincanla birlikte servis edilen lokum ya da çikolatayla iyi eşleşir.`,
    `Sabah kahvaltısında, iş molalarında veya misafir sofralarında rahatlıkla yerini bulan ${name}, geleneksel demleme yöntemleriyle en iyi sonucu verir. Ölçülü demleme, kıvamının ve aromasının dengeli çıkmasına yardımcı olur; fincana döküldüğünde üstte ince bir köpük tabakası oluşması beklenir.`,
  ],
];

const CAY_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in çay ve bitki karışımları seçkisinde demlendiğinde kendine has aromasını ortaya çıkarır. Kuru haldeyken bile hissedilen kokusu, demleme sonrası daha da belirginleşir ve fincandan yayılan buharla birlikte hissedilir.`,
    `Sıcak bir fincanda demlenerek tüketilen ${name}, günün her saatinde bir mola anına eşlik edebilir. Kış aylarında olduğu kadar misafir ikramında da tercih edilen bir seçenektir; demleme süresi, aromanın yoğunluğunu belirleyen önemli bir etkendir ve kişisel damak tadına göre ayarlanabilir.`,
  ],
  (name) => [
    `Bitki ve çay seçkimizde yer alan ${name}, demlendiğinde açığa çıkan aromasıyla sakin bir mola anı sunar. Doğal haliyle sunulan yapısı, günlük demleme alışkanlığına kolayca uyum sağlar ve her demlemede benzer bir deneyim sunmayı amaçlar.`,
    `${name}, sabah ya da akşam saatlerinde keyifle demlenebilecek bir seçenektir. Sıcak servis edildiğinde en iyi halini gösterir ve misafir sofralarında da rahatlıkla sunulabilir. İsteğe göre bal veya limonla birlikte tüketilebilir; demleme kabının kapalı tutulması aromanın kaçmasını önler.`,
  ],
  (name) => [
    `${name}, OSSA'nın özenle seçtiği çay çeşitleri arasında yer alır. Demleme sonrası ortaya çıkan aroması, sıcak bir fincanın keyfini tamamlar ve gün boyunca farklı saatlerde tekrar tekrar tercih edilebilir; kuru haldeki kokusu bile seçimin bir göstergesidir.`,
    `Günün yorgunluğunu atmak için ideal bir mola içeceği olan ${name}, hem tek başına hem de misafir ikramında tercih edilebilir. Sıcak suyla demlendikten birkaç dakika sonra servise hazır hâle gelir; demleme süresi uzatıldığında aroması daha belirgin hissedilir ve fincanda daha koyu bir renk oluşur.`,
  ],
];

const BAHARAT_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in baharat seçkisinde mutfağınıza karakteristik bir aroma katmak isteyenler için hazırlanmıştır. Kokusu, ambalaj açıldığı anda belirgin şekilde hissedilir ve tarifin genel karakterini belirleyen bir unsura dönüşür.`,
    `Et, sebze ve çorbalardan salatalara kadar birçok tarifte kullanılabilen ${name}, yemeklerinize kendine özgü kokusunu ve tadını taşır. Az miktarda kullanılması, aromasının belirginliğini korumaya yardımcı olur; pişirme sürecinin son aşamalarında eklenmesi de kokusunun daha canlı kalmasını sağlar ve tarifin lezzetini tamamlar.`,
  ],
  (name) => [
    `Mutfak raflarının vazgeçilmezlerinden ${name}, OSSA'nın özenle seçtiği baharat çeşitleri arasında yer alır. Ambalajı, aromasının uzun süre korunmasına yardımcı olacak şekilde tasarlanmıştır ve mutfak dolabında kolayca yer bulur; ölçü kaşığıyla kullanıma da uygun bir yapıdadır.`,
    `Geleneksel Türk mutfağının birçok tarifinde kullanılan ${name}, yemeklere derinlik katan bir aroma sunar. Taze öğütülmüş ya da doğal haliyle kullanılabilir; tarife göre miktarını ayarlamak, istenen aroma yoğunluğuna ulaşmayı kolaylaştırır ve farklı tariflerde denenerek keşfedilebilir.`,
  ],
  (name) => [
    `${name}, günlük mutfak kullanımı için OSSA Kuruyemiş güvencesiyle hazırlanmıştır. Kendine özgü kokusu, yemeklere eklendiği anda fark edilir ve mutfağa karakteristik bir aroma yayar; bu özellik onu birçok tarifte aranan bir malzeme yapar.`,
    `Ana yemeklerden mezelere kadar birçok tarifte kullanılabilen ${name}, mutfağınızda pratik bir baharat çözümü sunar. Kapalı ambalajda saklandığında aromasını uzun süre koruyarak her kullanımda aynı lezzeti sunmaya devam eder; küçük ambalajı mutfak dolabında az yer kaplar.`,
  ],
];

const HURMA_KURU_MEYVE_VARIANTS: readonly ParagraphPair[] = [
  (name) => [
    `${name}, OSSA Kuruyemiş'in kuru meyve seçkisinde doğal tadını ve dokusunu koruyarak sofralara ulaşır. Seçim sürecinde tane büyüklüğü ve görünüm gibi kriterler dikkate alınır; kusurlu taneler ambalajlama öncesinde ayrılır.`,
    `Tek başına atıştırmalık olarak tüketilebilen ${name}, kuruyemiş karışımlarında ve tatlı tariflerinde de güzel bir katkı sağlar. Pratik ve doyurucu bir ara öğün seçeneği arayanlar için uygundur; çantada veya masada uzun süre bekletilse de dokusunu korur ve kolayca paylaşılabilir.`,
  ],
  (name) => [
    `Kuru meyve seçkimizin dikkat çeken isimlerinden biri olan ${name}, doğal tadı ve karakteristik dokusuyla öne çıkar. İşlenmemiş, sade haliyle sunulması gerçek lezzetini korumasına yardımcı olur ve doğal görünümünü muhafaza eder; seçim aşamasında olgunluk ve doku bütünlüğü gözetilir.`,
    `${name}, gün içinde pratik bir atıştırmalık olarak tüketilebileceği gibi kahvaltı sofralarında ve tatlı tariflerinde de değerlendirilebilir. Yolculuklarda kolay taşınabilir bir seçenektir ve kuruyemişlerle birlikte tüketildiğinde lezzet dengesini tamamlar.`,
  ],
  (name) => [
    `${name}, OSSA'nın özenle seçtiği kuru meyveler arasında yer alır. Doğal tadı ve dokusu, işlem görmemiş bir lezzet arayanlara hitap eder ve her partide aynı kalite standardı gözetilir; ambalajlama öncesinde görsel kontrolden geçirilir.`,
    `Kahvaltıda, ara öğünlerde veya tatlı tariflerinde kullanılabilen ${name}, pratik ve doyurucu bir seçenek olarak sofranızda yerini alır. İster tek başına ister diğer kuru meyvelerle karıştırılarak tüketilebilir; her iki kullanımda da dokusunu korur.`,
  ],
];

interface CategoryAngle {
  matches(categorySlug: string, productName: string): boolean;
  variants: readonly ParagraphPair[];
}

const CATEGORY_ANGLES: readonly CategoryAngle[] = [
  {
    matches: (slug, name) => slug === "cay-kahve" && name.toLocaleLowerCase("tr-TR").includes("kahve"),
    variants: KAHVE_VARIANTS,
  },
  { matches: (slug) => slug === "cay-kahve", variants: CAY_VARIANTS },
  { matches: (slug) => slug === "cerez", variants: CEREZ_VARIANTS },
  { matches: (slug) => slug === "lokum", variants: LOKUM_VARIANTS },
  { matches: (slug) => slug === "kurabiye-sekerleme", variants: KURABIYE_SEKERLEME_VARIANTS },
  { matches: (slug) => slug === "baharat", variants: BAHARAT_VARIANTS },
  { matches: (slug) => slug === "hurma-kuru-meyve", variants: HURMA_KURU_MEYVE_VARIANTS },
];

/** Bilinmeyen/eşleşmeyen bir kategori slug'ı gelirse (yeni kategori vb.) kullanılan nötr yedek. */
const FALLBACK_VARIANTS: readonly ParagraphPair[] = CEREZ_VARIANTS;

export function generateProductDescription(productName: string, categorySlug: string): string {
  const angle = CATEGORY_ANGLES.find((candidate) => candidate.matches(categorySlug, productName));
  const variants = angle?.variants ?? FALLBACK_VARIANTS;

  const seed = hashString(productName);
  const [paragraph1, paragraph2] = pick(variants, seed)(productName);
  const closing = pick(CLOSING_PARAGRAPHS, hashString(`${productName}::closing`));

  return [paragraph1, paragraph2, closing].join("\n\n");
}
