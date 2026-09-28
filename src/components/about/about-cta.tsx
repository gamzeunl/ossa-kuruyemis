import Link from "next/link";

/** Kompakt kapanış — dev bir banner DEĞİL, tek satırlık bordürlü bir kart. */
export function AboutCta() {
  return (
    <section className="border-border-muted bg-surface flex flex-col items-start gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
          OSSA&apos;yı keşfedin
        </h2>
        <p className="text-foreground/70 max-w-md text-sm leading-6">
          İster günlük atıştırmalıklarınız için ister sevdiklerinizle paylaşacağınız sofralar için,
          OSSA ürünlerini keşfedebilirsiniz.
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
        <Link
          href="/urunler"
          className="bg-brand hover:bg-brand-dark text-brand-foreground inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-7 text-sm font-bold transition-colors sm:flex-none"
        >
          Ürünleri İncele
        </Link>
        <Link
          href="/iletisim"
          className="border-border-muted hover:border-brand text-foreground inline-flex min-h-11 flex-1 items-center justify-center rounded-full border px-7 text-sm font-bold transition-colors sm:flex-none"
        >
          Bize Ulaşın
        </Link>
      </div>
    </section>
  );
}
