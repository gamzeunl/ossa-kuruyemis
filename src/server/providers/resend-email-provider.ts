import type { EmailProvider, SendEmailInput, SendEmailResult } from "@/server/providers/email-provider";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Production transactional e-posta sağlayıcısı — Resend'in düz REST API'si
 * `fetch()` ile doğrudan çağrılır, resmi SDK paketi BİLEREK eklenmedi (yeni
 * bağımlılık gerektirmeyen tek gerçek sağlayıcı seçeneği buydu, bkz. görev
 * sonu raporu #11). `sendEmail` sözleşmesi gereği ASLA throw ETMEZ — ağ/HTTP
 * hatası `{ok:false, error}` olarak döner, çağıran taraf (`order-email-service.ts`)
 * bunu `OrderEmailLog`'a FAILED olarak yazar, sipariş akışını bozmaz.
 */
export class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (!response.ok) {
        // Yanıt gövdesi hassas olabilir (API detayları) — yalnızca HTTP durumu loglanır.
        return { ok: false, error: `Resend API hatası (HTTP ${response.status}).` };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: "Resend API'sine ulaşılamadı." };
    }
  }
}
