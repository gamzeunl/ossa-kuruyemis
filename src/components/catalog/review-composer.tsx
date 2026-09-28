"use client";

import Link from "next/link";
import { useState } from "react";
import { ReviewForm } from "@/components/catalog/review-form";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

interface ReviewComposerProps {
  productId: string;
  isLoggedIn: boolean;
  /** Girişsiz kullanıcı için "Giriş Yap" bağlantısının döneceği sayfa. */
  productPath: string;
}

/**
 * "Müşteri Yorumları" başlık satırı + altında açılan kompakt yorum formu
 * paneli. Panel varsayılan KAPALIDIR, yalnızca "Yorum Yap" tıklanınca açılır
 * — sayfa yüklendiğinde büyük bir boş alan kaplamaz. `ReviewForm`'un
 * doğrulama/gönderim mantığı değişmeden yeniden kullanılır.
 */
export function ReviewComposer({ productId, isLoggedIn, productPath }: ReviewComposerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-foreground text-xl font-bold tracking-tight">Müşteri Yorumları</h2>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls="review-form-panel"
            className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors ${
              isOpen
                ? "border-border-muted text-foreground hover:border-brand border"
                : "bg-brand text-brand-foreground hover:bg-brand-dark"
            }`}
          >
            {isOpen ? "İptal" : "Yorum Yap"}
          </button>
        ) : (
          <Link
            href={`/giris?callbackURL=${encodeURIComponent(sanitizeRedirectPath(productPath))}`}
            className="border-border-muted text-foreground hover:border-brand hover:text-brand inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors"
          >
            Giriş Yap
          </Link>
        )}
      </div>

      {isLoggedIn ? (
        <div
          id="review-form-panel"
          inert={!isOpen}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="max-w-180 pt-1">
              <ReviewForm productId={productId} onCancel={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
