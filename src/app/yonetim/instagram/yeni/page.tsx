import type { Metadata } from "next";
import Link from "next/link";
import {
  InstagramPostAdminForm,
  type InstagramPostAdminFormValues,
} from "@/components/admin/instagram-post-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Instagram Gönderisi" };

const EMPTY_VALUES: InstagramPostAdminFormValues = {
  postUrl: "",
  caption: "",
  isActive: true,
  sortOrder: 0,
};

export default async function AdminNewInstagramPostPage() {
  await requireRole("ADMIN", "/yonetim/instagram");

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/instagram" className="text-brand w-fit text-xs font-semibold">
          ← Instagram Vitrini Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Instagram Gönderisi</h1>
      </div>

      <InstagramPostAdminForm initialValues={EMPTY_VALUES} />
    </PageContainer>
  );
}
