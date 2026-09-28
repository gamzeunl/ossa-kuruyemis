"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";
import { addFavoriteAction, removeFavoriteAction } from "@/actions/favorites";
import { HeartIcon } from "@/components/ui/icons";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

interface FavoriteButtonProps {
  productId: string;
  /** Girişsiz kullanıcı tıkladığında `/giris?callbackURL=` ile döneceği sayfa. */
  productPath: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  /** "icon": kart köşesindeki sade kalp. "button": PDP'deki etiketli aksiyon. */
  variant?: "icon" | "button";
  /** Yalnızca `variant="icon"` için: "overlay" (varsayılan) kart görseli
   * üzerine bindirir; "static" PDP başlık satırı gibi statik/inline
   * yerleşimlerde kullanılır. */
  layout?: "overlay" | "static";
}

/**
 * Favori kalbi — kart köşesinde (`variant="icon"`) ve PDP satın alma
 * alanında (`variant="button"`) aynı davranışı paylaşır. Girişsiz kullanıcı
 * `/giris`'e yönlendirilir (giriş sonrası aynı ürüne güvenli dönüş için
 * `callbackURL`); girişli kullanıcıda optimistic toggle + hata durumunda
 * geri alma. Kart bazen bir `Link` içindedir (`AddToCartButton` ile aynı
 * gerekçe) — tıklama üst `Link`'e sızmasın diye durdurulur.
 */
export function FavoriteButton({
  productId,
  productPath,
  initialFavorited,
  isLoggedIn,
  variant = "icon",
  layout = "overlay",
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  // Yalnızca favoriye YENİ eklenme anında kısa bir "pop" — her render'da değil,
  // yalnızca gerçek toggle anında tetiklenir, ~450ms sonra kendini temizler.
  const [justFavorited, setJustFavorited] = useState(false);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/giris?callbackURL=${encodeURIComponent(sanitizeRedirectPath(productPath))}`);
      return;
    }

    const nextFavorited = !isFavorited;
    setIsFavorited(nextFavorited);
    if (nextFavorited) {
      setJustFavorited(true);
      setTimeout(() => setJustFavorited(false), 450);
    }
    startTransition(async () => {
      const result = nextFavorited
        ? await addFavoriteAction(productId)
        : await removeFavoriteAction(productId);
      if (!result.ok) {
        setIsFavorited(!nextFavorited);
      }
    });
  }

  const label = isFavorited ? "Favorilerden çıkar" : "Favorilere ekle";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-pressed={isFavorited}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isFavorited
            ? "border-brand bg-brand/10 text-brand"
            : "border-border-muted text-foreground hover:border-brand"
        }`}
      >
        <HeartIcon
          className={`h-4 w-4 transition-transform active:scale-90 ${
            justFavorited ? "animate-[heart-pop_420ms_ease-out]" : ""
          }`}
          fill={isFavorited ? "currentColor" : "none"}
        />
        {isFavorited ? "Favorilerimde" : "Favorilere Ekle"}
      </button>
    );
  }

  const iconClassName =
    layout === "static"
      ? "border-border-muted hover:border-brand text-foreground/70 hover:text-brand focus-visible:border-brand focus-visible:text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white transition-colors focus-visible:outline-none"
      : "bg-surface/90 text-foreground/70 hover:text-brand focus-visible:text-brand absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-90 focus-visible:scale-110 focus-visible:outline-none";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isFavorited}
      aria-label={label}
      title={label}
      className={iconClassName}
    >
      <HeartIcon
        className={`h-4 w-4 transition-colors ${isFavorited ? "text-brand" : ""} ${
          justFavorited ? "animate-[heart-pop_420ms_ease-out]" : ""
        }`}
        fill={isFavorited ? "currentColor" : "none"}
      />
    </button>
  );
}
