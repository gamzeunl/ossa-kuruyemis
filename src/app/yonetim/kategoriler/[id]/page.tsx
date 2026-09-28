import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCategoryAction } from "@/actions/admin-categories";
import { CategoryAdminForm, type CategoryAdminFormValues } from "@/components/admin/category-admin-form";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { findCategoryById } from "@/server/repositories/category-repository";

export const metadata: Metadata = { title: "Kategoriyi Düzenle" };

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/kategoriler");
  const { id } = await params;
  const category = await findCategoryById(id);

  if (!category) {
    notFound();
  }

  const initialValues: CategoryAdminFormValues = {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl,
    imageAlt: category.imageAlt ?? "",
    isActive: category.isActive,
    sortOrder: category.sortOrder,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/kategoriler" className="text-brand w-fit text-xs font-semibold">
          ← Kategori Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
      </div>

      <CategoryAdminForm categoryId={category.id} initialValues={initialValues} />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteCategoryAction.bind(null, category.id)}
          confirmMessage="Bu kategoriyi silmek istediğinize emin misiniz? Bağlı ürün varsa silme reddedilir."
        />
      </div>
    </PageContainer>
  );
}
