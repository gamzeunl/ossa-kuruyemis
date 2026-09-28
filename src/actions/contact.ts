"use server";

import { contactFormSchema } from "@/lib/contact-schema";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { createContactRequest } from "@/server/repositories/contact-repository";

export type ContactActionResult = { ok: true } | { ok: false; message: string };

interface ContactActionInput {
  name: string;
  phone?: string;
  email?: string;
  requestType: string;
  eventDate?: string;
  estimatedGuestCount?: string;
  message: string;
  /** Honeypot: gerçek kullanıcılar bu alanı görmez/doldurmaz. */
  website: string;
}

export async function submitContactRequestAction(
  input: ContactActionInput,
): Promise<ContactActionResult> {
  // Honeypot doluysa bot olduğu varsayılır; botlara ipucu vermeden başarı
  // döndürülür, kayıt oluşturulmaz.
  if (input.website.trim().length > 0) {
    return { ok: true };
  }

  const ip = await getClientIp();
  const rateLimitCheck = await checkRateLimit(`contact:ip:${ip}`, RATE_LIMIT_POLICIES.contactByIp);
  if (!rateLimitCheck.ok) {
    const minutes = Math.ceil((rateLimitCheck.retryAfterSeconds ?? 60) / 60);
    return { ok: false, message: `Çok fazla talep gönderildi. Lütfen ${minutes} dakika sonra tekrar deneyin.` };
  }

  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Girdi doğrulanamadı." };
  }

  try {
    await createContactRequest(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, message: "Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin." };
  }
}
