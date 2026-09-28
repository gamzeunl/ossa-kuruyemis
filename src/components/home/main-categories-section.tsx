import { CategoryCard } from "@/components/home/category-card";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { getCategoryHref } from "@/lib/category-routes";
import type { CategorySummary } from "@/types/catalog";

const HEADING_ID = "ana-kategoriler-baslik";

/** `categories` çağıran tarafta (`page.tsx`) zaten filtrelenmiş — burada ek sorgu/işlem YAPILMAZ. */
export function MainCategoriesSection({ categories }: { categories: CategorySummary[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section id="ana-kategoriler" aria-labelledby={HEADING_ID} className={`bg-background ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId={HEADING_ID}
          eyebrow="Kategoriler"
          title="Lezzet Kategorilerini Keşfedin"
          subtitle="Aradığınız ürünlere kategoriler üzerinden kolayca ulaşın."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => (
            <ScrollReveal key={category.id} delayMs={index * 60}>
              <CategoryCard
                href={getCategoryHref(category.slug)}
                name={category.name}
                imageUrl={category.imageUrl}
                imageAlt={category.imageAlt}
              />
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
