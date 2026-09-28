import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import type { BannerSummary } from "@/server/services/content-service";
import type { ProductImageSummary } from "@/types/catalog";

const FALLBACK_TITLE = "Geleneksel lezzetleri modern sunumla buluşturuyoruz";
const FALLBACK_SUBTITLE = "Kuruyemişten lokuma, kahveden baharata kadar ürün seçeneklerini keşfedin.";
const FALLBACK_CTA_LABEL = "Koleksiyonu Keşfet";
const FALLBACK_CTA_HREF = "/urunler";

/**
 * Tek editoryal banner — admin FULL_WIDTH banner'ı varsa onu kullanır; yoksa
 * sabit yedek metin + gerçek bir çok-satan ürün görseli (`fallbackImage`,
 * `page.tsx`'ten) ile gösterir. Bölüm ARTIK gizlenmiyor.
 *
 * Hero/Kına & Düğün'ün "tam genişlik fotoğraf + koyu overlay + beyaz metin"
 * kalıbından BİLİNÇLİ OLARAK farklıdır: koyu overlay YOK, açık/krem zeminli,
 * asimetrik iki-kolonlu (metin + görsel) bir editoryal kart kullanılır —
 * büyük bir sarı yüzey de OLUŞTURULMAZ, sarı yalnızca küçük eyebrow rozetinde.
 */
export function EditorialBannerSection({
  banner,
  fallbackImage,
}: {
  banner: BannerSummary | null;
  fallbackImage: ProductImageSummary | null;
}) {
  const title = banner?.title ?? FALLBACK_TITLE;
  const subtitle = banner?.subtitle ?? FALLBACK_SUBTITLE;
  const ctaLabel = banner?.primaryButtonLabel ?? FALLBACK_CTA_LABEL;
  const ctaHref = banner?.primaryButtonHref ?? FALLBACK_CTA_HREF;
  const imageUrl = banner?.imageUrl ?? fallbackImage?.url ?? null;
  const imageAlt = banner?.imageAlt ?? fallbackImage?.altText ?? title;

  return (
    <section aria-label={title} className={`bg-surface ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <div className="border-border-muted bg-cream grid grid-cols-1 items-center gap-0 overflow-hidden rounded-3xl border lg:grid-cols-[1.1fr_0.9fr]">
          <ScrollReveal className="flex flex-col items-start gap-4 p-8 sm:p-10 lg:p-12">
            <span className="bg-brand/10 text-brand-dark w-fit rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase">
              Editoryal Seçki
            </span>
            <h2 className="text-foreground max-w-md text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="text-foreground/70 max-w-sm text-sm leading-6 sm:text-base">{subtitle}</p>
            <Link
              href={ctaHref}
              className="bg-brand hover:bg-brand-dark text-brand-foreground mt-1 inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold shadow-sm transition-colors"
            >
              {ctaLabel}
            </Link>
          </ScrollReveal>

          <div className="relative h-[240px] w-full overflow-hidden sm:h-[300px] lg:h-[420px]">
            <ProductImage
              src={imageUrl}
              alt={imageAlt}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
      </HomeContainer>
    </section>
  );
}
