import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/layout/container";
import { BUNDLE_OFFER_STATUS_LABELS, BUNDLE_OFFER_STATUS_TONE, resolveBundleOfferStatus } from "@/lib/bundle-offer-status";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { requireRole } from "@/server/auth/guard";
import { listBundleOffersForAdmin } from "@/server/repositories/bundle-offer-repository";

export const metadata: Metadata = { title: "Birlikte Al Kampanyaları" };

export default async function AdminBundleOffersPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/birlikte-al");
  const bundles = await listBundleOffersForAdmin();

  const rows = bundles.map((bundle) => {
    const companionPricing = resolveVariantPricing(bundle.companionVariant);
    return {
      bundle,
      companionEffectivePrice: companionPricing.effectivePrice,
      status: resolveBundleOfferStatus(bundle, companionPricing.effectivePrice),
    };
  });

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
          <h1 className="text-2xl font-semibold tracking-tight">Birlikte Al Kampanyaları</h1>
          <Link
            href="/yonetim/kampanyalar/birlikte-al/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Kampanya
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Aktif Kampanyalar: {activeCount} · Planlanan: {scheduledCount} · Sona Eren: {endedCount}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          Henüz kampanya eklenmedi.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ana Ürün</th>
                <th className="px-4 py-3 font-semibold">Tamamlayıcı</th>
                <th className="px-4 py-3 font-semibold">Normal Fiyat</th>
                <th className="px-4 py-3 font-semibold">Birlikte Al</th>
                <th className="px-4 py-3 font-semibold">Başlangıç</th>
                <th className="px-4 py-3 font-semibold">Bitiş</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {rows.map(({ bundle, companionEffectivePrice, status }) => (
                <tr key={bundle.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {bundle.primaryProduct.name}
                    <span className="text-foreground/50"> ({bundle.primaryVariant.name})</span>
                  </td>
                  <td className="px-4 py-3">
                    {bundle.companionProduct.name}
                    <span className="text-foreground/50"> ({bundle.companionVariant.name})</span>
                  </td>
                  <td className="px-4 py-3">{formatPrice(companionEffectivePrice.toString())}</td>
                  <td className="px-4 py-3">{formatPrice(bundle.companionPrice.toString())}</td>
                  <td className="px-4 py-3">{bundle.startsAt ? formatDate(bundle.startsAt) : "—"}</td>
                  <td className="px-4 py-3">{bundle.endsAt ? formatDate(bundle.endsAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={BUNDLE_OFFER_STATUS_LABELS[status]} tone={BUNDLE_OFFER_STATUS_TONE[status]} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/kampanyalar/birlikte-al/${bundle.id}`}
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
