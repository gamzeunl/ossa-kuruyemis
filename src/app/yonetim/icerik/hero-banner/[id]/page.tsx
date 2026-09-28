import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBannerAction } from "@/actions/admin-banners";
import { BannerAdminForm, type BannerAdminFormValues } from "@/components/admin/banner-admin-form";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { findBannerById } from "@/server/repositories/banner-repository";

export const metadata: Metadata = { title: "Hero Banner'ı Düzenle" };

export default async function AdminEditHeroBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/icerik/hero-banner");
  const { id } = await params;
  const banner = await findBannerById(id);

  if (!banner || banner.type !== "HERO") {
    notFound();
  }

  const initialValues: BannerAdminFormValues = {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    imageUrl: banner.imageUrl,
    imageAlt: banner.imageAlt ?? "",
    primaryButtonLabel: banner.primaryButtonLabel,
    primaryButtonHref: banner.primaryButtonHref,
    secondaryButtonLabel: banner.secondaryButtonLabel ?? "",
    secondaryButtonHref: banner.secondaryButtonHref ?? "",
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/icerik/hero-banner" className="text-brand w-fit text-xs font-semibold">
          ← Hero Banner Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{banner.title}</h1>
      </div>

      <BannerAdminForm type="HERO" bannerId={banner.id} initialValues={initialValues} />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteBannerAction.bind(null, banner.id)}
          confirmMessage="Bu hero banner'ı silmek istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
