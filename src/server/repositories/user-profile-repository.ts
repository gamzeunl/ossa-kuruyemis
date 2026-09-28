import { prisma } from "@/server/db/prisma";

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });
}

export interface ProfileUpdateFields {
  firstName: string;
  lastName: string;
  phone: string | null;
}

/** `id` her zaman oturumdaki kullanıcıdan gelir — istemciden başka bir id kabul edilmez. */
export async function updateUserProfile(userId: string, fields: ProfileUpdateFields) {
  return prisma.user.update({ where: { id: userId }, data: fields });
}
