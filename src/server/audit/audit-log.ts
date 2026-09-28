import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

interface RecordAuditLogInput {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
}

/**
 * Tüm admin mutasyon server action'larının tek AuditLog yazma noktası —
 * `actorId` her zaman sunucuda doğrulanmış oturumdan gelir, hiçbir zaman
 * client'tan alınmaz.
 */
export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
