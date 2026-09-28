import type { CategoryFaqItem } from "@/lib/category-content";
import { getDeliveryInformationText } from "@/lib/delivery-info";
import { formatPrice } from "@/lib/format-money";
import { getShippingSettings } from "@/server/services/site-setting-service";

export interface SiteFaqTopic {
  topic: string;
  items: CategoryFaqItem[];
}

/**
 * `/sss` sayfasının içeriği — kargo eşiği/ücreti `getShippingSettings()`
 * (TEK kaynak: `@/lib/checkout-shipping`), teslimat süresi metni
 * `getDeliveryInformationText()`'ten reuse edilir; hiçbir tutar/gün sayısı
 * burada ayrıca hardcode edilmez. İade politikası ve toplu sipariş cevapları
 * gerçek mevcut sayfalara yönlendirir, projede tanımlı olmayan hukuki/operasyonel
 * ayrıntı uydurulmaz.
 */
export async function getSiteFaqTopics(): Promise<SiteFaqTopic[]> {
  const { freeShippingThreshold } = await getShippingSettings();
  const thresholdText = formatPrice(String(freeShippingThreshold));

  return [
    {
      topic: "Sipariş",
      items: [
        {
          question: "Siparişimi nasıl oluşturabilirim?",
          answer:
            "Ürünleri sepetinize ekledikten sonra ödeme adımında iletişim ve teslimat bilgilerinizi girerek siparişinizi oluşturabilirsiniz. Sipariş oluşturulduğunda size özel bir sipariş numarası verilir.",
        },
        {
          question: "Sipariş durumumu nasıl takip edebilirim?",
          answer:
            "Hesabınız varsa Hesabım > Siparişlerim bölümünden, hesabınız yoksa /siparis-takibi sayfasından sipariş numaranız ve e-posta/telefon bilginizle sipariş durumunuzu görüntüleyebilirsiniz.",
        },
        {
          question: "Siparişimi iptal edebilir miyim?",
          answer:
            "Sipariş durumuna bağlı olarak iptal talebiniz değerlendirilir. İptal talebiniz için bizimle iletişime geçmeniz yeterlidir.",
        },
      ],
    },
    {
      topic: "Ödeme",
      items: [
        {
          question: "Hangi ödeme yöntemlerini kullanabilirim?",
          answer:
            "Online ödeme altyapımız yakında aktif olacaktır. Şu anda oluşturduğunuz sipariş bir talep olarak alınır; güncel ödeme yöntemleriyle ilgili bilgi almak için bizimle iletişime geçebilirsiniz.",
        },
        {
          question: "Ödeme bilgilerim güvende mi?",
          answer:
            "Kart bilgileriniz hiçbir şekilde sistemimizde saklanmaz. Online ödeme aktif olduğunda tüm işlemler güvenli, lisanslı bir ödeme altyapısı üzerinden gerçekleştirilecektir.",
        },
      ],
    },
    {
      topic: "Kargo",
      items: [
        {
          question: `Ücretsiz kargo için minimum tutar nedir?`,
          answer: `${thresholdText} ve üzeri siparişlerinizde kargo ücretsizdir.`,
        },
        {
          question: "Siparişim ne zaman elime ulaşır?",
          answer: getDeliveryInformationText(),
        },
        {
          question: "Kargom nasıl paketleniyor?",
          answer:
            "Ürünleriniz taşıma sırasında korunmasına yardımcı olacak şekilde özenle paketlenir ve anlaşmalı kargo firmamıza teslim edilir.",
        },
      ],
    },
    {
      topic: "Ürünler",
      items: [
        {
          question: "Ürünler ne kadar taze?",
          answer:
            "Seçtiğimiz her ürün, kalite ve tazelik standartlarımızdan geçer; siparişiniz oluşturulduktan sonra özenle paketlenerek adresinize ulaştırılır.",
        },
        {
          question: "İçindekiler ve alerjen bilgisine nereden ulaşabilirim?",
          answer:
            "Her ürünün detay sayfasında, mevcutsa 'İçindekiler' ve 'Saklama Koşulları' bölümlerinden ürüne özel bilgilere ulaşabilirsiniz.",
        },
      ],
    },
    {
      topic: "İade / Değişim",
      items: [
        {
          question: "Ürünümü iade edebilir veya değiştirebilir miyim?",
          answer:
            "İade ve değişim koşullarımızın tamamını Teslimat ve İade Koşulları sayfamızda bulabilirsiniz. Herhangi bir sorunuz için bizimle doğrudan iletişime geçebilirsiniz.",
        },
      ],
    },
    {
      topic: "Toplu Sipariş",
      items: [
        {
          question: "Kurumsal veya toplu sipariş verebilir miyim?",
          answer:
            "Kına/düğün çerezleri, nişan-davet veya kurumsal toplu siparişleriniz için İletişim sayfamızdaki formu 'Kurumsal Toplu Sipariş' talep türüyle doldurabilir ya da WhatsApp üzerinden bize ulaşabilirsiniz.",
        },
      ],
    },
  ];
}
