import { z } from "zod";
import { turkishPhoneRegex } from "@/lib/checkout-schema";

/** `User` modelinin gerçekten desteklediği profil alanları — yeni alan icat edilmedi. */
export const profileSettingsSchema = z.object({
  firstName: z.string().trim().min(1, "Ad zorunludur.").max(100),
  lastName: z.string().trim().min(1, "Soyad zorunludur.").max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || turkishPhoneRegex.test(value.replace(/[\s-]/g, "")), {
      message: "Geçerli bir Türkiye telefon numarası girin (ör. 05XX XXX XX XX).",
    }),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
