import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { formatPrice } from "@/lib/format-money";
import type { BundleOfferDisplay } from "@/types/catalog";

interface BundleDiscoverySectionProps {
  offers: BundleOfferDisplay[];
}

/**
 * "Birlikte Daha Güzel" — ana sayfada TEK kompakt keşif bölümü, `ProductShelf`
 * (`ProductListCard`) KULLANMAZ — yatay, editorial bir kart tasarımıdır.
 * Burada satış yapılmaz, yalnızca ana ürünün detay sayfasına yönlendirilir
 * (satın alma orada gerçekleşir). Hiç geçerli kampanya yoksa bölüm tamamen
 * render edilmez.
 */
export function BundleDiscoverySection({ offers }: BundleDiscoverySectionProps) {
  if (offers.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="birlikte-daha-guzel" className={`bg-surface-muted ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId="birlikte-daha-guzel"
          eyebrow="Çapraz Fırsat"
          title="Birlikte Daha Güzel"
          subtitle="Birbirini tamamlayan lezzetleri özel fiyat avantajıyla keşfedin."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <ScrollReveal key={offer.id} delayMs={index * 70}>
              <Link
                href={`/urunler/${offer.primaryProductSlug}`}
                className="group border-border-muted bg-surface hover:border-brand flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="border-border-muted bg-surface-muted relative h-16 w-16 overflow-hidden rounded-xl border">
                    <ProductImage src={offer.primaryImage?.url ?? null} alt={offer.primaryProductName} sizes="64px" />
                  </div>
                  <span aria-hidden="true" className="text-foreground/30 text-lg font-bold">
                    +
                  </span>
                  <div className="border-border-muted bg-surface-muted relative h-16 w-16 overflow-hidden rounded-xl border">
                    <ProductImage
                      src={offer.companionImage?.url ?? null}
                      alt={offer.companionProductName}
                      sizes="64px"
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-foreground line-clamp-2 text-sm leading-snug font-semibold wrap-break-word">
                    {offer.primaryProductName} + {offer.companionProductName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-brand text-base font-bold">{formatPrice(offer.companionBundlePrice)}</span>
                    <span className="text-foreground/40 text-xs font-medium line-through">
                      {formatPrice(offer.companionRegularPrice)}
                    </span>
                  </div>
                  <span className="text-brand mt-1.5 inline-flex items-center gap-1 text-xs font-semibold">
                    Birlikte İncele
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
