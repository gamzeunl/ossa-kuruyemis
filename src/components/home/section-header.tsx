import Link from "next/link";
import { ScrollReveal } from "@/components/home/scroll-reveal";

interface SectionHeaderAction {
  label: string;
  href: string;
}

interface SectionHeaderProps {
  /** `<h2>`'nin `id`'si — section'ın `aria-labelledby`'si bunu referans alır. */
  headingId: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Sağa hizalı, küçük metin bağlantısı — büyük CTA butonu DEĞİL. */
  action?: SectionHeaderAction;
}

/** Ana sayfa bölümlerinin TEK ortak başlık deseni — eyebrow/`<h2>`/alt açıklama + opsiyonel küçük link. */
export function SectionHeader({ headingId, eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <ScrollReveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className="text-brand text-xs font-bold tracking-[0.18em] uppercase">{eyebrow}</span>
        ) : null}
        <h2 id={headingId} className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {subtitle ? <p className="text-foreground/60 max-w-xl text-sm leading-6">{subtitle}</p> : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="text-brand hover:text-brand-dark group/link inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold transition-colors"
        >
          {action.label}
          <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-1">
            →
          </span>
        </Link>
      ) : null}
    </ScrollReveal>
  );
}
