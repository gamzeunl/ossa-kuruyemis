import { serverEnv } from "@/config/env";
import { ConsoleEmailProvider } from "@/server/providers/console-email-provider";
import { ResendEmailProvider } from "@/server/providers/resend-email-provider";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/** Sağlayıcı ASLA throw etmemesi beklenir (best-effort sözleşmesi) — yine de çağıran taraf try/catch ile korunur (bkz. `order-email-service.ts`). */
export interface EmailProvider {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}

/**
 * `EMAIL_PROVIDER=console` → `ConsoleEmailProvider` (yerel/dev/test, gerçek
 * kimlik bilgisi gerektirmez). `EMAIL_PROVIDER=resend` → gerçek `ResendEmailProvider`
 * (production) — `RESEND_API_KEY`/`EMAIL_FROM` eksikse BİLEREK `null` döner,
 * `console`'a SESSİZCE DÜŞMEZ (bkz. görev gereksinimi: "production'da console
 * provider'a sessiz fallback yapma") — eksik yapılandırma açıkça "sağlayıcı
 * yok" (email gönderilmez, `OrderEmailLog` hiç yazılmaz) olarak ele alınır,
 * asla sahte bir "gönderildi" izlenimi vermez. Her iki durumda da `null`
 * dönüşü çağıran tarafça (`order-email-service.ts`) "sağlayıcı yapılandırılmamış"
 * sayılır ve sipariş/durum işlemini ASLA bloklamaz.
 */
export function resolveEmailProvider(): EmailProvider | null {
  if (serverEnv.EMAIL_PROVIDER === "console") {
    return new ConsoleEmailProvider(serverEnv.EMAIL_FROM ?? "OSSA Kuruyemiş <no-reply@ossa-kuruyemis.test>");
  }
  if (serverEnv.EMAIL_PROVIDER === "resend") {
    if (!serverEnv.RESEND_API_KEY || !serverEnv.EMAIL_FROM) {
      return null;
    }
    return new ResendEmailProvider(serverEnv.RESEND_API_KEY, serverEnv.EMAIL_FROM);
  }
  return null;
}
