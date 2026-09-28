import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Yetkisiz Erişim",
  description: "Bu sayfaya erişim yetkiniz bulunmuyor.",
};

export default function YetkisizPage() {
  return (
    <PageContainer
      maxWidthClassName="max-w-sm"
      className="items-center justify-center gap-4 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Yetkisiz Erişim</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.
      </p>
      <Link
        href="/hesabim"
        className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
      >
        Hesabıma dön
      </Link>
    </PageContainer>
  );
}
