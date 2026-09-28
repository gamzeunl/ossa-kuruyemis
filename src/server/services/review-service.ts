import { hasCompletedPurchase } from "@/server/repositories/order-repository";
import {
  getReviewAggregate,
  listApprovedReviews,
  upsertPendingReview,
  type ApprovedReviewRow,
  type ReviewAggregate,
  type UpsertPendingReviewInput,
} from "@/server/repositories/review-repository";

export type { ApprovedReviewRow, ReviewAggregate };

/**
 * Kullanıcının ürünü gerçekten satın alıp almadığını sunucuda doğrular —
 * `verifiedPurchase` bu kontrolün DIŞINDA hiçbir yolla belirlenmez.
 */
export async function verifyPurchase(userId: string, productId: string): Promise<boolean> {
  return hasCompletedPurchase(userId, productId);
}

export interface SubmitReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string;
  displayName: string;
}

/** Yorumu daima `PENDING` durumunda kaydeder; `verifiedPurchase` sunucuda yeniden hesaplanır. */
export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const verifiedPurchase = await verifyPurchase(input.userId, input.productId);
  const upsertInput: UpsertPendingReviewInput = { ...input, verifiedPurchase };
  await upsertPendingReview(upsertInput);
}

export async function getProductReviewAggregate(productId: string): Promise<ReviewAggregate> {
  return getReviewAggregate(productId);
}

const REVIEWS_PAGE_SIZE = 5;

export async function getProductReviews(
  productId: string,
  page: number,
): Promise<{ rows: ApprovedReviewRow[]; total: number; pageSize: number }> {
  const { rows, total } = await listApprovedReviews({ productId, page, pageSize: REVIEWS_PAGE_SIZE });
  return { rows, total, pageSize: REVIEWS_PAGE_SIZE };
}
