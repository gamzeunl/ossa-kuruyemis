"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { HeroSlideData } from "@/server/services/homepage-service";

const AUTO_ADVANCE_MS = 2000;

/**
 * Oto-ilerleyen Hero slider.
 * Hero üzerindeki yazılar ve CTA kaldırılmıştır.
 * `slides` içinde kaç görsel varsa hepsini gösterir.
 * prefers-reduced-motion aktifse otomatik geçiş durur.
 */
export function HeroSlider({ slides }: { slides: HeroSlideData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    query.addEventListener("change", handleChange);

    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (reducedMotion || isPaused || slides.length <= 1) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [activeIndex, isPaused, reducedMotion, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Öne çıkan görseller"
      className="relative h-[360px] w-full overflow-hidden sm:h-[480px] lg:h-[585px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={`${slide.title}-${index}`}
            aria-hidden={!isActive}
            inert={!isActive}
            suppressHydrationWarning
            className={`absolute inset-0 transition-opacity ease-in-out ${
              reducedMotion ? "duration-0" : "duration-700"
            } ${
              isActive
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <ProductImage
              src={slide.imageUrl}
              alt={slide.imageAlt}
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        );
      })}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Önceki slayt"
            onClick={() => goTo(activeIndex - 1)}
            className="text-foreground absolute top-1/2 left-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition-colors hover:bg-white"
          >
            <span aria-hidden="true">←</span>
          </button>

          <button
            type="button"
            aria-label="Sonraki slayt"
            onClick={() => goTo(activeIndex + 1)}
            className="text-foreground absolute top-1/2 right-4 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md transition-colors hover:bg-white"
          >
            <span aria-hidden="true">→</span>
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={`${slide.title}-${index}`}
                type="button"
                aria-label={`${index + 1}. slayta git`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-6 bg-white"
                    : "w-2.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
} 