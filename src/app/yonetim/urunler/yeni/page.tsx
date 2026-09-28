import type { Metadata } from "next";
import Link from "next/link";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listActiveCategoryOptions } from "@/server/repositories/category-repository";

export const metadata: Metadata = { title: "Yeni Ürün" };

export default async function AdminNewProductPage() {
  await requireRole("ADMIN", "/yonetim/urunler/yeni");
  const categoryOptions = await listActiveCategoryOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/urunler" className="text-brand w-fit text-xs font-semibold">
          ← Ürün Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Ürün</h1>
      </div>

      <ProductCreateForm categoryOptions={categoryOptions} />
    </PageContainer>
  );
}
