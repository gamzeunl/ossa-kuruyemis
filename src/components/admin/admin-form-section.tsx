"use client";

import { useState, type ReactNode } from "react";

/** Admin genelindeki TÜM formların ortak label/input sınıfları — her form kendi kopyasını üretmez. */
export const ADMIN_FORM_LABEL_CLASSNAME = "text-foreground text-xs font-medium flex flex-col gap-1.5";
export const ADMIN_FORM_INPUT_CLASSNAME =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors";

interface AdminFormSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** İkincil/az kullanılan bölümler için — açık/kapalı katlanabilir başlık. En sık kullanılan bölümler bunu KULLANMAZ. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Başlığın yanında bir aksiyon (ör. "+ Yeni Varyant Ekle") — yalnızca `collapsible` olmayan bölümlerde kullanılır. */
  headerAction?: ReactNode;
}

/**
 * Admin ürün/kategori/vb. formlarının ortak bölüm kartı — her form kendi
 * `cardClassName`/`labelClassName` kopyasını üretmez (bkz. görev: "ikinci/
 * üçüncü versiyon oluşturma"). En sık kullanılan bölümler `collapsible`
 * OLMADAN her zaman açık kalır; ikincil/uzun bölümler (SEO, besin değerleri
 * vb.) `collapsible` ile katlanabilir hâle gelir.
 */
export function AdminFormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  headerAction,
}: AdminFormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-foreground text-base font-bold">{title}</span>
            {description ? <span className="text-foreground/50 text-xs">{description}</span> : null}
          </span>
          <span
            aria-hidden="true"
            className={`text-foreground/40 shrink-0 text-sm transition-transform ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-foreground text-base font-bold">{title}</h2>
            {description ? <p className="text-foreground/50 text-xs">{description}</p> : null}
          </div>
          {headerAction}
        </div>
      )}
      {open ? <div className="flex flex-col gap-4">{children}</div> : null}
    </section>
  );
}
