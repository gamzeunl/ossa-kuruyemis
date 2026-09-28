"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import { ChevronDownIcon } from "@/components/ui/icons";
import { getCategoryHref } from "@/lib/category-routes";
import { getMegaMenuContent } from "@/lib/mega-menu-content";
import { SECONDARY_NAV_LINKS } from "@/lib/primary-nav-links";
import type { CategoryWithPreviewProducts } from "@/types/catalog";

const OPEN_DELAY_MS = 100;
const CLOSE_DELAY_MS = 160;

function getTriggerClassName(isUrlActive: boolean, isOpen: boolean): string {
  const base =
    "relative flex min-h-[50px] items-center gap-1.5 px-3 text-[15px] font-bold whitespace-nowrap transition-colors after:absolute after:right-3 after:bottom-0 after:left-3 after:h-[2px] after:origin-center after:scale-x-0 after:rounded-t-full after:bg-brand after:transition-transform";

  // Aktif sayfa kategorisi her zaman marka renginde — hover/açık durumundan
  // bağımsız, kalıcı bir gösterge (böylece geçici olarak hover edilen başka
  // bir kategoriyle görsel olarak KARIŞMAZ).
  if (isUrlActive) {
    return `${base} text-brand after:scale-x-100`;
  }

  // Yalnızca üzerine gelinip açılmış (aktif sayfa DEĞİL) — metin rengi
  // foreground'da kalır, yalnızca alt çizgi belirir; aktif sayfa göstergesiyle
  // aynı görünüme bürünmez.
  if (isOpen) {
    return `${base} text-foreground after:scale-x-100`;
  }

  return `${base} text-foreground hover:text-brand hover:after:scale-x-100`;
}

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function CategoryNav({ categories }: { categories: CategoryWithPreviewProducts[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeUrlSlug = searchParams.get("kategori");

  function isCategoryActive(slug: string): boolean {
    return activeUrlSlug === slug || pathname === getCategoryHref(slug);
  }

  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [mobileOpenSlug, setMobileOpenSlug] = useState<string | null>(null);

  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const clearTimers = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (slug: string) => {
      clearTimers();

      openTimeoutRef.current = setTimeout(() => {
        setOpenSlug(slug);
      }, OPEN_DELAY_MS);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    clearTimers();

    closeTimeoutRef.current = setTimeout(() => {
      setOpenSlug(null);
    }, CLOSE_DELAY_MS);
  }, [clearTimers]);

  const openImmediately = useCallback(
    (slug: string) => {
      clearTimers();
      setOpenSlug(slug);
    },
    [clearTimers],
  );

  const closeImmediately = useCallback(() => {
    clearTimers();
    setOpenSlug(null);
  }, [clearTimers]);

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
      closeImmediately();
    }
  }

  function handleContainerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !openSlug) {
      return;
    }

    const trigger = triggerRefs.current[openSlug];

    closeImmediately();
    trigger?.focus();
  }

  const isOpen = openSlug !== null;

  const panelCategory = categories.find((category) => category.slug === openSlug) ?? null;

  const megaMenuContent = panelCategory ? getMegaMenuContent(panelCategory.slug) : null;
  const megaMenuGroups = megaMenuContent?.groups ?? [];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseLeave={scheduleClose}
      onBlur={handleContainerBlur}
      onKeyDown={handleContainerKeyDown}
    >
      {/* Masaüstü kategori satırı — içerik (kategoriler + ikincil bağlantılar) dar
          masaüstü genişliklerinde (ör. 1024px) tek satıra sığmayabilir; sayfa
          genelinde yatay taşmaya yol açmaması için gerektiğinde YALNIZCA bu satır
          kendi içinde yatay kaydırılır (`hide-scrollbar`), sayfa değil. */}
      <div className="mx-auto hidden min-h-[50px] w-full max-w-[1320px] items-center px-5 sm:px-6 lg:flex lg:px-10">
        <ul className="hide-scrollbar justify-safe-center flex w-full items-center gap-x-6 overflow-x-auto xl:gap-x-9">
          {categories.map((category) => {
            const categoryIsOpen = openSlug === category.slug;

            return (
              <li
                key={category.id}
                className="shrink-0"
                onMouseEnter={() => scheduleOpen(category.slug)}
              >
                <div
                  className={getTriggerClassName(isCategoryActive(category.slug), categoryIsOpen)}
                >
                  <Link
                    href={getCategoryHref(category.slug)}
                    onFocus={() => openImmediately(category.slug)}
                    className="outline-none"
                  >
                    {category.name}
                  </Link>

                  <button
                    ref={(node) => {
                      triggerRefs.current[category.slug] = node;
                    }}
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={categoryIsOpen}
                    aria-label={`${category.name} alt menüsünü ${categoryIsOpen ? "kapat" : "aç"}`}
                    onFocus={() => openImmediately(category.slug)}
                    onClick={() => {
                      if (categoryIsOpen) {
                        closeImmediately();
                      } else {
                        openImmediately(category.slug);
                      }
                    }}
                    className="-m-1 flex items-center justify-center p-1"
                  >
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition-transform ${
                        categoryIsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </li>
            );
          })}

          {/* Kategori değil, düz sayfa bağlantısı — mega menü AÇMAZ; üzerine gelinince açık bir panel varsa kapatır. */}
          {SECONDARY_NAV_LINKS.map((link) => (
            <li key={link.href} className="shrink-0" onMouseEnter={closeImmediately}>
              <div className={getTriggerClassName(pathname === link.href, false)}>
                <Link href={link.href} className="outline-none">
                  {link.label}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Masaüstü açılır menü */}
      <div
        onMouseEnter={clearTimers}
        onMouseLeave={scheduleClose}
        aria-hidden={!isOpen}
        className={`border-border-muted absolute top-full right-0 left-0 z-50 hidden border-b bg-white transition-all duration-150 ease-out lg:block ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100 shadow-[0_14px_28px_-18px_rgba(0,0,0,0.28)]"
            : "pointer-events-none -translate-y-1 opacity-0 shadow-none"
        }`}
      >
        {panelCategory ? (
          <div className="mx-auto w-full max-w-260 px-8 py-6">
            <p className="text-muted-text text-[11px] font-semibold tracking-[0.12em] uppercase">
              Kategori
            </p>
            <p className="mt-1 text-lg font-bold">{panelCategory.name}</p>

            {/* Alt Kategoriler — kategori grup kısayolları, kart görünümü; kategori sayfasına ?grup= ile filtreli yönlendirir. Ürün sorgusu YOK. */}
            {megaMenuGroups.length > 0 ? (
              <div className="mt-5 grid grid-cols-6 gap-3 xl:grid-cols-8">
                {megaMenuGroups.map((group) => (
                  <Link
                    key={group.groupSlug}
                    href={`${getCategoryHref(panelCategory.slug)}?grup=${group.groupSlug}`}
                    onClick={closeImmediately}
                    className="group border-border-muted bg-surface hover:border-brand flex flex-col gap-1.5 rounded-lg border p-1.5 transition-colors hover:shadow-sm focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span className="bg-surface-muted relative block aspect-square overflow-hidden rounded-md">
                      <ProductImage
                        src={group.image?.url ?? null}
                        alt={group.image?.altText ?? group.label}
                        sizes="130px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="text-foreground group-hover:text-brand line-clamp-2 text-center text-[11px] leading-snug font-medium transition-colors">
                      {group.label}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-text mt-5 text-sm">Bu kategori için alt kategori bulunmuyor.</p>
            )}

            {/* Sade metin bağlantısı, sağ altta — panelin ana odağı DEĞİL, sadece hızlı erişim. */}
            <div className="mt-5 flex justify-end">
              <Link
                href={getCategoryHref(panelCategory.slug)}
                onClick={closeImmediately}
                className="group text-brand hover:text-brand-dark flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                {megaMenuContent?.ctaLabel ?? `Tüm ${panelCategory.name} Ürünlerini Gör`}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobil kategori accordion */}
      <div className="border-border-muted border-t bg-white lg:hidden">
        <div className="overflow-x-auto">
          <ul className="flex min-w-max items-center px-3">
            {categories.map((category) => {
              const isExpanded = mobileOpenSlug === category.slug;

              return (
                <li key={category.id}>
                  <div
                    className={`flex min-h-[48px] items-center gap-1.5 px-3 text-sm font-semibold whitespace-nowrap ${
                      isExpanded || isCategoryActive(category.slug)
                        ? "text-gold"
                        : "text-foreground"
                    }`}
                  >
                    <Link href={getCategoryHref(category.slug)} className="outline-none">
                      {category.name}
                    </Link>

                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isExpanded}
                      aria-label={`${category.name} alt menüsünü ${isExpanded ? "kapat" : "aç"}`}
                      onClick={() => {
                        setMobileOpenSlug(isExpanded ? null : category.slug);
                      }}
                      className="-m-1 flex items-center justify-center p-1"
                    >
                      <ChevronDownIcon
                        className={`h-3.5 w-3.5 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {mobileOpenSlug ? (
          <div className="border-border-muted border-t px-4 py-4">
            {(() => {
              const category = categories.find((item) => item.slug === mobileOpenSlug);

              if (!category) {
                return null;
              }

              const items = category.previewProducts;

              return (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold">{category.name}</p>

                    <Link
                      href={getCategoryHref(category.slug)}
                      className="text-gold text-xs font-semibold"
                    >
                      Tümünü Gör
                    </Link>
                  </div>

                  <ul className="mt-3 grid grid-cols-3 gap-3">
                    {items.slice(0, 6).map((item) => (
                      <li key={item.name}>
                        <Link
                          href={getCategoryHref(category.slug)}
                          className="flex flex-col items-center text-center"
                        >
                          <span className="border-border-muted relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-[#fffaf0]">
                            {(item.imageUrl ?? category.imageUrl) ? (
                              <Image
                                src={item.imageUrl ?? category.imageUrl ?? ""}
                                alt=""
                                fill
                                unoptimized
                                sizes="96px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-gold text-base font-bold">
                                {getInitials(item.name)}
                              </span>
                            )}
                          </span>

                          <span className="mt-1.5 line-clamp-2 text-[11px] leading-4 font-medium">
                            {item.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
