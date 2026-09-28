import { ReviewComposer } from "@/components/catalog/review-composer";
import { ReviewList } from "@/components/catalog/review-list";
import { StarRatingDisplay } from "@/components/catalog/star-rating";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import type { ApprovedReviewRow, ReviewAggregate } from "@/server/services/review-service";

const RATING_ORDER = [5, 4, 3, 2, 1] as const;

interface ProductReviewsProps {
  productId: string;
  /** Girişsiz kullanıcı için "Giriş Yap" bağlantısının döneceği sayfa. */
  productPath: string;
  aggregate: ReviewAggregate;
  firstPage: { rows: ApprovedReviewRow[]; total: number; pageSize: number };
}

/**
 * `aggregate`/`firstPage` üst sayfadan (`page.tsx`) prop olarak alınır — aynı
 * veri Product JSON-LD için de kullanıldığından burada tekrar sorgulanmaz.
 */
export async function ProductReviews({
  productId,
  productPath,
  aggregate,
  firstPage,
}: ProductReviewsProps) {
  const user = await betterAuthProvider.getCurrentUser();
  const hasMore = firstPage.pageSize < firstPage.total;
  const average = aggregate.average ?? 0;

  return (
    <section id="yorumlar" className="flex flex-col gap-6">
      <ReviewComposer productId={productId} isLoggedIn={Boolean(user)} productPath={productPath} />

      {aggregate.total > 0 ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-1 sm:w-40">
            <span className="text-foreground text-4xl font-bold">
              {average.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
            </span>
            <StarRatingDisplay rating={average} size="md" />
            <span className="text-foreground/60 text-xs">{aggregate.total} değerlendirme</span>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            {RATING_ORDER.map((star) => {
              const count = aggregate.distribution[star];
              const percent = Math.round((count / aggregate.total) * 100);
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-foreground/60 w-12 shrink-0">{star} yıldız</span>
                  <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div className="bg-brand h-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-foreground/50 w-6 shrink-0 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-foreground/60 text-sm">
          Bu ürün için henüz yorum yapılmamış. İlk değerlendirmeyi siz paylaşabilirsiniz.
        </p>
      )}

      <ReviewList productId={productId} initialRows={firstPage.rows} initialHasMore={hasMore} />
    </section>
  );
}
