"use server";

import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@/generated/prisma/client";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { moderateReview } from "@/server/repositories/review-repository";

const AUDIT_ACTION_BY_DECISION: Partial<Record<ReviewStatus, string>> = {
  [ReviewStatus.APPROVED]: "REVIEW_APPROVED",
  [ReviewStatus.REJECTED]: "REVIEW_REJECTED",
};

/**
 * Yorum onayla/reddet/yeniden beklet — moderatör kimliği her zaman sunucudaki
 * oturumdan gelir (client'tan gönderilemez), ADMIN rolü tekrar doğrulanır.
 * `reviewId`/`decision` `.bind()` ile önceden bağlanır (bkz. `admin/review-list.tsx`).
 */
export async function moderateReviewAction(
  reviewId: string,
  decision: ReviewStatus,
  formData: FormData,
): Promise<void> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return;
  }

  const rejectionReason =
    decision === ReviewStatus.REJECTED
      ? String(formData.get("rejectionReason") ?? "").trim() || null
      : null;

  await moderateReview({ reviewId, moderatorId: admin.id, decision, rejectionReason });

  const auditAction = AUDIT_ACTION_BY_DECISION[decision];
  if (auditAction) {
    await recordAuditLog({
      actorId: admin.id,
      action: auditAction,
      entityType: "Review",
      entityId: reviewId,
    });
  }

  revalidatePath("/yonetim/yorumlar");
}
