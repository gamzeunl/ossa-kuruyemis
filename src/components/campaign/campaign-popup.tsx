"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CampaignCountdown } from "@/components/campaign/campaign-countdown";
import { ProductImage } from "@/components/catalog/product-image";
import { formatPrice } from "@/lib/format-money";
import { isAdminPathname } from "@/lib/admin-route";
import { hasCampaignPopupBeenSeenThisSession, markCampaignPopupSeenThisSession } from "@/lib/campaign-popup-storage";
import type { CampaignPopupData } from "@/types/campaign-popup";

interface CampaignPopupProps {
  /** Sunucuda `getActiveCampaignPopup()` ile çözülür — `null` ise hiçbir şey render edilmez. */
  data: CampaignPopupData | null;
}

/**
 * Site girişi kampanya popup'ı — `mini-cart.tsx`'teki kanıtlanmış overlay
 * iskeletiyle (backdrop + `role="dialog"` + ESC + transition-tabanlı geçiş)
 * AYNI desen, yeni bir dialog kütüphanesi eklenmedi. Gösterme kararı tamamen
 * client-only'dir (`sessionStorage`), bu yüzden sunucu ve ilk client render'ı
 * her zaman kapalıdır — hydration mismatch riski yok. `sessionStorage` key'i
 * `data.campaignId`'ye özgüdür (bkz. `campaign-popup-storage.ts`) — aynı
 * sekmede aynı kampanya yalnızca 1 kez, farklı/yeni bir kampanyada tekrar açılır.
 */
export function CampaignPopup({ data }: CampaignPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const isAdminRoute = isAdminPathname(pathname);

  // Yalnızca mount'ta bir kez: bu sekmede bu KAMPANYA zaten gösterildiyse tekrar açılmaz.
  // Açılış küçük bir gecikmeyle (`setTimeout`) tetiklenir — hem ilk boyamayı
  // kesintiye uğratmayan, daha "premium" bir giriş sağlar hem de `setState`
  // çağrısını effect gövdesinde SENKRON çalıştırmaktan kaçınır (bkz.
  // `react-hooks/set-state-in-effect`). Yönetim paneli rotalarında popup
  // storefront'a ait olduğu için hiç tetiklenmez (bkz. `isAdminPathname`).
  useEffect(() => {
    if (!data || isAdminRoute) {
      return;
    }
    if (hasCampaignPopupBeenSeenThisSession(window.sessionStorage, data.campaignId)) {
      return;
    }
    const timer = setTimeout(() => {
      markCampaignPopupSeenThisSession(window.sessionStorage, data.campaignId);
      setIsOpen(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [data, isAdminRoute]);

  // Root layout `/yonetim/**` dahil tüm route'larda mount kalır (soft nav'da
  // yeniden çalışmaz) — bu yüzden `isOpen` yerine `isAdminRoute`'u da hesaba
  // katan `effectivelyOpen` kullanılır; storefront'ta açıkken admin rotasına
  // geçilirse body scroll kilidi/ESC dinleyicisi hemen bırakılır.
  const effectivelyOpen = isOpen && !isAdminRoute;

  useEffect(() => {
    if (!effectivelyOpen) {
      return;
    }
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [effectivelyOpen]);

  if (!data || isAdminRoute) {
    return null;
  }

  function close() {
    setIsOpen(false);
  }

  const title =
    data.kind === "bundle"
      ? `${data.primaryProductName} + ${data.companionProductName}`
      : data.kind === "campaign"
        ? data.headline
        : data.productName;

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-100 flex items-center justify-center p-4 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-background relative flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-y-auto rounded-2xl shadow-2xl transition-all duration-300 sm:max-w-[860px] sm:grid sm:grid-cols-[45%_55%] ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          ref={closeButtonRef}
          onClick={close}
          aria-label="Kapat"
          className="bg-surface/90 text-foreground/60 hover:text-foreground absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none shadow-sm backdrop-blur-sm"
        >
          ×
        </button>

        {data.kind === "bundle" ? (
          <div className="bg-surface-muted relative flex h-48 w-full shrink-0 items-center justify-center gap-2 p-4 sm:h-full">
            <div className="border-border-muted bg-surface relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border sm:h-28 sm:w-28">
              <ProductImage src={data.primaryImageUrl} alt={data.primaryProductName} sizes="112px" className="object-cover" />
            </div>
            <span aria-hidden="true" className="text-foreground/30 text-2xl font-bold">
              +
            </span>
            <div className="border-border-muted bg-surface relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border sm:h-28 sm:w-28">
              <ProductImage
                src={data.companionImageUrl}
                alt={data.companionProductName}
                sizes="112px"
                className="object-cover"
              />
            </div>
          </div>
        ) : data.kind === "campaign" ? (
          <div className="bg-surface-muted relative h-48 w-full shrink-0 sm:h-full">
            <ProductImage
              src={data.featuredProduct?.imageUrl ?? null}
              alt={data.featuredProduct?.imageAlt ?? data.headline}
              sizes="(min-width: 640px) 387px, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-surface-muted relative h-48 w-full shrink-0 sm:h-full">
            {data.kind === "discount" ? (
              <span className="bg-brand text-brand-foreground absolute top-3 left-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                Fırsat
              </span>
            ) : null}
            <ProductImage
              src={data.imageUrl}
              alt={data.imageAlt}
              sizes="(min-width: 640px) 387px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 p-6 sm:justify-center sm:p-8">
          <span className="text-brand text-xs font-bold tracking-[0.16em] uppercase">{data.eyebrow}</span>
          <h2 className="text-foreground text-2xl font-bold tracking-tight">{title}</h2>

          {data.kind === "campaign" ? (
            <>
              {data.description ? <p className="text-foreground/60 text-sm leading-6">{data.description}</p> : null}
              <CampaignCountdown endsAt={data.endsAt} className="text-foreground text-sm font-semibold" />
              {data.featuredProduct ? (
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-brand text-3xl font-extrabold">
                    {formatPrice(data.featuredProduct.effectivePrice)}
                  </span>
                  {data.featuredProduct.effectivePrice !== data.featuredProduct.regularPrice ? (
                    <span className="text-foreground/40 text-base font-medium line-through">
                      {formatPrice(data.featuredProduct.regularPrice)}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {data.kind === "discount" ? (
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-brand text-3xl font-extrabold">{formatPrice(data.effectivePrice)}</span>
              <span className="text-foreground/40 text-base font-medium line-through">
                {formatPrice(data.regularPrice)}
              </span>
              {data.discountPercentage ? (
                <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-xs font-bold">
                  %{data.discountPercentage} indirim
                </span>
              ) : null}
            </div>
          ) : null}

          {data.kind === "featured" ? <p className="text-brand text-2xl font-extrabold">{formatPrice(data.price)}</p> : null}

          <Link
            href={data.ctaHref}
            onClick={close}
            className="bg-brand text-brand-foreground hover:bg-brand-dark mt-2 w-fit rounded-full px-6 py-3 text-sm font-bold transition-colors"
          >
            {data.ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
