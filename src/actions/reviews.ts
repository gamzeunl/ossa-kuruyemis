"use server";

import { ProductStatus } from "@/generated/prisma/client";
import { reviewFormSchema } from "@/lib/review-schema";
import { prisma } from "@/server/db/prisma";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  getProductReviews,
  submitReview,
  type ApprovedReviewRow,
} from "@/server/services/review-service";

export type ReviewActionResult = { ok: true } | { ok: false; message: string };

export async function submitReviewAction(input: unknown): Promise<ReviewActionResult> {
  const parsed = reviewFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Girdi doğrulanamadı." };
  }

  // Honeypot doluysa bot olduğu varsayılır; botlara ipucu vermeden başarı
  // döndürülür, kayıt oluşturulmaz (bkz. src/actions/contact.ts ile aynı desen).
  if (parsed.data.website.trim().length > 0) {
    return { ok: true };
  }

  // productId/userId hiçbir zaman client'a güvenilmeden kullanılmaz: oturum
  // sunucuda yeniden doğrulanır, ürünün varlığı/yayın durumu DB'den kontrol edilir.
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Yorum yapabilmek için giriş yapmalısınız." };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { status: true },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
      return { ok: false, message: "Bu ürün için şu anda yorum gönderilemiyor." };
    }

    await submitReview({
      productId: parsed.data.productId,
      userId: user.id,
      rating: parsed.data.rating,
      title: parsed.data.title && parsed.data.title.length > 0 ? parsed.data.title : null,
      content: parsed.data.content,
      displayName: parsed.data.displayName,
    });

    return { ok: true };
  } catch {
    return { ok: false, message: "Yorumunuz gönderilemedi. Lütfen daha sonra tekrar deneyin." };
  }
}

export type LoadMoreReviewsResult =
  | { ok: true; rows: ApprovedReviewRow[]; hasMore: boolean }
  | { ok: false };

/** "Daha fazla göster" — bir sonraki onaylı yorum sayfasını getirir; tüm liste ilk render'da çekilmez. */
export async function loadMoreReviewsAction(
  productId: string,
  page: number,
): Promise<LoadMoreReviewsResult> {
  if (!productId || page < 1) {
    return { ok: false };
  }
  try {
    const { rows, total, pageSize } = await getProductReviews(productId, page);
    return { ok: true, rows, hasMore: page * pageSize < total };
  } catch {
    return { ok: false };
  }
}
