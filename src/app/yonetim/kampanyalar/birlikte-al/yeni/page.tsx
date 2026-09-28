import type { Metadata } from "next";
import Link from "next/link";
import {
  BundleOfferAdminForm,
  type BundleOfferAdminFormValues,
} from "@/components/admin/bundle-offer-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listActiveVariantOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Yeni Birlikte Al Kampanyası" };

const EMPTY_VALUES: BundleOfferAdminFormValues = {
  primaryVariantId: "",
  companionVariantId: "",
  companionPrice: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  sortOrder: 0,
};

export default async function AdminNewBundleOfferPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/birlikte-al");
  const variantOptions = await listActiveVariantOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/birlikte-al" className="text-brand w-fit text-xs font-semibold">
          ← Birlikte Al Kampanyaları
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Kampanya</h1>
      </div>

      <BundleOfferAdminForm initialValues={EMPTY_VALUES} variantOptions={variantOptions} />
    </PageContainer>
  );
}
