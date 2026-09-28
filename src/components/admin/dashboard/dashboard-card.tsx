import Link from "next/link";
import type { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
}

/** Dashboard'daki TÜM bölümlerin ortak kart kabuğu — aynı radius/gölge/boşluk, tek tip kart sistemi. */
export function DashboardCard({ title, action, children, className = "" }: DashboardCardProps) {
  return (
    <div
      className={`border-border-muted bg-surface flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:p-6 ${className}`.trim()}
    >
      {title || action ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className="text-foreground text-base font-bold">{title}</h2> : <span />}
          {action ? (
            <Link
              href={action.href}
              className="text-brand hover:text-brand-dark text-xs font-semibold underline underline-offset-2"
            >
              {action.label}
            </Link>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
