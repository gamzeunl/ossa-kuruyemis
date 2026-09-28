import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/layout/container";
import { DISCOUNT_STATUS_LABELS, DISCOUNT_STATUS_TONE, resolveDiscountStatus } from "@/lib/discount-status";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { requireRole } from "@/server/auth/guard";
import { listVariantsWithDiscountConfig } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Haftanın Fırsatları" };

export default async function AdminDiscountsPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/haftanin-firsatlari");
  const variants = await listVariantsWithDiscountConfig();

  const rows = variants.map((variant) => ({
    variant,
    status: resolveDiscountStatus(variant),
    pricing: resolveVariantPricing(variant),
  }));

  const activeCount = rows.filter((row) => row.status === "ACTIVE").length;
  const scheduledCount = rows.filter((row) => row.status === "SCHEDULED").length;
  const endedCount = rows.filter((row) => row.status === "ENDED").length;

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar" className="text-brand w-fit text-xs font-semibold">
          ← Kampanyalar
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Haftanın Fırsatları</h1>
          <Link
            href="/yonetim/kampanyalar/haftanin-firsatlari/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Fırsat
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Aktif Fırsatlar: {activeCount} · Planlanan: {scheduledCount} · Sona Eren: {endedCount}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          Henüz tanımlanmış bir indirim yok.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-215 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Varyant</th>
                <th className="px-4 py-3 font-semibold">Normal Fiyat</th>
                <th className="px-4 py-3 font-semibold">İndirimli Fiyat</th>
                <th className="px-4 py-3 font-semibold">İndirim</th>
                <th className="px-4 py-3 font-semibold">Başlangıç</th>
                <th className="px-4 py-3 font-semibold">Bitiş</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {rows.map(({ variant, status, pricing }) => (
                <tr key={variant.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{variant.product.name}</td>
                  <td className="px-4 py-3">{variant.name}</td>
                  <td className="px-4 py-3">{formatPrice(variant.price.toString())}</td>
                  <td className="px-4 py-3">
                    {variant.discountPrice ? formatPrice(variant.discountPrice.toString()) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {pricing.discountPercentage !== null ? `%${pricing.discountPercentage}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {variant.discountStartsAt ? formatDate(variant.discountStartsAt) : "—"}
                  </td>
                  <td className="px-4 py-3">{variant.discountEndsAt ? formatDate(variant.discountEndsAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={DISCOUNT_STATUS_LABELS[status]} tone={DISCOUNT_STATUS_TONE[status]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/kampanyalar/haftanin-firsatlari/${variant.id}`}
                      className="text-brand font-semibold underline underline-offset-2"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
