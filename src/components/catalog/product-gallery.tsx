"use client";

import { useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { ProductImageSummary } from "@/types/catalog";

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImageSummary[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div
        key={activeImage?.url ?? "empty"}
        className="bg-surface-muted border-border-muted relative aspect-square overflow-hidden rounded-2xl border animate-[gallery-fade-in_300ms_ease-out]"
      >
        <ProductImage
          src={activeImage?.url ?? null}
          alt={activeImage?.altText ?? productName}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${productName} — görsel ${index + 1}`}
              aria-current={index === activeIndex}
              className={`bg-surface-muted focus-visible:outline-brand relative aspect-square overflow-hidden rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                index === activeIndex ? "border-brand" : "border-border-muted hover:border-brand/50"
              }`}
            >
              <ProductImage src={image.url} alt="" sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
