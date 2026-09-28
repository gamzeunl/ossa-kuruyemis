import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ContactChannels } from "@/components/contact/contact-channels";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactMap } from "@/components/contact/contact-map";
import { publicEnv } from "@/config/env";
import { getVerifiedBusinessInfoFields } from "@/lib/business-info";
import { getContactRequestTypeByQuerySlug } from "@/lib/contact-content";

export function generateMetadata(): Metadata {
  return {
    title: { absolute: "İletişim | OSSA Kuruyemiş" },
    description:
      "OSSA Kuruyemiş iletişim bilgilerine ulaşın. Telefon, WhatsApp, adres ve iletişim formu üzerinden bize kolayca ulaşabilirsiniz.",
    alternates: { canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/iletisim` },
  };
}

export default async function IletisimPage({
  searchParams,
}: {
  searchParams: Promise<{ talep?: string }>;
}) {
  const { talep } = await searchParams;
  const defaultRequestType = getContactRequestTypeByQuerySlug(talep);
  const businessInfoFields = getVerifiedBusinessInfoFields();

  return (
    <PageContainer maxWidthClassName="max-w-[1100px]" className="gap-10">
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "İletişim" },
        ]}
      />

      <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
        İletişim
      </h1>

      <section
        id="magaza"
        className="scroll-mt-24 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)] lg:gap-7"
      >
        <ContactMap />

        <div className="flex items-center">
            <div className="w-full translate-y-8">
            <ContactChannels />
          </div>
        </div>
      </section>

      <section className="border-border-muted rounded-2xl border bg-white p-5 sm:p-7 lg:p-9">
        <div className="mb-6 flex flex-col gap-1.5">
          <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
            Bize Ulaşın
          </h2>

          <p className="text-foreground/60 text-sm leading-6">
            Ürünlerimiz, siparişleriniz veya diğer konulardaki sorularınızı
            bize iletebilirsiniz.
          </p>
        </div>

        <ContactForm defaultRequestType={defaultRequestType} />
      </section>

      <section className="border-border-muted rounded-2xl border bg-white p-5 sm:p-7">
        <h2 className="text-brand mb-4 text-xs font-bold tracking-[0.14em] uppercase">İşletme Bilgileri</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {businessInfoFields.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <dt className="text-foreground/50 text-xs font-semibold uppercase">{field.label}</dt>
              <dd className="text-foreground font-medium wrap-break-word">
                {field.href ? (
                  <a href={field.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </PageContainer>
  );
}