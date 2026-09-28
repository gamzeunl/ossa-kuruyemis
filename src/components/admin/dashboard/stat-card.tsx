import type { ComponentType, SVGProps } from "react";
import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";

interface StatCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: number | string;
  label: string;
  description: string;
}

/** Bölüm 1 KPI kartı — ikon + sayı + kısa açıklama. */
export function StatCard({ icon: Icon, value, label, description }: StatCardProps) {
  return (
    <DashboardCard>
      <div className="flex items-start gap-4">
        <span className="bg-brand/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <Icon aria-hidden="true" className="text-brand h-6 w-6" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-foreground wrap-break-word text-xl font-extrabold tracking-tight">{value}</span>
          <span className="text-foreground wrap-break-word text-sm font-semibold">{label}</span>
          <span className="text-foreground/50 wrap-break-word text-xs">{description}</span>
        </div>
      </div>
    </DashboardCard>
  );
}
