import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { requireAnyRole } from "@/server/auth/guard";
import { roleLabels } from "@/lib/role-labels";

export const metadata: Metadata = {
  title: "Personel",
  description: "Personel erişim doğrulama sayfası.",
};

export default async function PersonelPage() {
  const user = await requireAnyRole(["STAFF", "ADMIN"], "/personel");

  return (
    <PageContainer
      maxWidthClassName="max-w-sm"
      className="items-center justify-center gap-4 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Personel Alanı</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Erişim doğrulandı: {user.firstName} {user.lastName} ({roleLabels[user.role]}).
      </p>
    </PageContainer>
  );
}
