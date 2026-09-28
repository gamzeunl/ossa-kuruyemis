import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { SectionHeader } from "@/components/home/section-header";
import { formatDate } from "@/lib/format-date";
import type { BlogPostSummary } from "@/server/services/blog-service";

const HEADING_ID = "blog-onizleme-baslik";

/** `posts` zaten yalnızca PUBLISHED + son 3 kayıt (bkz. `getHomePageData`) — boşsa bölüm tamamen gizlenir. */
export function BlogPreviewSection({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={HEADING_ID} className={`bg-background ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <SectionHeader
          headingId={HEADING_ID}
          eyebrow="Blog"
          title="OSSA'dan İçerikler"
          subtitle="Ürünler, kullanım önerileri ve lezzet fikirleri üzerine içerikler."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {posts.map((post, index) => (
            <ScrollReveal key={post.id} delayMs={index * 70}>
              <Link
                href={`/blog/${post.slug}`}
                className="group border-border-muted bg-surface flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="bg-surface-muted relative aspect-16/10 overflow-hidden">
                  <ProductImage
                    src={post.coverImageUrl}
                    alt={post.title}
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {post.publishedAt ? (
                    <p className="text-foreground/50 text-xs">{formatDate(post.publishedAt)}</p>
                  ) : null}
                  <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-lg font-semibold transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt ? <p className="text-foreground/60 line-clamp-3 text-sm">{post.excerpt}</p> : null}
                  <span className="text-brand mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold">
                    Devamını Oku
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Link
            href="/blog"
            className="text-brand hover:text-brand-dark group/link inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            Tüm Yazıları Gör
            <span aria-hidden="true" className="transition-transform group-hover/link:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </HomeContainer>
    </section>
  );
}
