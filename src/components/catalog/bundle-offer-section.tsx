import { AddBundleToCartButton } from "@/components/catalog/add-bundle-to-cart-button";
import { ProductImage } from "@/components/catalog/product-image";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { formatPrice } from "@/lib/format-money";
import type { BundleOfferDisplay, ProductVariantSummary } from "@/types/catalog";

interface BundleOfferSectionProps {
  offers: BundleOfferDisplay[];
  primaryProductImage: string | null;
  /** PDP'nin kendi `product.variants`'ı — her teklifin `primaryVariantId`'si buradan eşleştirilir, `BundleOfferDisplay` ana varyantın fiyatını taşımaz (bundle ana ürünün fiyatını etkilemez). */
  primaryVariants: ProductVariantSummary[];
}

interface BundleRow {
  offer: BundleOfferDisplay;
  primaryVariant: ProductVariantSummary;
}

/**
 * "Birlikte Daha Güzel" — satın alma panelinin hemen altında, en fazla 3
 * gerçekten geçerli kampanya. Premium "ürün eşleştirme" sunumu — fiyat/ürün
 * verisi tamamen `BundleOfferDisplay`/`ProductVariantSummary`'den gelir,
 * yeni bir fiyat/iş kuralı sistemi YOKTUR (yalnızca gösterim amaçlı toplam/
 * tasarruf hesabı — `bundle-offer-admin-form.tsx`'teki önizleme hesabıyla
 * AYNI yöntem). Hiç geçerli teklif yoksa (veya eşleşen ana varyant PDP'de
 * bulunamazsa) hiçbir şey render edilmez.
 */
export function BundleOfferSection({ offers, primaryProductImage, primaryVariants }: BundleOfferSectionProps) {
  const rows = offers
    .map((offer) => {
      const primaryVariant = primaryVariants.find((variant) => variant.id === offer.primaryVariantId);
      return primaryVariant ? { offer, primaryVariant } : null;
    })
    .filter((row): row is BundleRow => row !== null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      {rows.map(({ offer, primaryVariant }, index) => (
        <ScrollReveal key={offer.id} delayMs={index * 80}>
          <BundlePairingCard offer={offer} primaryVariant={primaryVariant} primaryProductImage={primaryProductImage} />
        </ScrollReveal>
      ))}
    </section>
  );
}

