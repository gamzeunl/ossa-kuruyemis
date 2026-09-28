import { z } from "zod";
import { turkishPhoneRegex } from "@/lib/checkout-schema";
import { CONTACT_REQUEST_TYPE_VALUES } from "@/lib/contact-content";

/**
 * Boş dizeyi (`""`) `undefined`e çevirir — isteğe bağlı alanlar için tek
 * merkezden. Bu, şemanın hem client'tan (FormData her zaman string döner) hem
 * doğrudan server action çağrısından gelen isteklerde tutarlı davranmasını
 * sağlar; her çağıran kendi normalize mantığını tekrar yazmaz.
 */
function emptyToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * `/iletisim` formunun tek doğrulama kaynağı — hem client (hızlı geri bildirim
 * için) hem server action (yetkili doğrulama için) aynı şemayı kullanır.
 * `estimatedGuestCount`/`eventDate` bilinçli olarak string kalır; DB'ye yazarken
 * repository katmanında Number/Date'e çevrilir.
 */
export const contactFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ad Soyad zorunludur.")
      .max(120, "Ad Soyad en fazla 120 karakter olabilir."),
    phone: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .refine((value) => turkishPhoneRegex.test(value.replace(/[\s-]/g, "")), {
          message: "Geçerli bir Türkiye telefon numarası girin (ör. 05XX XXX XX XX).",
        })
        .optional(),
    ),
    email: z.preprocess(
      emptyToUndefined,
      z.email("Geçerli bir e-posta adresi girin.").trim().toLowerCase().max(200).optional(),
    ),
    requestType: z.enum(CONTACT_REQUEST_TYPE_VALUES, {
      message: "Geçerli bir talep türü seçin.",
    }),
    eventDate: z.preprocess(emptyToUndefined, z.iso.date("Geçerli bir tarih girin.").optional()),
    estimatedGuestCount: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .regex(/^[1-9]\d*$/, "Kişi sayısı pozitif bir tam sayı olmalı.")
        .optional(),
    ),
    message: z
      .string()
      .trim()
      .min(10, "Mesajınızı en az 10 karakter yazın.")
      .max(2000, "Mesaj en fazla 2000 karakter olabilir."),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: "Telefon veya e-posta adresinden en az birini girin.",
    path: ["phone"],
  });

export type ContactFormSchema = z.infer<typeof contactFormSchema>;
