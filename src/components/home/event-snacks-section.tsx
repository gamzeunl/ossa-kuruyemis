import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import type { EventCardSummary } from "@/server/services/content-service";

const HEADING_ID = "kina-dugun-baslik";
const MIN_ADMIN_CARDS = 2;

/** Admin verisi 2'den azsa kullanılan sabit yedek kartlar — görsel yok (ProductImage kendi ikon fallback'i devreye girer). */
const FALLBACK_CARDS: EventCardSummary[] = [
  {
    id: "fallback-kina",
    title: "Kına Çerezleri",
    description: "Kına geceniz için sunumunuza uygun çerez seçenekleri hakkında bilgi alın.",
    imageUrl: null,
    imageAlt: null,
    buttonLabel: "İletişime Geç",
    buttonHref: "/iletisim",
  },
  {
    id: "fallback-dugun",
    title: "Düğün Çerezleri",
    description: "Düğün ve davetleriniz için ihtiyacınıza uygun çerez seçeneklerini birlikte planlayalım.",
    imageUrl: null,
    imageAlt: null,
    buttonLabel: "İletişime Geç",
    buttonHref: "/iletisim",
  },
];

/**
 * Admin panelinden (`/yonetim/icerik/etkinlik-kartlari`) en az 2 aktif kart
 * varsa onlar gösterilir; yoksa sabit yedek 2 kart (görevdeki metin) gösterilir.
 * Bölüm ARTIK gizlenmiyor.
 */
export function EventSnacksSection({ cards }: { cards: EventCardSummary[] }) {
  const displayCards = cards.length >= MIN_ADMIN_CARDS ? cards.slice(0, MIN_ADMIN_CARDS) : FALLBACK_CARDS;

  return (
    <section aria-labelledby={HEADING_ID} className={`bg-background ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader headingId={HEADING_ID} eyebrow="Etkinlikleriniz İçin" title="Kına ve Düğün Çerezleri" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {displayCards.map((card, index) => (
            <ScrollReveal key={card.id} delayMs={index * 80}>
              <article className="group border-brand/15 relative flex h-[430px] flex-col overflow-hidden rounded-2xl border shadow-sm sm:h-[450px] lg:h-[460px]">
                <div className="absolute inset-0">
                  <ProductImage
                    src={card.imageUrl}
                    alt={card.imageAlt ?? card.title}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Hero'nun düz siyah overlay'inden bilinçli olarak farklı: sıcak/kahverengi
                    bir gradyan ile davetiye/etkinlik hissi verir. */}
                <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/85 via-brown-dark/40 to-transparent" />

                <div className="relative z-10 mt-auto flex flex-col gap-2.5 p-5 sm:p-6">
                  <span className="bg-brand text-brand-foreground w-fit rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
                    Özel Gün Hazırlığı
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">{card.title}</h3>
                  <p className="max-w-md text-sm leading-6 text-white/85">{card.description}</p>
                  <Link
                    href={card.buttonHref}
                    className="group/cta text-foreground mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold transition-colors hover:bg-white/90"
                  >
                    {card.buttonLabel}
                    <span aria-hidden="true" className="transition-transform group-hover/cta:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
