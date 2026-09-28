import Link from "next/link";
import { HomeContainer } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";

const HEADING_ID = "son-cta-baslik";

/**
 * Footer'dan önceki kapanış bölümü — koyu `brand-dark` taban + küçük sarı
 * (`#ffb600`) vurgu + krem/beyaz tipografi. Eski "hardal/kahverengi"
 * (`brown-dark`) blok BİLİNÇLİ OLARAK kaldırıldı. Kompakt tutulur (yaklaşık
 * mobil 180-220px / desktop 220-260px) — footer'a zarif bir geçiş, sayfayı
 * DOMİNE ETMEZ. Dekoratif sarı köşe glow'u BİLİNÇLİ OLARAK düşük opaklıkta
 * (`/10`) — düz/yoğun bir sarı alan OLUŞTURULMAZ, yalnızca vurgu hissi verir.
 */
export function FinalCtaSection() {
  return (
    <section
      aria-labelledby={HEADING_ID}
      className="bg-brand-dark relative flex min-h-[200px] items-center overflow-hidden py-10 sm:min-h-[240px] sm:py-12"
    >
      <div
        aria-hidden="true"
        className="bg-brand/10 pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full blur-3xl"
      />
      <HomeContainer className="relative w-full">
        <ScrollReveal className="flex flex-col items-center gap-4 text-center">
          <span className="text-brand text-xs font-bold tracking-[0.2em] uppercase">OSSA Kuruyemiş</span>
          <h2 id={HEADING_ID} className="text-background max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Sofranıza yeni bir lezzet ekleyin.
          </h2>
          <p className="text-background/80 max-w-xl text-sm leading-6 sm:text-base">
            OSSA ürünlerini keşfedin, favorilerinizi seçin ve siparişinizi kolayca oluşturun.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/urunler"
              className="bg-brand text-brand-foreground inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold shadow-md transition-opacity hover:opacity-90"
            >
              Ürünleri Keşfet
            </Link>
            <Link
              href="/iletisim"
              className="border-background/40 text-background hover:border-background hover:bg-background/10 inline-flex min-h-12 items-center justify-center rounded-full border px-7 text-sm font-bold transition-colors"
            >
              Bize Ulaşın
            </Link>
          </div>
        </ScrollReveal>
      </HomeContainer>
    </section>
  );
}
