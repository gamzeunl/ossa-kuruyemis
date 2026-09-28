import Link from "next/link";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import type { ProductSummary } from "@/types/catalog";

interface ProductShelfProps {
  eyebrow?: string;
  title: string;
  /** Başlığın yanında küçük, nötr bir bilgi etiketi (ör. "Bu hafta sonuna kadar") — yalnızca gerçek veriden hesaplanmış bir değer verilmelidir. */
  titleBadge?: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel?: string;
  products: ProductSummary[];
  toneClassName?: string;
  /** "scroll": mobilde yatay kaydırılabilir tek satır, sm ve üzerinde ızgaraya döner. */
  layout?: "grid" | "scroll";
  /** Geçerli kullanıcının favorilediği ürün id'leri — `homepage-service.ts`'te TEK sorguyla çözülür. */
  favoritedProductIds?: ReadonlySet<string>;
  isLoggedIn?: boolean;
  /** "Kaçırılmayacak Fırsatlar" vitrini için — her karta `ProductListCard`'ın "Fırsat" etiketi/yüzde gösterimini açar. */
  highlightDeals?: boolean;
  /** "deal": sıcak/ayrışan arka plan + daha güçlü başlık — normal ürün gridinden bilinçli olarak ayrışır. */
  variant?: "default" | "deal";
  /** Daha dar dikey boşluk (`HOME_SECTION_PADDING` yerine) — yalnızca bu section için, paylaşılan sabit DEĞİŞMEZ. */
  compact?: boolean;
  /** Doluysa başlığın yanında gerçek `CampaignCountdown` gösterilir — "AKTİF KAMPANYA" hero bölümü için, diğer raflar bu prop'u geçmez. */
  countdownEndsAt?: string;
}

/**
 * Ana sayfadaki ürün vitrinlerinin ("Kaçırılmayacak Fırsatlar", "En Çok
 * Satanlar", "Ayın Favorileri") ortak kalıbı — `HomeContainer`/
 * `HOME_SECTION_PADDING` kullanır, diğer bölümlerle aynı genişlik/boşluk
 * sistemine uyar. `products` boşsa (ör. önerilen ürün yoksa) bölüm TAMAMEN
 * gizlenir — rastgele ürün fallback'i YOK. İkinci bir ürün kartı sistemi
 * OLUŞTURULMAZ — `ProductListCard` tek kaynak, yalnızca `variant` bu
 * sarmalayıcının kendi arka plan/başlık ağırlığını değiştirir.
 */
export function ProductShelf({
  eyebrow,
  title,
  titleBadge,
  subtitle,
  viewAllHref,
  viewAllLabel = "Tümünü Gör",
  products,
  toneClassName = "",
  layout = "grid",
  favoritedProductIds,
  isLoggedIn = false,
  highlightDeals = false,
  variant = "default",
  compact = false,
  countdownEndsAt,
}: ProductShelfProps) {
  if (products.length === 0) {
    return null;
  }

  const isScroll = layout === "scroll";
  const isDeal = variant === "deal";

  return (
    <section
      aria-label={title}
      className={`relative overflow-hidden ${compact ? "py-10 sm:py-12 lg:py-16" : HOME_SECTION_PADDING} ${toneClassName}`.trim()}
    >
      {isDeal ? (
        <div
          aria-hidden="true"
          className="from-gold-light/70 via-gold-light/25 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        />
      ) : null}
      <HomeContainer className="relative">
        <ScrollReveal className={`flex flex-wrap items-end justify-between gap-4 ${compact ? "mb-4 sm:mb-5" : "mb-6"}`}>
          <div className="flex flex-col gap-1">
            {eyebrow ? (
              <span className="text-brand text-xs font-semibold tracking-wide uppercase">
                {eyebrow}
              </span>
            ) : null}
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                className={`text-foreground font-extrabold tracking-tight ${
                  isDeal ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                }`}
              >
                {title}
              </h2>
              {titleBadge ? (
                <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                  {titleBadge}
                </span>
              ) : null}
              {countdownEndsAt ? (
                <CampaignCountdown
                  endsAt={countdownEndsAt}
                  className="bg-brand text-brand-foreground rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                />
              ) : null}
            </div>
            {subtitle ? <p className="text-foreground/60 text-sm">{subtitle}</p> : null}
          </div>
          <Link
            href={viewAllHref}
            className="text-brand hover:text-brand-dark group/link inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            {viewAllLabel}
            <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        </ScrollReveal>
        <div
          className={
            isScroll
              ? "-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5"
              : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          }
        >
          {products.map((product, index) => {
            const cardProps = {
              product,
              isFavorited: favoritedProductIds?.has(product.id) ?? false,
              isLoggedIn,
              highlightDeal: highlightDeals,
            };
            const card = <ProductListCard {...cardProps} />;
            return isScroll ? (
              <div key={product.id} className="w-[68%] shrink-0 snap-start sm:w-auto sm:shrink-0">
                {card}
              </div>
            ) : (
              <ScrollReveal key={product.id} delayMs={index * 60}>
                {card}
              </ScrollReveal>
            );
          })}
        </div>
      </HomeContainer>
    </section>
  );
}
