import type { Metadata } from "next";
import Link from "next/link";
import { moderateReviewAction } from "@/actions/admin-reviews";
import { PageContainer } from "@/components/layout/container";
import { StarRatingDisplay } from "@/components/catalog/star-rating";
import { formatDate } from "@/lib/format-date";
import { ReviewStatus } from "@/generated/prisma/client";
import { requireRole } from "@/server/auth/guard";
import { listReviewsByStatus } from "@/server/repositories/review-repository";

export const metadata: Metadata = { title: "Yorum Moderasyonu" };

const TABS: { status: ReviewStatus; label: string }[] = [
  { status: ReviewStatus.PENDING, label: "Bekleyen" },
  { status: ReviewStatus.APPROVED, label: "Onaylı" },
  { status: ReviewStatus.REJECTED, label: "Reddedilen" },
];

function parseStatus(value: string | undefined): ReviewStatus {
  return TABS.some((tab) => tab.status === value) ? (value as ReviewStatus) : ReviewStatus.PENDING;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/yorumlar");
  const { durum } = await searchParams;
  const status = parseStatus(durum);
  const reviews = await listReviewsByStatus(status);

  return (
    <PageContainer maxWidthClassName="max-w-[1000px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yorum Moderasyonu</h1>
      </div>

      <nav className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/yonetim/yorumlar?durum=${tab.status}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              status === tab.status
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border-muted text-foreground hover:border-brand"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <div
          role="status"
          className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm"
        >
          Bu durumda yorum bulunmuyor.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <article key={review.id} className="border-border-muted bg-surface rounded-xl border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRatingDisplay rating={review.rating} />
                  <Link
                    href={`/urunler/${review.product.slug}`}
                    className="text-brand text-sm font-semibold underline underline-offset-2"
                  >
                    {review.product.name}
                  </Link>
                </div>
                <span className="text-foreground/50 text-xs">{formatDate(review.createdAt)}</span>
              </div>

              <p className="text-foreground/70 mt-2 text-xs">
                {review.displayName}
                {review.user ? ` · ${review.user.firstName} ${review.user.lastName} (${review.user.email})` : ""}
                {review.verifiedPurchase ? " · Doğrulanmış Alışveriş" : ""}
              </p>

              {review.title ? (
                <p className="text-foreground mt-3 text-sm font-semibold">{review.title}</p>
              ) : null}
              {review.content ? (
                <p className="text-foreground/80 mt-1 text-sm leading-6 whitespace-pre-line">
                  {review.content}
                </p>
              ) : null}
              {review.rejectionReason ? (
                <p className="mt-2 text-xs font-medium text-red-700">
                  Ret nedeni: {review.rejectionReason}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {status !== ReviewStatus.APPROVED ? (
                  <form action={moderateReviewAction.bind(null, review.id, ReviewStatus.APPROVED)}>
                    <button
                      type="submit"
                      className="min-h-9 rounded-full bg-green-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      Onayla
                    </button>
                  </form>
                ) : null}

                {status !== ReviewStatus.REJECTED ? (
                  <form
                    action={moderateReviewAction.bind(null, review.id, ReviewStatus.REJECTED)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      type="text"
                      name="rejectionReason"
                      placeholder="Ret nedeni (isteğe bağlı)"
                      className="border-border-muted min-h-9 rounded-lg border px-3 text-xs"
                    />
                    <button
                      type="submit"
                      className="min-h-9 rounded-full bg-red-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Reddet
                    </button>
                  </form>
                ) : null}

                {status !== ReviewStatus.PENDING ? (
                  <form action={moderateReviewAction.bind(null, review.id, ReviewStatus.PENDING)}>
                    <button
                      type="submit"
                      className="border-border-muted hover:border-brand min-h-9 rounded-full border px-4 text-xs font-semibold transition-colors"
                    >
                      Beklemeye al
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
