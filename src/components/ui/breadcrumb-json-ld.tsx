import { publicEnv } from "@/config/env";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

/**
 * Görsel `<Breadcrumb>` ile AYNI `items` verisinden `BreadcrumbList` JSON-LD
 * üretir — iki ayrı kaynak/iki ayrı bakım noktası OLUŞMASIN diye. Son öge
 * (mevcut sayfa) `href` taşımasa dahi kanonik sayfa URL'i olarak `item`'a
 * yazılır (Google'ın BreadcrumbList için beklediği biçim).
 */
export function BreadcrumbJsonLd({ items, currentUrl }: { items: BreadcrumbItem[]; currentUrl: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: index === items.length - 1 ? currentUrl : `${publicEnv.NEXT_PUBLIC_SITE_URL}${item.href ?? ""}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
