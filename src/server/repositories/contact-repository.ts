import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { ContactFormSchema } from "@/lib/contact-schema";

/**
 * `/iletisim` formundan doğrulanmış veriyi kaydeder. IP/user-agent gibi
 * gereksiz kişisel veri toplanmaz — yalnızca kullanıcının kendi girdiği alanlar
 * yazılır.
 */
export async function createContactRequest(data: ContactFormSchema): Promise<{ id: string }> {
  const createData: Prisma.ContactRequestCreateInput = {
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    requestType: data.requestType,
    eventDate: data.eventDate ? new Date(data.eventDate) : null,
    estimatedGuestCount: data.estimatedGuestCount ? Number(data.estimatedGuestCount) : null,
    message: data.message,
  };

  return prisma.contactRequest.create({
    data: createData,
    select: { id: true },
  });
}

const recentContactRequestSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  requestType: true,
  createdAt: true,
} satisfies Prisma.ContactRequestSelect;

export type RecentContactRequestRow = Prisma.ContactRequestGetPayload<{
  select: typeof recentContactRequestSelect;
}>;

/**
 * En yeni iletişim talepleri — dashboard widget'ı (`limit:5`) VE `/yonetim/iletisim`
 * salt-okunur liste sayfası (`limit:200`) AYNI fonksiyonu kullanır, ek sorgu YOK.
 */
export async function listRecentContactRequests(limit: number): Promise<RecentContactRequestRow[]> {
  return prisma.contactRequest.findMany({
    select: recentContactRequestSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Dashboard "İletişim Talebi" KPI'ı — gerçek `NEW` (henüz incelenmemiş) sayısı, `listRecentContactRequests`'in sabit `limit`'ine bağlı değil. */
export async function countNewContactRequests(): Promise<number> {
  return prisma.contactRequest.count({ where: { status: "NEW" } });
}
