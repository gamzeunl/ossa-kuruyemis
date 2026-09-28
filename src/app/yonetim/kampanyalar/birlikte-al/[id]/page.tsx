import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBundleOfferAction } from "@/actions/admin-bundle-offers";
import {
  BundleOfferAdminForm,
  type BundleOfferAdminFormValues,
} from "@/components/admin/bundle-offer-admin-form";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { PageContainer } from "@/components/layout/container";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import { requireRole } from "@/server/auth/guard";
import { findBundleOfferForAdmin } from "@/server/repositories/bundle-offer-repository";
import { listActiveVariantOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Kampanyayı Düzenle" };

export default async function AdminEditBundleOfferPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/kampanyalar/birlikte-al");
  const { id } = await params;
  const [bundle, variantOptions] = await Promise.all([
    findBundleOfferForAdmin(id),
    listActiveVariantOptions(),
  ]);

  if (!bundle) {
    notFound();
  }

  const initialValues: BundleOfferAdminFormValues = {
    primaryVariantId: bundle.primaryVariant.id,
    companionVariantId: bundle.companionVariant.id,
    companionPrice: bundle.companionPrice.toString(),
    startsAt: toDateTimeLocalValue(bundle.startsAt),
    endsAt: toDateTimeLocalValue(bundle.endsAt),
    isActive: bundle.isActive,
    sortOrder: bundle.sortOrder,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/birlikte-al" className="text-brand w-fit text-xs font-semibold">
          ← Birlikte Al Kampanyaları
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {bundle.primaryProduct.name} + {bundle.companionProduct.name}
        </h1>
      </div>

      <BundleOfferAdminForm
        bundleOfferId={bundle.id}
        initialValues={initialValues}
        variantOptions={variantOptions}
      />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteBundleOfferAction.bind(null, bundle.id)}
          confirmMessage="Bu kampanyayı silmek istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
