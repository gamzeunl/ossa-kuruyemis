import { Suspense } from "react";
import Link from "next/link";
import { getCategoryHref } from "@/lib/category-routes";
import { SECONDARY_NAV_LINKS } from "@/lib/primary-nav-links";
import { getCategoryMenuData } from "@/server/services/catalog-service";
import { CategoryNav } from "./category-nav";

const fallbackLinkClassName =
  "flex min-h-[56px] items-center px-3 text-[15px] font-bold whitespace-nowrap text-foreground transition-colors hover:text-brand";

export async function CategoryMenu() {
  const categories = (await getCategoryMenuData()).filter(
    (category) => category.slug !== "kampanyali-paketler",
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Ürün kategorileri"
      className="border-border-muted relative z-40 border-y bg-white"
    >
      <Suspense
        fallback={
          <ul className="mx-auto flex min-h-[50px] w-full max-w-[1320px] items-center justify-center gap-8 overflow-x-auto px-5 whitespace-nowrap sm:px-6 lg:px-10">
            {categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <Link href={getCategoryHref(category.slug)} className={fallbackLinkClassName}>
                  {category.name}
                </Link>
              </li>
            ))}
            {SECONDARY_NAV_LINKS.map((link) => (
              <li key={link.href} className="shrink-0">
                <Link href={link.href} className={fallbackLinkClassName}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        }
      >
        <CategoryNav categories={categories} />
      </Suspense>
    </nav>
  );
}
