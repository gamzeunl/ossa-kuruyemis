import type { Metadata } from "next";
import Link from "next/link";
import { BannerAdminForm, type BannerAdminFormValues } from "@/components/admin/banner-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Banner" };

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

export default async function AdminNewBannerPage() {
  await requireRole("ADMIN", "/yonetim/icerik/banner");

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/icerik/banner" className="text-brand w-fit text-xs font-semibold">
          ← Banner Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Banner</h1>
      </div>

      <BannerAdminForm type="FULL_WIDTH" initialValues={EMPTY_VALUES} />
    </PageContainer>
  );
}
