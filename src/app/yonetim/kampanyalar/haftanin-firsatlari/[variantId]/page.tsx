import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiscountAdminForm, type DiscountAdminFormValues } from "@/components/admin/discount-admin-form";
import { PageContainer } from "@/components/layout/container";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import { requireRole } from "@/server/auth/guard";
import { findVariantForAdmin } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Fırsatı Düzenle" };

export default async function AdminEditDiscountPage({ params }: { params: Promise<{ variantId: string }> }) {
  await requireRole("ADMIN", "/yonetim/kampanyalar/haftanin-firsatlari");
  const { variantId } = await params;
  const variant = await findVariantForAdmin(variantId);

  if (!variant) {
    notFound();
  }

  const initialValues: DiscountAdminFormValues = {
    discountPrice: variant.discountPrice ? variant.discountPrice.toString() : "",
    startsAt: toDateTimeLocalValue(variant.discountStartsAt),
    endsAt: toDateTimeLocalValue(variant.discountEndsAt),
    isActive: variant.isDiscountActive,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/haftanin-firsatlari" className="text-brand w-fit text-xs font-semibold">
          ← Haftanın Fırsatları
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {variant.product.name} — {variant.name}
        </h1>
      </div>

      <DiscountAdminForm
        variantId={variant.id}
        variantLabel={`${variant.product.name} — ${variant.name}`}
        price={variant.price.toString()}
        initialValues={initialValues}
      />
    </PageContainer>
  );
}
