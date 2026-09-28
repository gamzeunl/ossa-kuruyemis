import type { ReactNode } from "react";
import { MapPinIcon, PhoneCallIcon, WhatsAppIcon } from "@/components/ui/icons";
import { contactInfo } from "@/lib/contact-content";

interface ChannelItemProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  ctaLabel?: string;
  href?: string;
  external?: boolean;
  whatsapp?: boolean;
}

function ChannelItem({
  icon,
  title,
  description,
  ctaLabel,
  href,
  external,
  whatsapp = false,
}: ChannelItemProps) {
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  const content = (
    <div className="flex items-start gap-4 p-5 sm:p-6">
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          whatsapp
            ? "bg-[#25D366]/10 text-[#1eae54]"
            : "bg-brand/10 text-brand",
        ].join(" ")}
      >
        {icon}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-foreground text-sm font-bold">
          {title}
        </span>

        <div className="text-foreground/60 text-sm leading-5">
          {description}
        </div>

        {ctaLabel ? (
          <span
            className={[
              "mt-1 inline-flex items-center gap-1 text-sm font-bold",
              whatsapp ? "text-[#1eae54]" : "text-brand",
            ].join(" ")}
          >
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      {...externalProps}
      className="group block transition-colors hover:bg-black/[0.015]"
    >
      {content}
    </a>
  );
}

export function ContactChannels() {
  const { phone, whatsapp, address } = contactInfo;

  return (
    <div className="border-border-muted overflow-hidden rounded-2xl border bg-white">
      {whatsapp ? (
        <div className="border-border-muted border-b">
          <ChannelItem
            icon={<WhatsAppIcon aria-hidden="true" className="h-5 w-5" />}
            title="WhatsApp"
            description="Ürün ve siparişleriniz için bize yazın."
            ctaLabel="WhatsApp'tan Yaz"
            href={whatsapp.href ?? "#"}
            external
            whatsapp
          />
        </div>
      ) : null}

      {phone ? (
        <div className="border-border-muted border-b">
          <ChannelItem
            icon={<PhoneCallIcon aria-hidden="true" className="h-5 w-5" />}
            title="Telefon"
            description={phone.value}
            ctaLabel="Ara"
            href={phone.href ?? "#"}
          />
        </div>
      ) : null}

      {address ? (
        <ChannelItem
          icon={<MapPinIcon aria-hidden="true" className="h-5 w-5" />}
          title="Adres"
          description={address.value}
        />
      ) : null}
    </div>
  );
}