"use client";

import Image from "next/image";
import { useState } from "react";
import { LeafIcon } from "@/components/ui/icons";

interface ProductImageProps {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * `next/image`'ın TEK sarmalayıcısı — görsel yoksa (`src=null`) veya yüklenirken
 * hata alırsa (bozuk URL) tarayıcının native "kırık resim" ikonu YERİNE
 * markaya uygun bir yer tutucu gösterir. Ebeveyn her zaman `relative` konumlu,
 * bilinen en-boy oranlı bir kapsayıcı olmalıdır (`fill` modu) — kart görselleri,
 * PDP galerisi ve sepet öğesi görselleri hepsi bu deseni kullanır.
 */
export function ProductImage({ src, alt, sizes, className, priority }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="bg-surface-muted flex h-full w-full items-center justify-center">
        <LeafIcon className="text-foreground/20 h-8 w-8" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
