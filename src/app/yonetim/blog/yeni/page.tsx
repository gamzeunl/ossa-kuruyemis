import type { Metadata } from "next";
import Link from "next/link";
import { BlogAdminForm, type BlogAdminFormValues } from "@/components/admin/blog-admin-form";
import { PageContainer } from "@/components/layout/container";
import { requireRole } from "@/server/auth/guard";
import { listActiveProductOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Yeni Blog Yazısı" };

const EMPTY_VALUES: BlogAdminFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  status: "DRAFT",
  publishedAt: "",
  metaTitle: "",
  metaDescription: "",
  productIds: [],
};

export default async function AdminNewBlogPostPage() {
  await requireRole("ADMIN", "/yonetim/blog");
  const productOptions = await listActiveProductOptions();

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/blog" className="text-brand w-fit text-xs font-semibold">
          ← Blog Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni Blog Yazısı</h1>
      </div>

      <BlogAdminForm initialValues={EMPTY_VALUES} productOptions={productOptions} />
    </PageContainer>
  );
}
