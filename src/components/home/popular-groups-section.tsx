import Link from "next/link";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { PopularGroupCard } from "@/components/home/popular-group-card";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import type { HomePopularGroupCard } from "@/server/services/homepage-service";

const HEADING_ID = "populer-secimler-baslik";

/**
 * `groups` `page.tsx`'te tek seferde hazırlanmış (bkz. `getHomePageData`) — burada ek ürün sorgusu YOK.
 * Sabit 4x2 grid (8 grup) — `PopularGroupCard` (yatay 4:3 görsel + kategori meta) `CategoryCard`'dan
 * (Ana Kategoriler, tam kaplayan overlay) bilinçli olarak farklı tasarımdadır.
 */
export function PopularGroupsSection({ groups }: { groups: HomePopularGroupCard[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={HEADING_ID} className={`bg-background ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId={HEADING_ID}
          eyebrow="Popüler"
          title="Popüler Seçimler"
          subtitle="En çok aranan ürün gruplarına hızlıca göz atın."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {groups.map((group, index) => (
            <ScrollReveal key={group.key} delayMs={index * 50}>
              <PopularGroupCard
                href={group.href}
                label={group.label}
                categoryName={group.categoryName}
                imageUrl={group.image?.url ?? null}
              />
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/urunler"
            className="text-brand hover:text-brand-dark group/link inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            Tüm Kategorileri Gör
            <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </HomeContainer>
    </section>
  );
}