function BundlePairingCard({
  offer,
  primaryVariant,
  primaryProductImage,
}: BundleRow & { primaryProductImage: string | null }) {
  const primaryPrice = Number(primaryVariant.effectivePrice);
  const companionRegular = Number(offer.companionRegularPrice);
  const companionBundle = Number(offer.companionBundlePrice);
  const pricesAreValid = [primaryPrice, companionRegular, companionBundle].every(Number.isFinite);

  const totalBundlePrice = pricesAreValid ? primaryPrice + companionBundle : null;
  const totalRegularPrice = pricesAreValid ? primaryPrice + companionRegular : null;
  const hasSavings = pricesAreValid && companionRegular > 0 && companionBundle < companionRegular;
  const savingsAmount = hasSavings ? companionRegular - companionBundle : null;
  const savingsPercent = hasSavings ? Math.round((1 - companionBundle / companionRegular) * 100) : null;

  return (
    <div className="border-border-muted bg-surface overflow-hidden rounded-3xl border shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Sol — editorial alan */}
        <div className="bg-surface-muted relative flex flex-col justify-center gap-5 overflow-hidden p-6 sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="bg-gold-light/50 pointer-events-none absolute -top-12 -left-12 h-64 w-64 rounded-full blur-3xl"
          />

          <div className="relative flex flex-col gap-2.5">
            <span className="text-brand text-xs font-bold tracking-[0.16em] uppercase">Birlikte Daha Güzel</span>
            <h2 className="text-foreground text-2xl leading-[1.15] font-extrabold tracking-tight sm:text-[28px]">
              İki Lezzet,
              <br />
              Tek Keyif
            </h2>
            <p className="text-foreground/60 max-w-sm text-sm leading-6 wrap-break-word">
              {offer.primaryProductName} ile {offer.companionProductName}, birbirini tamamlayan iki gerçek lezzet.
            </p>
          </div>

          <div className="relative mt-1 flex h-28 items-center sm:h-32">
            <div className="border-surface bg-surface relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 shadow-md sm:h-28 sm:w-28">
              <ProductImage
                src={primaryProductImage}
                alt={offer.primaryProductName}
                sizes="112px"
                className="object-cover"
              />
            </div>
            <div className="border-surface bg-surface relative -ml-7 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 shadow-md sm:-ml-9 sm:h-24 sm:w-24">
              <ProductImage
                src={offer.companionImage?.url ?? null}
                alt={offer.companionProductName}
                sizes="96px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Sağ — ürün eşleştirme + fiyat/CTA */}
        <div className="flex flex-col gap-5 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <BundleProductCard
              name={offer.primaryProductName}
              variantName={primaryVariant.name}
              imageUrl={primaryProductImage}
              price={primaryVariant.effectivePrice}
              regularPrice={primaryVariant.hasActiveDiscount ? primaryVariant.regularPrice : null}
              className="w-full sm:min-w-0 sm:flex-1"
            />
            <span
              aria-hidden="true"
              className="border-border-muted bg-surface text-foreground/40 mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base font-bold transition-transform duration-300 hover:scale-110 sm:mx-0"
            >
              +
            </span>
            <BundleProductCard
              name={offer.companionProductName}
              variantName={offer.companionVariantName}
              imageUrl={offer.companionImage?.url ?? null}
              price={offer.companionBundlePrice}
              regularPrice={offer.companionBundlePrice !== offer.companionRegularPrice ? offer.companionRegularPrice : null}
              className="w-full sm:min-w-0 sm:flex-1"
            />
          </div>

          <div className="border-border-muted flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-foreground/50 text-xs font-semibold tracking-wide uppercase">
                Birlikte Özel Fiyat
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {totalBundlePrice !== null ? (
                  <span className="text-brand-dark text-3xl font-extrabold tracking-tight">
                    {formatPrice(totalBundlePrice.toFixed(2))}
                  </span>
                ) : null}
                {hasSavings && totalRegularPrice !== null ? (
                  <span className="text-foreground/40 text-base font-medium line-through">
                    {formatPrice(totalRegularPrice.toFixed(2))}
                  </span>
                ) : null}
              </div>
              {hasSavings && savingsAmount !== null && savingsPercent !== null ? (
                <span className="bg-brand/10 text-brand-dark w-fit rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap">
                  %{savingsPercent} tasarruf · {formatPrice(savingsAmount.toFixed(2))} avantaj
                </span>
              ) : null}
            </div>

            <div className="sm:w-64">
              <AddBundleToCartButton offer={offer} primaryProductImage={primaryProductImage} primaryVariant={primaryVariant} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BundleProductCardProps {
  name: string;
  variantName: string;
  imageUrl: string | null;
  price: string;
  regularPrice: string | null;
  className?: string;
}

function BundleProductCard({ name, variantName, imageUrl, price, regularPrice, className = "" }: BundleProductCardProps) {
  return (
    <div
      className={`border-border-muted bg-surface hover:border-brand/40 group min-w-0 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${className}`.trim()}
    >
      <div className="border-border-muted bg-surface-muted relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl border">
        <ProductImage
          src={imageUrl}
          alt={name}
          sizes="(min-width: 640px) 160px, 45vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <p className="text-foreground line-clamp-2 text-xs leading-snug font-semibold wrap-break-word sm:text-sm">{name}</p>
      <p className="text-foreground/50 mt-0.5 text-[11px] sm:text-xs">{variantName}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-foreground text-sm font-bold sm:text-base">{formatPrice(price)}</span>
        {regularPrice ? (
          <span className="text-foreground/40 text-xs line-through">{formatPrice(regularPrice)}</span>
        ) : null}
      </div>
    </div>
  );
}
