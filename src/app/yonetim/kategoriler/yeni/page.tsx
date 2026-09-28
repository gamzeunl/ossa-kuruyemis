import type { Metadata } from "next";
import Link from "next/link";
import { CategoryAdminForm, type CategoryAdminFormValues } from "@/components/admin/category-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";

export const metadata: Metadata = { title: "Yeni Kategori" };

const EMPTY_VALUES: CategoryAdminFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  imageAlt: "",
  isActive: true,
  sortOrder: 0,
};

export default async function AdminNewCategoryPage() {
  await requireRole("ADMIN", "/yonetim/kategoriler/yeni");

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kategoriler" className="text-brand w-fit text-xs font-semibold">
          ← Kategori Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Kategori</h1>
      </div>

      <CategoryAdminForm initialValues={EMPTY_VALUES} />
    </PageContainer>
  );
}
