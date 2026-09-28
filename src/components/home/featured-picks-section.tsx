import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { ProductListCard } from "@/components/catalog/product-list-card";
import type { ProductSummary } from "@/types/catalog";

const HEADING_ID = "ayin-favorileri-baslik";

interface FeaturedPicksSectionProps {
  products: ProductSummary[];
  favoritedProductIds?: ReadonlySet<string>;
  isLoggedIn?: boolean;
}

/**
 * "Ayın Favorileri" — admin küratörlü `FeaturedProductPick` verisinden, sahte
 * ürün YOK. TÜM ürünler AYNI standart `ProductListCard` ile, `ProductShelf`
 * ile birebir aynı responsive grid'de (2/3/4 kolon) gösterilir — ilk ürüne
 * özel "hero/büyük" davranış YOK, ikinci bir kart sistemi OLUŞTURULMAZ. Hiç
 * aktif kayıt yoksa bölüm tamamen gizlenir.
 */
export function FeaturedPicksSection({ products, favoritedProductIds, isLoggedIn = false }: FeaturedPicksSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={HEADING_ID} className={`bg-cream ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId={HEADING_ID}
          eyebrow="OSSA Seçkisi"
          title="Ayın Favorileri"
          subtitle="Bu ay öne çıkardığımız lezzetleri keşfedin."
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <ScrollReveal key={product.id} delayMs={index * 60}>
              <ProductListCard
                product={product}
                isFavorited={favoritedProductIds?.has(product.id) ?? false}
                isLoggedIn={isLoggedIn}
              />
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
