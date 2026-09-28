import {
  findPublishedPostBySlug,
  listPublishedPosts,
  type ListPublishedPostsParams,
} from "@/server/repositories/blog-repository";
import { getProductSummariesByIds } from "@/server/services/catalog-service";
import type { ProductSummary } from "@/types/catalog";

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  relatedProducts: ProductSummary[];
}

/** Yayındaki blog yazılarını sayfalı döner — taslaklar asla dahil olmaz. */
export async function listBlogPosts(
  params: ListPublishedPostsParams,
): Promise<{ items: BlogPostSummary[]; total: number }> {
  const { rows, total } = await listPublishedPosts(params);
  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      coverImageUrl: row.coverImageUrl,
      publishedAt: row.publishedAt,
    })),
    total,
  };
}

/**
 * Slug ile yayındaki bir yazıyı, ilişkili ürünleri (mevcut `ProductSummary`
 * dönüştürücüsü — `getProductSummariesByIds` — üzerinden, ikinci bir paralel
 * dönüştürücü kurulmadan) birlikte döner. İlişkili ürün yoksa boş dizi döner.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const row = await findPublishedPostBySlug(slug);
  if (!row) {
    return null;
  }

  const productIds = row.products.map((entry) => entry.productId);
  const relatedProducts = await getProductSummariesByIds(productIds);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    publishedAt: row.publishedAt,
    content: row.content,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    relatedProducts,
  };
}
