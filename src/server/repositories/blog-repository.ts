import { BlogPostStatus, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

function publishedWhere(): Prisma.BlogPostWhereInput {
  return { status: BlogPostStatus.PUBLISHED, publishedAt: { lte: new Date() } };
}

const publishedListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  publishedAt: true,
} satisfies Prisma.BlogPostSelect;

export type PublishedPostListRow = Prisma.BlogPostGetPayload<{ select: typeof publishedListSelect }>;

export interface ListPublishedPostsParams {
  page: number;
  pageSize: number;
}

/** Yalnızca yayında VE yayın zamanı gelmiş yazıları en yeniden eskiye, sayfalı döner. Taslaklar asla dahil olmaz. */
export async function listPublishedPosts(
  params: ListPublishedPostsParams,
): Promise<{ rows: PublishedPostListRow[]; total: number }> {
  const where = publishedWhere();
  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: publishedListSelect,
      orderBy: { publishedAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);
  return { rows, total };
}

const publishedDetailSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  products: {
    orderBy: { sortOrder: "asc" },
    select: { productId: true },
  },
} satisfies Prisma.BlogPostSelect;

export type PublishedPostDetailRow = Prisma.BlogPostGetPayload<{ select: typeof publishedDetailSelect }>;

/** Slug ile yayındaki bir yazıyı ilişkili ürün id'leriyle birlikte getirir; taslak/yayın-zamanı gelmemiş yazı asla dönmez. */
export async function findPublishedPostBySlug(slug: string): Promise<PublishedPostDetailRow | null> {
  return prisma.blogPost.findFirst({
    where: { slug, ...publishedWhere() },
    select: publishedDetailSelect,
  });
}

export interface BlogSlugForSitemap {
  slug: string;
  updatedAt: Date;
}

/** `sitemap.ts` için — yalnızca slug/updatedAt; taslak/yayın-zamanı gelmemiş yazı asla dahil edilmez. */
export async function listPublishedPostSlugsForSitemap(): Promise<BlogSlugForSitemap[]> {
  return prisma.blogPost.findMany({
    where: publishedWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });
}

// ==================== Yönetim ====================

const adminListSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
} satisfies Prisma.BlogPostSelect;

export type AdminPostListRow = Prisma.BlogPostGetPayload<{ select: typeof adminListSelect }>;

/** Yönetim listesi — taslak dahil TÜM yazılar. */
export async function listAllPosts(): Promise<AdminPostListRow[]> {
  return prisma.blogPost.findMany({ select: adminListSelect, orderBy: { updatedAt: "desc" } });
}

const adminDetailSelect = {
  id: true,
  authorId: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImageUrl: true,
  status: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  products: {
    orderBy: { sortOrder: "asc" },
    select: { productId: true },
  },
} satisfies Prisma.BlogPostSelect;

export type AdminPostDetailRow = Prisma.BlogPostGetPayload<{ select: typeof adminDetailSelect }>;

export async function findPostById(id: string): Promise<AdminPostDetailRow | null> {
  return prisma.blogPost.findUnique({ where: { id }, select: adminDetailSelect });
}

export interface BlogPostFields {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  productIds: string[];
}

/** Bir yazının ilişkili ürünlerini tamamen değiştirir (basit/güvenli "hepsini yeniden yaz" yaklaşımı). */
async function replaceBlogPostProducts(
  tx: Prisma.TransactionClient,
  blogPostId: string,
  productIds: string[],
): Promise<void> {
  await tx.blogPostProduct.deleteMany({ where: { blogPostId } });
  if (productIds.length > 0) {
    await tx.blogPostProduct.createMany({
      data: productIds.map((productId, index) => ({ blogPostId, productId, sortOrder: index })),
    });
  }
}

export async function createPost(authorId: string, input: BlogPostFields) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.blogPost.create({
      data: {
        authorId,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        publishedAt: input.publishedAt,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
      },
    });
    await replaceBlogPostProducts(tx, post.id, input.productIds);
    return post;
  });
}

export async function updatePost(id: string, input: BlogPostFields) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.blogPost.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        publishedAt: input.publishedAt,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
      },
    });
    await replaceBlogPostProducts(tx, id, input.productIds);
    return post;
  });
}
