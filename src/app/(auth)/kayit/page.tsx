import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  description: "OSSA Kuruyemiş hesabı oluşturun.",
  robots: { index: false, follow: false },
};

export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;

  return (
    <PageContainer maxWidthClassName="max-w-sm" className="justify-center gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Hesap Oluştur</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          OSSA Kuruyemiş&apos;te alışverişe başlamak için bilgilerinizi girin.
        </p>
      </div>

      <SignUpForm redirectTo={callbackURL} />

      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Zaten hesabınız var mı?{" "}
        <Link
          href="/giris"
          className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
        >
          Giriş yapın
        </Link>
      </p>
    </PageContainer>
  );
}
