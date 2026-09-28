import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteFeaturedPickAction } from "@/actions/admin-featured-picks";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import {
  FeaturedPickAdminForm,
  type FeaturedPickAdminFormValues,
} from "@/components/admin/featured-pick-admin-form";
import { PageContainer } from "@/components/layout/container";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import { requireRole } from "@/server/auth/guard";
import { findFeaturedPickById } from "@/server/repositories/featured-pick-repository";
import { listActiveProductOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Ayın Favorisini Düzenle" };

export default async function AdminEditFeaturedPickPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/kampanyalar/ayin-favorileri");
  const { id } = await params;
  const [pick, productOptions] = await Promise.all([findFeaturedPickById(id), listActiveProductOptions()]);

  if (!pick) {
    notFound();
  }

  const initialValues: FeaturedPickAdminFormValues = {
    productId: pick.productId,
    sortOrder: pick.sortOrder,
    startsAt: toDateTimeLocalValue(pick.startsAt),
    endsAt: toDateTimeLocalValue(pick.endsAt),
    isActive: pick.isActive,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[640px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kampanyalar/ayin-favorileri" className="text-brand w-fit text-xs font-semibold">
          ← Ayın Favorileri
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{pick.product.name}</h1>
      </div>

      <FeaturedPickAdminForm pickId={pick.id} initialValues={initialValues} productOptions={productOptions} />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteFeaturedPickAction.bind(null, pick.id)}
          confirmMessage="Bu ürünü Ayın Favorileri'nden kaldırmak istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
