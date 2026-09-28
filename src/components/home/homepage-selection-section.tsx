import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { formatPrice } from "@/lib/format-money";
import type { HomepageSelectionDisplay } from "@/server/services/homepage-service";

/**
 * "OSSA'dan Seçtiklerimiz" — `EditorialBannerSection`'ın asimetrik/sıcak/
 * whitespace-bol dilini temel alır, ama sağ tarafta CTA yerine admin'in
 * seçtiği (maks. 3-4) ürünün ince, editoryal bir listesi olur. Kaba bir
 * kart/dashboard grid'i DEĞİL — her ürün satırı sade bir ayraçla ayrılır,
 * fiyat her zaman `ProductSummary.minPrice`'tan (gerçek `ProductVariant`
 * verisi) gelir, burada asla ayrı bir fiyat üretilmez.
 *
 * `selection` `null` ise (admin pasif bıraktıysa veya hiç ürün seçilmediyse)
 * bölüm hiç render edilmez — sahte/boş bir bölüm asla gösterilmez.
 */
export function HomepageSelectionSection({ selection }: { selection: HomepageSelectionDisplay | null }) {
  if (!selection) {
    return null;
  }

  return (
    <section aria-label={selection.title} className={`bg-surface ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <div className="border-border-muted bg-cream grid grid-cols-1 items-stretch gap-0 overflow-hidden rounded-3xl border lg:grid-cols-[1.15fr_0.85fr]">
          <ScrollReveal className="relative h-[280px] w-full overflow-hidden sm:h-[360px] lg:h-auto lg:min-h-[420px]">
            <ProductImage
              src={selection.imageUrl}
              alt={selection.imageAlt ?? selection.title}
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </ScrollReveal>

          <ScrollReveal className="flex flex-col gap-6 p-8 sm:p-10 lg:p-12">
            <div className="flex flex-col items-start gap-3">
              {selection.eyebrow ? (
                <span className="bg-brand/10 text-brand-dark w-fit rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase">
                  {selection.eyebrow}
                </span>
              ) : null}
              <h2 className="text-foreground max-w-md text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
                {selection.title}
              </h2>
              {selection.description ? (
                <p className="text-foreground/70 max-w-sm text-sm leading-6 sm:text-base">
                  {selection.description}
                </p>
              ) : null}
            </div>

            <div className="divide-border-muted/70 flex flex-col divide-y">
              {selection.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/urunler/${product.slug}`}
                  className="group flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="bg-surface-muted relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage
                      src={product.primaryImage?.url ?? null}
                      alt={product.primaryImage?.altText ?? product.name}
                      sizes="56px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span className="text-foreground group-hover:text-brand-dark flex-1 text-sm font-semibold transition-colors">
                    {product.name}
                  </span>
                  {product.minPrice ? (
                    <span className="text-foreground/60 text-sm font-medium tabular-nums">
                      {formatPrice(product.minPrice)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>

            <Link
              href={selection.ctaHref}
              className="bg-brand hover:bg-brand-dark text-brand-foreground mt-1 inline-flex w-fit min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold shadow-sm transition-colors"
            >
              {selection.ctaLabel}
            </Link>
          </ScrollReveal>
        </div>
      </HomeContainer>
    </section>
  );
}
