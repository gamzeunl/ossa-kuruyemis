import { contactInfo } from "@/lib/contact-content";

export function ContactMap() {
  const address = contactInfo.address?.value;

  const mapSrc = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
    : null;

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4">
        <span className="text-brand text-xs font-bold tracking-[0.2em] uppercase">
          OSSA Kuruyemiş
        </span>

        <h2 className="text-foreground mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          Mağazamız
        </h2>
      </div>

      {mapSrc ? (
        <div className="border-border-muted min-h-[390px] flex-1 overflow-hidden rounded-2xl border bg-white">
          <iframe
            src={mapSrc}
            title="OSSA Kuruyemiş mağaza konumu"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-[390px] w-full border-0 sm:min-h-[470px]"
          />
        </div>
      ) : null}
    </section>
  );
}