import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogAdminForm, type BlogAdminFormValues } from "@/components/admin/blog-admin-form";
import { PageContainer } from "@/components/layout/container";
import { toDateTimeLocalValue } from "@/lib/datetime-local";
import { requireRole } from "@/server/auth/guard";
import { findPostById } from "@/server/repositories/blog-repository";
import { listActiveProductOptions } from "@/server/repositories/product-repository";

export const metadata: Metadata = { title: "Blog Yazısını Düzenle" };

export default async function AdminEditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/blog");
  const { id } = await params;
  const [post, productOptions] = await Promise.all([findPostById(id), listActiveProductOptions()]);

  if (!post) {
    notFound();
  }

  const initialValues: BlogAdminFormValues = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? "",
    status: post.status,
    publishedAt: toDateTimeLocalValue(post.publishedAt),
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    productIds: post.products.map((entry) => entry.productId),
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/blog" className="text-brand w-fit text-xs font-semibold">
          ← Blog Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        {post.status === "PUBLISHED" ? (
          <p className="text-foreground/60 text-sm">/blog/{post.slug}</p>
        ) : null}
      </div>

      <BlogAdminForm postId={post.id} initialValues={initialValues} productOptions={productOptions} />
    </PageContainer>
  );
}
