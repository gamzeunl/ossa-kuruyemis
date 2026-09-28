import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { getContactRequestTypeOption } from "@/lib/contact-content";
import { formatDate } from "@/lib/format-date";
import { requireRole } from "@/server/auth/guard";
import { listRecentContactRequests } from "@/server/repositories/contact-repository";

export const metadata: Metadata = { title: "İletişim Talepleri" };

/** Salt-okunur liste — moderasyon/durum değişikliği bu görevin kapsamında değil (dashboard'daki "Tüm Talepleri Gör" bağlantısı için). */
const LIST_LIMIT = 200;

export default async function AdminContactRequestsPage() {
  await requireRole("ADMIN", "/yonetim/iletisim");
  const requests = await listRecentContactRequests(LIST_LIMIT);

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">İletişim Talepleri</h1>
        <p className="text-foreground/60 text-sm">{requests.length} talep</p>
      </div>

      {requests.length === 0 ? (
        <div role="status" className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm">
          Henüz iletişim talebi bulunmuyor.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">Talep Türü</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">E-posta</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{request.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getContactRequestTypeOption(request.requestType)?.label ?? request.requestType}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.phone ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.email ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(request.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
