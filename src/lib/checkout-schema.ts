import { z } from "zod";

// Boşluk/tire temizlenmiş TR mobil numarası: opsiyonel 0/+90 öneki + 5 ile başlayan 9 hane.
export const turkishPhoneRegex = /^(\+90|0)?5\d{9}$/;

// Kurumsal vergi numarası: VKN (10 hane) veya TCKN ile beyan eden şahıs işletmesi (11 hane).
export const taxNumberRegex = /^\d{10}$|^\d{11}$/;

export const addressSchema = z.object({
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
  neighborhood: z.string().trim().min(1, "Mahalle zorunludur.").max(150),
  addressLine: z
    .string()
    .trim()
    .min(10, "Açık adres en az 10 karakter olmalıdır.")
    .max(500, "Açık adres en fazla 500 karakter olabilir."),
  addressLabel: z.string().trim().min(1, "Adres başlığı zorunludur.").max(100),
});

export type AddressSchema = z.infer<typeof addressSchema>;

const individualInvoiceSchema = z.object({
  invoiceType: z.literal("INDIVIDUAL"),
});

const corporateInvoiceSchema = z.object({
  invoiceType: z.literal("CORPORATE"),
  companyName: z.string().trim().min(1, "Şirket unvanı zorunludur.").max(200),
  taxOffice: z.string().trim().min(1, "Vergi dairesi zorunludur.").max(100),
  taxNumber: z
    .string()
    .trim()
    .regex(taxNumberRegex, "Vergi numarası 10 veya 11 haneli olmalıdır."),
});

export const invoiceSchema = z.discriminatedUnion("invoiceType", [
  individualInvoiceSchema,
  corporateInvoiceSchema,
]);

export type InvoiceSchema = z.infer<typeof invoiceSchema>;

export const checkoutSchema = z
  .object({
    email: z.email("Geçerli bir e-posta adresi girin.").trim(),
    identityNumber: z
      .string()
      .trim()
      .regex(/^\d{11}$/, "T.C. kimlik numarası 11 haneli olmalıdır."),
    shippingAddress: addressSchema,
    billingSameAsShipping: z.boolean(),
    billingAddress: addressSchema.optional(),
    invoice: invoiceSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.billingSameAsShipping && !data.billingAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["billingAddress"],
        message: "Fatura adresi zorunludur.",
      });
    }
  });

export type CheckoutSchema = z.infer<typeof checkoutSchema>;
