import { ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export interface UpsertPendingReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string;
  displayName: string;
  verifiedPurchase: boolean;
}

/**
 * Aynı kullanıcının aynı ürüne tek aktif yorumu olur (`@@unique([productId,
 * userId])`) — yeni gönderim var olan yorumun üzerine yazar ve durumu her
 * zaman `PENDING`'e döndürür (önceki moderasyon kararı sıfırlanır).
 */
export async function upsertPendingReview(input: UpsertPendingReviewInput) {
  return prisma.review.upsert({
    where: { productId_userId: { productId: input.productId, userId: input.userId } },
    update: {
      rating: input.rating,
      title: input.title,
      content: input.content,
      displayName: input.displayName,
      verifiedPurchase: input.verifiedPurchase,
      status: ReviewStatus.PENDING,
      moderatedAt: null,
      moderatedById: null,
      rejectionReason: null,
    },
    create: {
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      displayName: input.displayName,
      verifiedPurchase: input.verifiedPurchase,
      status: ReviewStatus.PENDING,
    },
  });
}

export interface ReviewAggregate {
  average: number | null;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Ortalama puan + toplam yorum + 1-5 dağılımını TEK `groupBy` sorgusuyla
 * hesaplar — kart/PDP başına ayrı sorgu değil, çağıran taraf sonucu paylaşır.
 * Yalnızca `APPROVED` yorumlar sayılır.
 */
export async function getReviewAggregate(productId: string): Promise<ReviewAggregate> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, status: ReviewStatus.APPROVED },
    _count: { rating: true },
  });

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;

  for (const entry of grouped) {
    const rating = entry.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = entry._count.rating;
    }
    total += entry._count.rating;
    sum += entry.rating * entry._count.rating;
  }

  return { average: total > 0 ? sum / total : null, total, distribution };
}

export interface ListApprovedReviewsParams {
  productId: string;
  page: number;
  pageSize: number;
}

export interface ApprovedReviewRow {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  displayName: string;
  verifiedPurchase: boolean;
  createdAt: Date;
}

/** Onaylı yorumları en yeniden eskiye, sayfalı döner — tüm liste tek seferde çekilmez. */
export async function listApprovedReviews(
  params: ListApprovedReviewsParams,
): Promise<{ rows: ApprovedReviewRow[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: params.productId, status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        displayName: true,
        verifiedPurchase: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where: { productId: params.productId, status: ReviewStatus.APPROVED } }),
  ]);
  return { rows, total };
}

/** Yönetim moderasyon kuyruğu için belirli durumdaki tüm yorumları getirir. */
export async function listReviewsByStatus(status: ReviewStatus) {
  return prisma.review.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      title: true,
      content: true,
      displayName: true,
      verifiedPurchase: true,
      createdAt: true,
      rejectionReason: true,
      product: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

export interface ModerateReviewInput {
  reviewId: string;
  moderatorId: string;
  decision: ReviewStatus;
  rejectionReason?: string | null;
}

/** Bir yorumu onayla/reddet/yeniden beklet — moderatör kimliği ve zaman damgası her zaman sunucuda set edilir. */
export async function moderateReview(input: ModerateReviewInput) {
  return prisma.review.update({
    where: { id: input.reviewId },
    data: {
      status: input.decision,
      moderatedAt: input.decision === ReviewStatus.PENDING ? null : new Date(),
      moderatedById: input.decision === ReviewStatus.PENDING ? null : input.moderatorId,
      rejectionReason: input.decision === ReviewStatus.REJECTED ? (input.rejectionReason ?? null) : null,
    },
  });
}
