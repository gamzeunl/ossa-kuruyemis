import { businessLegalInfo } from "@/lib/business-info";
import type { LegalPageContent } from "@/lib/legal-content";

/**
 * Satıcı bilgisi `businessLegalInfo`'dan (bkz. src/lib/business-info.ts)
 * gelir — yalnızca doğrulanmış alanlar yazılır, e-posta henüz doğrulanmadığından
 * hiç eklenmez. "Ek Masraflar" bölümü gerçek kargo eşiği/ücretini sayfa
 * wrapper'ında (`app/on-bilgilendirme-formu/page.tsx`) `getShippingSettings()`
 * ile dinamik olarak alır (bkz. kargo-ve-teslimat sayfasındaki AYNI desen).
 */
export const preInformationContent: LegalPageContent = {
  path: "/on-bilgilendirme-formu",
  title: "Ön Bilgilendirme Formu",
  seoTitle: "Ön Bilgilendirme Formu | OSSA Kuruyemiş",
  description:
    "Mesafeli satış öncesi tüketiciye sunulması gereken ön bilgilendirme başlıklarının genel, statik örneği.",
  notice:
    "Bu sayfa, sipariş öncesi tüketiciye sunulması gereken ön bilgilendirme formunun genel bilgilendirme amaçlı, statik bir örneğidir. Ürün, adet ve toplam tutar bilgileri siparişinize özel olarak ödeme sayfasındaki Sipariş Özeti'nde ayrıca gösterilir.",
  sections: [
    {
      heading: "Satıcı",
      paragraphs: [
        `${businessLegalInfo.displayName} (${businessLegalInfo.proprietorName})`,
        `Adres: ${businessLegalInfo.address}`,
        `Telefon: ${businessLegalInfo.phone}`,
      ],
    },
    {
      heading: "Ürün",
      paragraphs: [
        "Sipariş konusu ürün(ler)in temel özellikleri, adedi ve varyantı (ör. gramaj), ödeme sayfasındaki Sipariş Özeti'nde sipariş onayından önce gösterilir.",
      ],
    },
    {
      heading: "Toplam Bedel",
      paragraphs: ["Ürün bedelleri toplamı, sipariş onayından önce açıkça gösterilir."],
    },
    {
      heading: "Ek Masraflar",
      paragraphs: [
        "Varsa kargo ücreti ve diğer ek masraflar, sipariş onayından önce ayrıca belirtilir.",
      ],
    },
    {
      heading: "Ödeme",
      paragraphs: [
        "Ödeme yöntemi ve ödeme hizmeti sağlayıcısı, canlı ödeme altyapısı devreye alındığında burada belirtilecektir. Kart bilgileri hiçbir zaman OSSA Kuruyemiş tarafından saklanmaz.",
      ],
    },
    {
      heading: "Teslimat",
      paragraphs: [
        "Teslimat süreci ve genel esaslar için Teslimat ve İade sayfamıza bakabilirsiniz.",
      ],
    },
    {
      heading: "Cayma ve İade",
      paragraphs: [
        "Cayma hakkı ve iade koşulları için Teslimat ve İade sayfamıza bakabilirsiniz. Kesin bir iade süresi bu formda taahhüt edilmemektedir.",
      ],
    },
    {
      heading: "Başvuru ve Şikâyet",
      paragraphs: [
        "Sorularınız ve şikâyetleriniz için şu an genel iletişim kanalımızı kullanabilirsiniz. Resmî başvuru mercileri (Tüketici Hakem Heyetleri/Mahkemeleri gibi) netleştiğinde bu bölüm güncellenecektir.",
      ],
    },
  ],
};
