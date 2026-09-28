import { z } from "zod";
import { BlogPostStatus } from "@/generated/prisma/client";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Blog yazısı oluşturma/düzenleme formunun tek doğrulama kaynağı (yönetim). */
export const blogPostFormSchema = z
  .object({
    title: z.string().trim().min(1, "Başlık zorunludur.").max(200, "Başlık en fazla 200 karakter olabilir."),
    slug: z
      .string()
      .trim()
      .min(1, "Slug zorunludur.")
      .max(200)
      .regex(slugPattern, "Slug yalnızca küçük harf, rakam ve tire içerebilir (ör. kavrulmus-findik)."),
    excerpt: z.string().trim().max(300, "Özet en fazla 300 karakter olabilir.").optional(),
    content: z.string().trim().min(20, "İçerik en az 20 karakter olmalı."),
    coverImageUrl: z.string().trim().max(500).optional(),
    status: z.enum(BlogPostStatus),
    publishedAt: z.string().trim().optional(),
    metaTitle: z.string().trim().max(200).optional(),
    metaDescription: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.status !== BlogPostStatus.PUBLISHED || Boolean(data.publishedAt), {
    message: "Yayınlamak için bir yayın tarihi belirleyin.",
    path: ["publishedAt"],
  });

export type BlogPostFormSchema = z.infer<typeof blogPostFormSchema>;
