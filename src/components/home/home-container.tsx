import type { ReactNode } from "react";

/**
 * Ana sayfadaki TÜM bölümlerin paylaştığı TEK container genişliği/yatay
 * boşluğu — her section dosyası kendi `max-w`/`px` değerini tekrar
 * TANIMLAMAZ, bu bileşeni kullanır (tutarlı genişlik + spacing sistemi).
 */
export function HomeContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1320px] px-6 lg:px-10 ${className}`.trim()}>{children}</div>;
}

/**
 * Ana sayfa bölümlerinin TEK dikey boşluk sistemi — tüm section'lar bunu
 * kullanır, kendi `py-*` değerini tekrar TANIMLAMAZ. Mobilde py-12/py-16,
 * masaüstünde py-20 aralığında tutulur; aşırı (150-200px) boşluklara izin
 * verilmez.
 */
export const HOME_SECTION_PADDING = "py-12 sm:py-16 lg:py-20";
