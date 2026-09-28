"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminPathname } from "@/lib/admin-route";

interface StorefrontChromeProps {
  header: ReactNode;
  categoryMenu: ReactNode;
  topBar: ReactNode;
  footer: ReactNode;
  miniCart: ReactNode;
  children: ReactNode;
}

/**
 * `/yonetim/**` altında storefront kabuğunu (header/mega-menu/top-bar/footer/
 * mini-cart) TAMAMEN gizler — admin paneli "mağaza gibi değil, profesyonel
 * bir yönetim uygulaması gibi" görünmeli (bkz. görev kuralı). `Header`/
 * `Footer`/`CategoryMenu`/`TopBar` Server Component olduğu için pathname
 * kontrolü BURADA (Client Component) yapılır; bu bileşenler `RootLayout`'ta
 * zaten render edilip PROP olarak buraya geçirilir (Next.js'in Server
 * Component'i Client Component'e prop olarak geçirme deseni). Not: bu
 * yaklaşım yalnızca DOM'a YAZILMALARINI engeller — kendi veri sorguları
 * (ör. `Footer`'ın kategori/çok-satan sorgusu) sunucuda yine de çalışır;
 * middleware tabanlı pathname enjeksiyonu olmadan Server Component
 * seviyesinde önlenemez. Admin trafiği düşük hacimli olduğundan bu maliyet
 * kabul edilebilir, yeni bir middleware/mimari karar GEREKTİRMEZ.
 * `CampaignPopup` zaten kendi içinde `isAdminPathname` kontrolü yapıyor
 * (bkz. `campaign-popup.tsx`), bu yüzden burada AYRICA sarmalanmadı.
 */
export function StorefrontChrome({ header, categoryMenu, topBar, footer, miniCart, children }: StorefrontChromeProps) {
  const pathname = usePathname();

  if (isAdminPathname(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {categoryMenu}
      {topBar}
      {children}
      {footer}
      {miniCart}
    </>
  );
}
