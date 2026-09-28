import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "OSSA Kuruyemiş hesabınıza giriş yapın.",
  robots: { index: false, follow: false },
};

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;

  return (
    <PageContainer maxWidthClassName="max-w-sm" className="justify-center gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Hesabınıza giriş yaparak siparişlerinizi ve bilgilerinizi yönetin.
        </p>
      </div>

      <SignInForm redirectTo={callbackURL} />

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Hesabınız yok mu?{" "}
        <Link
          href="/kayit"
          className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
        >
          Kayıt olun
        </Link>
      </p>
    </PageContainer>
  );
}
