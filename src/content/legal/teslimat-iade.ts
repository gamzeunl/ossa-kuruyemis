import type { LegalPageContent } from "@/lib/legal-content";

/**
 * `/kargo-ve-teslimat` (`shipping.ts`) ve `/iade-ve-degisim` (`returns.ts`)
 * sayfalarının BİRLEŞTİRİLMİŞ hâli — içerik UYDURULMADI, iki dosyanın mevcut,
 * doğrulanmış cümleleri yeniden gruplandı. Eski iki route `next.config.ts`
 * `redirects()` ile buraya yönlendirilir. Kesin bir kargo firması/teslimat
 * süresi/iade süresi (`docs/OPEN_QUESTIONS.md` #8, #11, #19) henüz
 * belirlenmediğinden gün sayısı, marka adı veya kesin iade adresi verilmez.
 */
export const teslimatIadeContent: LegalPageContent = {
  path: "/teslimat-iade",
  title: "Teslimat ve İade Koşulları",
  seoTitle: "Teslimat ve İade Koşulları | OSSA Kuruyemiş",
  description:
    "Siparişlerinizin hazırlanması, kargoya verilmesi, teslim alınması ve iade/değişim sürecine dair genel bilgiler.",
  notice:
    "Bu metin, işletmenin satış ve lojistik prosedürleri kesinleştirildikten sonra hukuki inceleme ile son haline getirilmelidir. Aşağıdaki bilgiler genel bir çerçeve sunar; kesin teslimat/iade süreleri ve kargo firması netleştiğinde bu sayfa güncellenecektir.",
  sections: [
    {
      heading: "Teslimat",
      paragraphs: [
        "Siparişiniz onaylandıktan sonra hazırlık sürecine alınır. Ürünler kontrol edilerek özenle paketlenir ve kargoya teslim edilmek üzere hazırlanır. Kesin bir teslimat süresi şu an için taahhüt edilmemektedir; teslimat süresi adresinize, kargo yoğunluğuna ve aşağıda belirtilen etkenlere göre değişebilir.",
      ],
    },
    {
      heading: "Sipariş Hazırlama",
      paragraphs: [
        "Siparişinizi oluştururken teslimat adresinizi eksiksiz ve güncel şekilde girmeniz, teslimatın sorunsuz tamamlanması açısından önemlidir. Adres bilgilerindeki eksiklik veya hata, teslimat sürecini uzatabilir.",
      ],
    },
    {
      heading: "Kargo",
      paragraphs: [
        "Siparişiniz kargoya verildiğinde, mevcut olması durumunda kargo takip bilgisi sizinle paylaşılabilir. Resmî tatiller, yoğun kampanya dönemleri ve kargo firmalarının kendi yoğunlukları teslimat sürecini etkileyebilir.",
      ],
    },
    {
      heading: "Teslimat Kontrolü",
      paragraphs: ["Paketinizi teslim alırken dış ambalajın sağlam olup olmadığını kontrol etmenizi öneririz."],
      list: [
        "Paket hasarlı görünüyorsa, mümkünse kargo görevlisi yanındayken durumu kontrol edin ve tutanak tutulmasını talep edin.",
        "Hasar tespit ederseniz, teslim almadan önce veya hemen sonra bizimle iletişime geçerek durumu bildirin.",
      ],
    },
    {
      heading: "Cayma / İade Talebi",
      paragraphs: [
        "Cayma hakkının kapsamı ve süresi için Mesafeli Satış Sözleşmesi sayfamıza bakabilirsiniz. İade veya değişim talebiniz için sipariş bilginizle birlikte iletişim kanallarımızdan bize ulaşabilirsiniz; talebiniz değerlendirildikten sonra sizinle iletişime geçilir.",
      ],
    },
    {
      heading: "İade Süreci",
      paragraphs: [
        "İade edilecek ürünün kullanılmamış, orijinal ambalajı bozulmamış ve yeniden satışa uygun durumda olması genel olarak beklenir. Ürünle ilgili bir sorun fark ettiğinizde, ürünü kullanmadan önce durumu bize bildirmeniz sürecin sağlıklı ilerlemesine yardımcı olur.",
      ],
    },
    {
      heading: "İade Edilemeyebilecek Ürünler",
      paragraphs: [
        "Kuruyemiş, lokum, çay/kahve ve benzeri gıda ürünlerinde; hijyen, ambalajın açılmış olması ve ilgili mevzuattan kaynaklanan iade istisnaları bulunabilir. Bu istisnaların kesin kapsamı, geçerli tüketici mevzuatına göre netleştirilecektir.",
      ],
    },
    {
      heading: "Hasarlı / Hatalı Ürün",
      paragraphs: [
        "Siparişinizde yanlış ya da hasarlı bir ürün teslim aldıysanız, mümkün olan en kısa sürede bizimle iletişime geçmenizi rica ederiz; bu durumlar öncelikli olarak değerlendirilir.",
      ],
    },
    {
      heading: "İletişim",
      paragraphs: [
        "Teslimat veya iade ile ilgili her türlü sorunuz için İletişim sayfamızdaki kanallardan (telefon, WhatsApp veya iletişim formu) bize ulaşabilirsiniz.",
      ],
    },
  ],
};
