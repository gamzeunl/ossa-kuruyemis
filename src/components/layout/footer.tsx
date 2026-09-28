import Image from "next/image";
import Link from "next/link";
import { ReturnIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { getCategoryDisplayName } from "@/lib/category-display";
import { getCategoryHref } from "@/lib/category-routes";
import {
  EXCLUDED_FOOTER_CATEGORY_SLUGS,
  FOOTER_LEGAL_ITEMS,
  FOOTER_STATIC_SECTIONS,
} from "@/lib/footer-links";
import { getActiveCategories, getBestSellingProducts } from "@/server/services/catalog-service";

const trustItems = [
  { icon: ShieldIcon, label: "Güvenli Alışveriş" },
  { icon: TruckIcon, label: "Hızlı Kargo" },
  { icon: ReturnIcon, label: "Kolay İade" },
];

export async function Footer() {
  const [allCategories, bestSellers] = await Promise.all([
    getActiveCategories(),
    getBestSellingProducts(4),
  ]);
  const categories = allCategories.filter(
    (category) => !EXCLUDED_FOOTER_CATEGORY_SLUGS.includes(category.slug),
  );

  return (
    <footer className="border-border-muted bg-surface-muted border-t">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3 lg:grid-cols-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-foreground text-sm font-semibold">Kategoriler</h2>
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={getCategoryHref(category.slug)}
                  className="text-foreground/70 hover:text-brand text-sm transition-colors"
                >
                  {getCategoryDisplayName(category)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-foreground text-sm font-semibold">Çok Satanlar</h2>
          <ul className="flex flex-col gap-2">
            {bestSellers.length > 0 ? (
              bestSellers.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/urunler/${product.slug}`}
                    className="text-foreground/70 hover:text-brand text-sm transition-colors"
                  >
                    {product.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-foreground/50 text-sm">Yakında burada</li>
            )}
          </ul>
        </div>

        {FOOTER_STATIC_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <h2 className="text-foreground text-sm font-semibold">{section.title}</h2>
            <ul className="flex flex-col gap-2">
              {section.items.map((item) => (
                <li key={item.label} className="text-sm">
                  {item.href ? (
                    item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground/70 hover:text-brand transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-foreground/70 hover:text-brand transition-colors"
                      >
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <span className="text-foreground/70">{item.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border-muted border-t">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-6 sm:justify-between">
          {trustItems.map(({ icon: Icon, label }) => (
            <div key={label} className="text-foreground/70 flex items-center gap-2 text-sm">
              <Icon className="text-brand h-5 w-5" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-border-muted border-t">
        <div className="text-foreground/60 mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-6 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
            {/* Logo — header.tsx ile AYNI asset (`public/images/ossa-logo-icon.png`,
            kaynağı `src/app/icon.png`, yeni logo ÜRETİLMEDİ). `unoptimized`: bkz.
            header.tsx'teki aynı logo kullanımındaki not (`/_next/image` proxy'sinin
            varsayılan `Content-Disposition: attachment` davranışı, optimize
            edilmemiş bu şekilde atlanır). */}
            <Link
              href="/"
              aria-label="OSSA ana sayfa"
              className="flex h-10 w-10 shrink-0 items-center justify-start sm:h-12 sm:w-12"
            >
              <Image
                src="/images/ossa-logo-icon.png"
                alt="OSSA Kuru Yemiş"
                width={130}
                height={122}
                unoptimized
                className="h-full w-full object-contain"
              />
            </Link>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {FOOTER_LEGAL_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-brand transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p>© {new Date().getFullYear()} OSSA Kuruyemiş. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
