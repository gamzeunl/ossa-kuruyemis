import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/layout/container";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONE,
  resolveCampaignStatus,
  type CampaignStatus,
} from "@/lib/campaign-status";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/campaign-type-preset";
import { formatDate } from "@/lib/format-date";
import { requireRole } from "@/server/auth/guard";
import { listMarketingCampaignsForAdmin } from "@/server/repositories/marketing-campaign-repository";

export const metadata: Metadata = { title: "Kampanyalar" };

type TabFilter = "tumu" | "aktif" | "planlanan" | "sona-eren";

const TABS: { key: TabFilter; label: string; statuses: CampaignStatus[] | null }[] = [
  { key: "tumu", label: "Tümü", statuses: null },
  { key: "aktif", label: "Aktif", statuses: ["AKTIF", "BUGUN_BITIYOR"] },
  { key: "planlanan", label: "Planlanan", statuses: ["PLANLANDI"] },
  { key: "sona-eren", label: "Sona Eren", statuses: ["SONA_ERDI"] },
];

function formatRemaining(endsAt: Date, status: CampaignStatus, now: Date): string {
  if (status === "SONA_ERDI" || status === "PASIF") {
    return "—";
  }
  const msLeft = endsAt.getTime() - now.getTime();
  if (msLeft <= 0) {
    return "—";
  }
  const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
  if (days >= 1) {
    return `${days} gün`;
  }
  const hours = Math.floor(msLeft / (60 * 60 * 1000));
  return `${Math.max(hours, 1)} saat`;
}

export default async function AdminMarketingCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/kampanyalar");
  const { durum } = await searchParams;
  const activeTab: TabFilter =
    durum === "aktif" || durum === "planlanan" || durum === "sona-eren" ? durum : "tumu";

  const campaigns = await listMarketingCampaignsForAdmin();
  const now = new Date();
  const rows = campaigns.map((campaign) => ({
    campaign,
    status: resolveCampaignStatus(campaign, now),
  }));

  const counts = {
    tumu: rows.length,
    aktif: rows.filter((row) => row.status === "AKTIF" || row.status === "BUGUN_BITIYOR").length,
    planlanan: rows.filter((row) => row.status === "PLANLANDI").length,
    "sona-eren": rows.filter((row) => row.status === "SONA_ERDI").length,
  };

  const activeTabDef = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const filteredRows = activeTabDef.statuses
    ? rows.filter((row) => activeTabDef.statuses?.includes(row.status))
    : rows;

  return (
    <PageContainer maxWidthClassName="max-w-[1200px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Kampanyalar</h1>
          <Link
            href="/yonetim/kampanyalar/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Kampanya
          </Link>
        </div>
        <p className="text-foreground/60 text-sm">
          Günlük/haftalık/aylık kampanyaları planlayın, ana sayfa ve popup gösterimini yönetin.
        </p>
      </div>

      <nav aria-label="Kampanya durumu filtresi" className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const href = tab.key === "tumu" ? "/yonetim/kampanyalar" : `/yonetim/kampanyalar?durum=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-9 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brand border-brand text-brand-foreground"
                  : "border-border-muted text-foreground/70 hover:border-brand hover:text-brand"
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </Link>
          );
        })}
      </nav>

      {filteredRows.length === 0 ? (
        <div className="border-border-muted text-foreground/60 rounded-xl border p-8 text-center text-sm">
          {rows.length === 0 ? "Henüz bir kampanya oluşturulmadı." : "Bu filtrede kampanya yok."}
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-235 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Kampanya</th>
                <th className="px-4 py-3 font-semibold">Tür</th>
                <th className="px-4 py-3 font-semibold">Başlangıç</th>
                <th className="px-4 py-3 font-semibold">Bitiş</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Kalan</th>
                <th className="px-4 py-3 font-semibold">Ürün</th>
                <th className="px-4 py-3 font-semibold">Ana Sayfa</th>
                <th className="px-4 py-3 font-semibold">Popup</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {filteredRows.map(({ campaign, status }) => (
                <tr key={campaign.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{campaign.name}</td>
                  <td className="px-4 py-3">{CAMPAIGN_TYPE_LABELS[campaign.type]}</td>
                  <td className="px-4 py-3">{formatDate(campaign.startsAt)}</td>
                  <td className="px-4 py-3">{formatDate(campaign.endsAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={CAMPAIGN_STATUS_LABELS[status]} tone={CAMPAIGN_STATUS_TONE[status]} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatRemaining(campaign.endsAt, status, now)}</td>
                  <td className="px-4 py-3">{campaign.products.length}</td>
                  <td className="px-4 py-3">{campaign.showOnHomepage ? "Evet" : "—"}</td>
                  <td className="px-4 py-3">{campaign.showPopup ? "Evet" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/kampanyalar/${campaign.id}`}
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

      <p className="text-foreground/50 text-xs">
        Tekil ürün indirimi mi yönetmek istiyorsunuz?{" "}
        <Link
          href="/yonetim/kampanyalar/haftanin-firsatlari"
          className="text-brand font-semibold underline underline-offset-2"
        >
          Haftanın Fırsatları
        </Link>{" "}
        ekranını kullanabilirsiniz.
      </p>
    </PageContainer>
  );
}
