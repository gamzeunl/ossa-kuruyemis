import type { Metadata } from "next";
import Link from "next/link";
import {
  FeaturedPickAdminForm,
  type FeaturedPickAdminFormValues,
} from "@/components/admin/featured-pick-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listActiveProductOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Ayın Favorilerine Ürün Ekle" };

const EMPTY_VALUES: FeaturedPickAdminFormValues = {
  productId: "",
  sortOrder: 0,
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default async function AdminNewFeaturedPickPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/ayin-favorileri");
  const productOptions = await listActiveProductOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/ayin-favorileri" className="text-brand w-fit text-xs font-semibold">
          ← Ayın Favorileri
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Ürün Ekle</h1>
      </div>

      <FeaturedPickAdminForm initialValues={EMPTY_VALUES} productOptions={productOptions} />
    </PageContainer>
  );
}
