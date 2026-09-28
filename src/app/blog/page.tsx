import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { PageContainer } from "@/components/layout/container";
import { formatDate } from "@/lib/format-date";
import { listBlogPosts } from "@/server/services/blog-service";

export const metadata: Metadata = {
  title: "Blog",
  description: "OSSA Kuruyemiş'ten kuruyemiş, lokum ve kuru meyve dünyasına dair yazılar.",
};

const PAGE_SIZE = 9;

function parsePage(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const { sayfa } = await searchParams;
  const page = parsePage(sayfa);
  const { items, total } = await listBlogPosts({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer maxWidthClassName="max-w-[1200px]" className="gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Blog</h1>
        <p className="text-foreground/60 text-sm">
          Kuruyemiş, lokum ve kuru meyve dünyasından yazılar.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          role="status"
          className="border-border-muted text-foreground/60 rounded-md border p-10 text-center text-sm"
        >
          Henüz yayınlanmış bir yazı bulunmuyor.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group border-border-muted bg-surface flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
            >
              <div className="bg-surface-muted relative aspect-[16/10] overflow-hidden">
                <ProductImage
                  src={post.coverImageUrl}
                  alt={post.title}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                {post.publishedAt ? (
                  <p className="text-foreground/50 text-xs">{formatDate(post.publishedAt)}</p>
                ) : null}
                <h2 className="text-foreground group-hover:text-brand line-clamp-2 text-lg font-semibold transition-colors">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p className="text-foreground/60 line-clamp-3 text-sm">{post.excerpt}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-center gap-4 pt-4">
          {page > 1 ? (
            <Link
              href={`/blog?sayfa=${page - 1}`}
              className="border-border-muted hover:border-brand hover:text-brand rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              Önceki
            </Link>
          ) : null}
          <span className="text-foreground/60 text-sm">
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/blog?sayfa=${page + 1}`}
              className="border-border-muted hover:border-brand hover:text-brand rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              Sonraki
            </Link>
          ) : null}
        </nav>
      ) : null}
    </PageContainer>
  );
}
