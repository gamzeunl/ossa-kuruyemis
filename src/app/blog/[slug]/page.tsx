import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/container";
import { BlogContent } from "@/components/blog/blog-content";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/ui/breadcrumb-json-ld";
import { publicEnv } from "@/config/env";
import { formatDate } from "@/lib/format-date";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { getBlogPostBySlug } from "@/server/services/blog-service";
import { listFavoritedProductIdSet } from "@/server/services/favorite-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Yazı bulunamadı" };
  }

  const title = post.metaTitle ?? post.title;
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  const canonical = `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonical = `${publicEnv.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`;

  const user = await betterAuthProvider.getCurrentUser();
  const favoritedProductIds = user
    ? await listFavoritedProductIdSet(
        user.id,
        post.relatedProducts.map((product) => product.id),
      )
    : new Set<string>();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverImageUrl
      ? { image: [`${publicEnv.NEXT_PUBLIC_SITE_URL}${post.coverImageUrl}`] }
      : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: "OSSA Kuruyemiş" },
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Ana Sayfa", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  return (
    <PageContainer maxWidthClassName="max-w-[800px]" className="gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} currentUrl={canonical} />

      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col gap-3">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        {post.publishedAt ? (
          <p className="text-foreground/50 text-sm">{formatDate(post.publishedAt)}</p>
        ) : null}
      </div>

      {post.coverImageUrl ? (
        <div className="bg-surface-muted relative aspect-[16/9] overflow-hidden rounded-2xl">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            unoptimized
            sizes="(min-width: 800px) 800px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <BlogContent content={post.content} />

      {post.relatedProducts.length > 0 ? (
        <section className="flex flex-col gap-5 pt-4">
          <h2 className="text-foreground text-xl font-bold tracking-tight">
            Bu yazıda geçen ürünler
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {post.relatedProducts.map((product) => (
              <ProductListCard
                key={product.id}
                product={product}
                isFavorited={favoritedProductIds.has(product.id)}
                isLoggedIn={Boolean(user)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
