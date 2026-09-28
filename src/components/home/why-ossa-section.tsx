import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { BagIcon, LeafIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { FREE_SHIPPING_THRESHOLD_TRY } from "@/lib/checkout-shipping";

const HEADING_ID = "neden-ossa-baslik";

const freeShippingAmount = new Intl.NumberFormat("tr-TR").format(FREE_SHIPPING_THRESHOLD_TRY);

const features = [
  {
    icon: BagIcon,
    title: "Özenli Paketleme",
    text: "Ürünler siparişe hazırlanırken koruyucu ve düzenli paketleme yaklaşımıyla hazırlanır.",
  },
  {
    icon: ShieldIcon,
    title: "Güvenli Ödeme",
    text: "Ödeme adımları güvenli altyapı üzerinden gerçekleştirilir.",
  },
  {
    icon: LeafIcon,
    title: "Taze Ürün Garantisi",
    text: "Ürün deneyiminde tazeliği korumaya odaklanan paketleme ve gönderim yaklaşımı.",
  },
  {
    icon: TruckIcon,
    title: `₺${freeShippingAmount} Üzeri Ücretsiz Kargo`,
    text: `₺${freeShippingAmount} ve üzeri siparişlerde kargo ücreti alınmaz.`,
  },
];

/**
 * 4 avantaj arasındaki ince ayraç sınıfını konuma göre üretir — 4 KART yerine
 * TEK geniş çerçeveli alan + ince dikey/yatay ayraçlar: mobilde dikey liste
 * (yatay ayraç), tablette 2x2 (çapraz ayraç), masaüstünde tek satır (dikey
 * ayraç). Ayraç rengi çok hafif marka sarısı (`border-brand/15`) — "ince detay"
 * kullanımı, büyük bir sarı yüzey OLUŞTURULMAZ.
 */
function getDividerClassName(index: number): string {
  if (index === 0) {
    return "";
  }
  if (index === 1) {
    return "border-brand/15 border-t sm:border-t-0 sm:border-l";
  }
  if (index === 2) {
    return "border-brand/15 border-t lg:border-t-0 lg:border-l";
  }
  return "border-brand/15 border-t sm:border-l lg:border-t-0";
}

/**
 * "Neden OSSA" — 4 ayrı kart YERİNE tek geniş, ince çerçeveli yatay alan;
 * avantajlar kart değil, ince ayraçlarla bölünmüş kolonlar/satırlar olarak
 * sunulur (masaüstü: 4 kolon, tablet: 2x2, mobil: dikey liste). Sade çizgi
 * ikonlar (arka plan/daire YOK), bol whitespace. Sarı yalnızca ikon ve ince
 * ayraç detaylarında kullanılır. Kargo eşiği TEK kaynaktan
 * (`FREE_SHIPPING_THRESHOLD_TRY`) gelir, hardcode YOK.
 */
export function WhyOssaSection() {
  return (
    <section aria-labelledby={HEADING_ID} className={`bg-surface-muted ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId={HEADING_ID}
          eyebrow="Alışveriş Deneyimi"
          title="Neden OSSA?"
          subtitle="Alışveriş deneyimini daha sade, güvenli ve keyifli hale getiren detaylar."
        />

        <div className="border-border-muted bg-surface flex flex-col overflow-hidden rounded-3xl border sm:grid sm:grid-cols-2 lg:flex lg:flex-row">
          {features.map((feature, index) => (
            <ScrollReveal
              key={feature.title}
              delayMs={index * 70}
              className={`flex-1 ${getDividerClassName(index)}`}
            >
              <div className="hover:bg-cream/60 flex h-full flex-col gap-3 p-6 transition-colors duration-300 sm:p-7 lg:p-8">
                <feature.icon aria-hidden="true" className="text-brand h-6 w-6 shrink-0" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-foreground text-base font-bold">{feature.title}</h3>
                  <p className="text-foreground/70 text-sm leading-6">{feature.text}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
