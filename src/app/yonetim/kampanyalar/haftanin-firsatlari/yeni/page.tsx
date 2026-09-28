import type { Metadata } from "next";
import Link from "next/link";
import { DiscountAdminForm, type DiscountAdminFormValues } from "@/components/admin/discount-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listActiveVariantOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Yeni Fırsat" };

const EMPTY_VALUES: DiscountAdminFormValues = {
  discountPrice: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default async function AdminNewDiscountPage() {
  await requireRole("ADMIN", "/yonetim/kampanyalar/haftanin-firsatlari");
  const variantOptions = await listActiveVariantOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/haftanin-firsatlari" className="text-brand w-fit text-xs font-semibold">
          ← Haftanın Fırsatları
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Fırsat</h1>
      </div>

      <DiscountAdminForm price="0" initialValues={EMPTY_VALUES} variantOptions={variantOptions} />
    </PageContainer>
  );
}
