import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/server/providers/email-provider";

/**
 * Gerçek kimlik bilgisi gerektirmeyen tek somut `EmailProvider` — içeriği
 * konsola basar, gerçekte göndermez. Gerçek sağlayıcı (Resend/Postmark/SES
 * vb.) seçilene kadar "provider hazır" akışını uçtan uca test edilebilir
 * kılar (bkz. `resolveEmailProvider`).
 */
export class ConsoleEmailProvider implements EmailProvider {
  constructor(private readonly from: string) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    console.log(
      `[ConsoleEmailProvider] from=${this.from} to=${input.to} subject="${input.subject}"\n${input.text}`,
    );
    return { ok: true };
  }
}
