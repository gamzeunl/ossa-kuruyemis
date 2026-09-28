import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { MarketingCampaignAdminForm } from "@/components/admin/marketing-campaign-admin-form";
import { requireRole } from "@/server/auth/guard";
import { listActiveVariantOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Yeni Kampanya" };

export default async function NewMarketingCampaignPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/yeni");
  const variantOptions = await listActiveVariantOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar" className="text-brand w-fit text-xs font-semibold">
          ← Kampanyalar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Kampanya</h1>
      </div>

      <MarketingCampaignAdminForm
        variantOptions={variantOptions}
        initialValues={{
          name: "",
          type: "WEEKLY",
          startsAt: "",
          endsAt: "",
          headline: "",
          description: "",
          sortOrder: 0,
          isActive: true,
          showOnHomepage: true,
          showPopup: false,
          variantIds: [],
        }}
      />
    </PageContainer>
  );
}
