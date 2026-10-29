
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  deactivateMarketingCampaignAction,
  deleteMarketingCampaignAction,
} from "@/actions/admin-marketing-campaigns";

import { PageContainer } from "@/components/layout/container";
import { CampaignDeactivateForm } from "@/components/admin/campaign-deactivate-form";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { MarketingCampaignAdminForm } from "@/components/admin/marketing-campaign-admin-form";

import { toDateTimeLocalValue } from "@/lib/datetime-local";
import { requireRole } from "@/server/auth/guard";

import { findMarketingCampaignForAdmin } from "@/server/repositories/marketing-campaign-repository";
import { listActiveVariantOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = {
  title: "Kampanyayı Düzenle",
};

export default async function EditMarketingCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await requireRole(
    "ADMIN",
    `/yonetim/kampanyalar/${id}`
  );

  const [campaign, variantOptions] = await Promise.all([
    findMarketingCampaignForAdmin(id),
    listActiveVariantOptions(),
  ]);

  if (!campaign) {
    notFound();
  }

  /**
   * Kayıtlı ürün/varyant fiyatlarını forma aktar.
   *
   * Örnek:
   * {
   *   "variant-500g": "249.90",
   *   "variant-1kg": "449.90"
   * }
   */
  const campaignPrices: Record<string, string> = {};

  for (const product of campaign.products) {
    campaignPrices[product.variantId] =
      product.campaignPrice?.toString() ?? "";
  }

  return (
    <PageContainer
      maxWidthClassName="max-w-[1100px]"
      className="gap-6"
    >
      <div className="flex flex-col gap-1">
        <Link
          href="/yonetim/kampanyalar"
          className="text-brand w-fit text-xs font-semibold"
        >
          ← Kampanyalar
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          {campaign.name}
        </h1>
      </div>

      <MarketingCampaignAdminForm
        key={campaign.updatedAt.toISOString()}
        campaignId={campaign.id}
        variantOptions={variantOptions}
        initialValues={{
          name: campaign.name,
          type: campaign.type,

          startsAt: toDateTimeLocalValue(
            campaign.startsAt
          ),

          endsAt: toDateTimeLocalValue(
            campaign.endsAt
          ),

          headline: campaign.headline ?? "",
          description: campaign.description ?? "",

          sortOrder: campaign.sortOrder,

          isActive: campaign.isActive,
          showOnHomepage: campaign.showOnHomepage,
          showPopup: campaign.showPopup,

          variantIds: campaign.products.map(
            (product) => product.variantId
          ),

          campaignPrices,
        }}
      />

      <div className="border-border-muted flex flex-wrap items-center gap-4 border-t pt-6">
        {campaign.isActive ? (
          <CampaignDeactivateForm
            action={deactivateMarketingCampaignAction.bind(
              null,
              campaign.id
            )}
          />
        ) : null}

        <ContentDeleteForm
          action={deleteMarketingCampaignAction.bind(
            null,
            campaign.id
          )}
          confirmMessage="Bu kampanyayı kalıcı olarak silmek istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
