import type { Metadata } from "next";
import Link from "next/link";
import { CategoryFaq } from "@/components/category/category-faq";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { publicEnv } from "@/config/env";
import { getSiteFaqTopics } from "@/content/site-faq";

export function generateMetadata(): Metadata {
  return {
    title: { absolute: "Sıkça Sorulan Sorular | OSSA Kuruyemiş" },
    description: "Sipariş, ödeme, kargo, ürünler, iade/değişim ve toplu sipariş hakkında sıkça sorulan sorular.",
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/sss` },
  };
}

/** Konuya göre, gerçekten var olan sayfalara yönlendiren küçük ek link — SSS cevabı sahte/anchor'suz bir "bkz." bırakmasın diye. */
const TOPIC_LINKS: Record<string, { href: string; label: string }> = {
  "İade / Değişim": { href: "/teslimat-iade", label: "Teslimat ve İade Koşulları sayfasını görüntüle" },
  "Toplu Sipariş": { href: "/iletisim?talep=kurumsal-toplu-siparis", label: "Toplu sipariş için iletişime geçin" },
};

export default async function SssPage() {
  const topics = await getSiteFaqTopics();

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-8">
      <Breadcrumb items={[{ label: "Ana Sayfa", href: "/" }, { label: "Sıkça Sorulan Sorular" }]} />

      <div className="flex flex-col gap-3">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Sıkça Sorulan Sorular
        </h1>
        <p className="text-foreground/60 max-w-2xl text-sm leading-6 sm:text-base">
          Sipariş, ödeme, kargo ve ürünlerimizle ilgili en çok merak edilen soruları bir araya getirdik. Aradığınız
          cevabı bulamazsanız bize ulaşmaktan çekinmeyin.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {topics.map((topic) => {
          const link = TOPIC_LINKS[topic.topic];
          return (
            <div key={topic.topic} className="flex flex-col gap-3">
              <CategoryFaq items={topic.items} heading={topic.topic} />
              {link ? (
                <Link href={link.href} className="text-brand hover:text-brand-dark w-fit text-sm font-semibold">
                  {link.label} →
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
