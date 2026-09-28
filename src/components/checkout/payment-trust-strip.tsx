import { ShieldIcon } from "@/components/ui/icons";

/**
 * iyzico'nun resmî logo paketi HENÜZ bu projeye eklenmedi (bkz. görev sonu
 * raporu / `docs/IYZICO_APPLICATION_CHECKLIST.md`) — bu yüzden burada hiçbir
 * logo görseli/placeholder/sahte logotype ÇİZİLMEZ. Yalnızca "Güvenli Ödeme"
 * metin rozeti gösterilir. Resmî iyzico/Visa/Mastercard SVG/PNG asset'leri
 * `public/payment-logos/` altına eklendiğinde, bu diziye
 * `{ name: "iyzico", src: "/payment-logos/iyzico.svg" }` gibi girdiler
 * eklemek YETERLİDİR — component otomatik olarak logoları render etmeye
 * başlar, kod değişikliği gerekmez.
 */
const PAYMENT_LOGOS: { name: string; src: string }[] = [];

interface PaymentTrustStripProps {
  isIyzicoConfigured: boolean;
}

/**
 * `isIyzicoConfigured` `true` olmadıkça (bkz. `isIyzicoConfigured()` —
 * gerçek iyzico API kimlik bilgileri ortamda tanımlı olana kadar bu her
 * zaman `false`'dur) yalnızca sade "Güvenli Ödeme" rozeti gösterilir; bu
 * dal davranışı BUGÜNKÜ haliyle bilinçli olarak değiştirilmedi. `true`
 * olduğunda ek olarak "iyzico ile Öde" metni gösterilir — gerçek entegrasyon
 * bağlandığında sahte bir buton/CTA DEĞİL, yalnızca bir güven etiketidir.
 */
export function PaymentTrustStrip({ isIyzicoConfigured }: PaymentTrustStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border-muted px-6 py-4">
      <span className="text-foreground/60 flex items-center gap-1.5 text-xs font-semibold">
        <ShieldIcon className="text-brand h-4 w-4" aria-hidden="true" />
        {isIyzicoConfigured ? "iyzico ile Öde · Güvenli Ödeme" : "Güvenli Ödeme"}
      </span>
      {PAYMENT_LOGOS.length > 0 ? (
        <div className="flex items-center gap-2">
          {PAYMENT_LOGOS.map((logo) => (
            // eslint-disable-next-line @next/next/no-img-element -- küçük sabit sağlayıcı logosu, next/image optimizasyonu gerekmiyor
            <img key={logo.name} src={logo.src} alt={logo.name} className="h-5 w-auto" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
