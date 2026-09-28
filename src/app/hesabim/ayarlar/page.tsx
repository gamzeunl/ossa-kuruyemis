import type { Metadata } from "next";
import Link from "next/link";
import { PasswordSettingsForm } from "@/components/account/password-settings-form";
import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { PageContainer } from "@/components/layout/container";
import { requireUser } from "@/server/auth/guard";
import { getUserProfile } from "@/server/repositories/user-profile-repository";

export const metadata: Metadata = {
  title: "Hesap Ayarları",
  description: "Profil ve hesap bilgilerinizi güncelleyin.",
};

export default async function HesapAyarlariPage() {
  const user = await requireUser("/hesabim/ayarlar");
  const profile = await getUserProfile(user.id);

  return (
    <PageContainer maxWidthClassName="max-w-2xl" className="gap-8">
      <div className="flex flex-col gap-1">
        <Link href="/hesabim" className="text-brand w-fit text-xs font-semibold">
          ← Hesabım
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Hesap Ayarları</h1>
        <p className="text-foreground/60 text-sm">Profil ve hesap bilgilerinizi güncelleyin.</p>
      </div>

      <section className="border-border-muted bg-surface flex flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground text-base font-bold">Profil Bilgileri</h2>
        <ProfileSettingsForm
          email={profile?.email ?? user.email}
          firstName={profile?.firstName ?? user.firstName}
          lastName={profile?.lastName ?? user.lastName}
          phone={profile?.phone ?? ""}
        />
      </section>

      <section className="border-border-muted bg-surface flex flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground text-base font-bold">Şifre</h2>
        <PasswordSettingsForm />
      </section>
    </PageContainer>
  );
}
