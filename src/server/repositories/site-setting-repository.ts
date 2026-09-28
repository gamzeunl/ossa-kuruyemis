import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

/** Genel amaçlı key-value ayar deposu (`dot.notation` anahtarlar, bkz. `prisma/seed.ts`) — burada Instagram token cache'i için de kullanılır. */
export async function getSiteSettingJson<T>(key: string): Promise<T | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key }, select: { value: true } });
  return row ? (row.value as T) : null;
}

export async function setSiteSettingJson(
  key: string,
  value: Prisma.InputJsonValue,
  description?: string,
): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, description },
  });
}
