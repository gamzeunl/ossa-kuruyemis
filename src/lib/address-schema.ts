import { z } from "zod";
import { taxNumberRegex, turkishPhoneRegex } from "@/lib/checkout-schema";

/** `Address` modeliyle BİREBİR aynı alanlar — tahmin edilerek yeni alan eklenmez. */
export const addressFormSchema = z
  .object({
    type: z.enum(["SHIPPING", "BILLING", "BOTH"], { message: "Geçerli bir adres türü seçin." }),
    title: z.string().trim().min(1, "Adres başlığı zorunludur.").max(100),
    firstName: z.string().trim().min(1, "Ad zorunludur.").max(100),
    lastName: z.string().trim().min(1, "Soyad zorunludur.").max(100),
    phone: z
      .string()
      .trim()
      .min(1, "Telefon zorunludur.")
      .refine((value) => turkishPhoneRegex.test(value.replace(/[\s-]/g, "")), {
        message: "Geçerli bir Türkiye telefon numarası girin (ör. 05XX XXX XX XX).",
      }),
    city: z.string().trim().min(1, "İl zorunludur.").max(100),
    district: z.string().trim().min(1, "İlçe zorunludur.").max(100),
    neighborhood: z.string().trim().max(150).optional().or(z.literal("")),
    postalCode: z.string().trim().max(20).optional().or(z.literal("")),
    addressLine: z
      .string()
      .trim()
      .min(10, "Açık adres en az 10 karakter olmalıdır.")
      .max(500, "Açık adres en fazla 500 karakter olabilir."),
    invoiceCompanyName: z.string().trim().max(200).optional().or(z.literal("")),
    taxOffice: z.string().trim().max(100).optional().or(z.literal("")),
    taxNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || taxNumberRegex.test(value), {
        message: "Vergi numarası 10 (VKN) veya 11 (TCKN) haneli olmalıdır.",
      }),
    isDefault: z.boolean(),
  })
  .transform((data) => ({
    ...data,
    neighborhood: data.neighborhood || null,
    postalCode: data.postalCode || null,
    invoiceCompanyName: data.invoiceCompanyName || null,
    taxOffice: data.taxOffice || null,
    taxNumber: data.taxNumber || null,
  }));

export type AddressFormInput = z.infer<typeof addressFormSchema>;
