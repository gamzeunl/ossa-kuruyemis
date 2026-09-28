import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { PopularGroupCard } from "@/components/home/popular-group-card";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import type { HomePopularGroupCard } from "@/server/services/homepage-service";

interface DiscoveryLinksSectionProps {
  headingId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: HomePopularGroupCard[];
  toneClassName?: string;
  /** "featured": ilk öğe büyük/asimetrik bir keşif alanı, geri kalanı küçük
   * (ör. "Kahve Yanına Ne Gider?" — tek büyük eşleşme + küçük seçenekler hissi).
   * "compact": tüm öğeler eşit boyutlu, sık aralıklı bir ızgara — hızlı kategori
   * keşfi hissi (ör. "Çerez Sofrasını Tamamla"). İkisi de AYNI `PopularGroupCard`'ı
   * kullanır, yalnızca ızgara/boyut düzeni değişir. */
  layout?: "featured" | "compact";
}

/**
 * Küçük "nereye bakacağım?" keşif blokları ("Kahve Yanına Ne Gider?",
 * "Çerez Sofrasını Tamamla") — MEVCUT `PopularGroupCard` kartını yeniden
 * kullanır (ikinci bir kart tasarımı İCAT EDİLMEZ), yalnızca gerçek
 * kategori/grup route'larına link verir. Yeni ürün/fiyat verisi YOK.
 * `items` boşsa (beklenmez, ama veri bütünlüğü garanti değilse) bölüm gizlenir.
 */
export function DiscoveryLinksSection({
  headingId,
  eyebrow,
  title,
  subtitle,
  items,
  toneClassName = "bg-background",
  layout = "compact",
}: DiscoveryLinksSectionProps) {
  if (items.length === 0) {
    return null;
  }

  const isFeatured = layout === "featured";

  return (
    <section aria-labelledby={headingId} className={`${toneClassName} ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader headingId={headingId} eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div
          className={
            isFeatured
              ? "grid grid-cols-2 gap-4 sm:grid-cols-4"
              : "grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6"
          }
        >
          {items.map((item, index) => (
            <ScrollReveal
              key={item.key}
              delayMs={index * 50}
              className={isFeatured && index === 0 ? "col-span-2" : ""}
            >
              <PopularGroupCard
                href={item.href}
                label={item.label}
                categoryName={item.categoryName}
                imageUrl={item.image?.url ?? null}
              />
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
