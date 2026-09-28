import type { Metadata } from "next";
import Link from "next/link";
import { BannerAdminForm, type BannerAdminFormValues } from "@/components/admin/banner-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Hero Banner" };

const EMPTY_VALUES: BannerAdminFormValues = {
  title: "",
  subtitle: "",
  imageUrl: null,
  imageAlt: "",
  primaryButtonLabel: "",
  primaryButtonHref: "",
  secondaryButtonLabel: "",
  secondaryButtonHref: "",
  isActive: true,
  sortOrder: 0,
};

export default async function AdminNewHeroBannerPage() {
  await requireRole("ADMIN", "/yonetim/icerik/hero-banner");

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/icerik/hero-banner" className="text-brand w-fit text-xs font-semibold">
          ← Hero Banner Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Hero Banner</h1>
      </div>

      <BannerAdminForm type="HERO" initialValues={EMPTY_VALUES} />
    </PageContainer>
  );
}
