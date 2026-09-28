"use client";

import { useState, useTransition } from "react";
import { loadMoreReviewsAction } from "@/actions/reviews";
import { StarRatingDisplay } from "@/components/catalog/star-rating";
import { formatDate } from "@/lib/format-date";
import type { ApprovedReviewRow } from "@/server/services/review-service";

interface ReviewListProps {
  productId: string;
  initialRows: ApprovedReviewRow[];
  initialHasMore: boolean;
}

export function ReviewList({ productId, initialRows, initialHasMore }: ReviewListProps) {
  const [rows, setRows] = useState(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const result = await loadMoreReviewsAction(productId, nextPage);
      if (!result.ok) {
        return;
      }
      setRows((current) => [...current, ...result.rows]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {rows.map((review) => (
        <article key={review.id} className="border-border-muted border-b pb-5 last:border-b-0">
          <div className="flex flex-wrap items-center gap-2">
            <StarRatingDisplay rating={review.rating} />
            <span className="text-foreground text-sm font-semibold">{review.displayName}</span>
            {review.verifiedPurchase ? (
              <span className="bg-surface-muted text-foreground/60 rounded-full px-2 py-0.5 text-[11px] font-medium">
                Doğrulanmış Alışveriş
              </span>
            ) : null}
          </div>
          <p className="text-foreground/50 mt-1 text-xs">{formatDate(review.createdAt)}</p>
          {review.title ? (
            <p className="text-foreground mt-2 text-sm font-semibold">{review.title}</p>
          ) : null}
          {review.content ? (
            <p className="text-foreground/80 mt-1 text-sm leading-6 whitespace-pre-line">
              {review.content}
            </p>
          ) : null}
        </article>
      ))}

      {hasMore ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={isPending}
          className="border-border-muted hover:border-brand hover:text-brand min-h-11 w-fit rounded-full border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Yükleniyor…" : "Daha fazla göster"}
        </button>
      ) : null}
    </div>
  );
}
