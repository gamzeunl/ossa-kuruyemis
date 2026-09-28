import { z } from "zod";
import { isSafeHttpUrl } from "@/lib/safe-url";

const SHORTCODE_PATTERN = /^[A-Za-z0-9_-]+$/;

export interface ParsedInstagramPostUrl {
  kind: "p" | "reel";
  shortcode: string;
}

/**
 * Yalnızca gerçek Instagram GÖNDERİ/REEL linklerini kabul eder — profil,
 * story, DM, arama vb. Instagram URL biçimleri reddedilir. Alt alan adı
 * `instagram.com` DIŞINDA (ör. taklit/typosquat) bir domaine izin VERİLMEZ.
 */
export function parseInstagramPostUrl(value: string): ParsedInstagramPostUrl | null {
  if (!isSafeHttpUrl(value)) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host !== "instagram.com" && host !== "www.instagram.com") {
    return null;
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }
  const [kind, shortcode] = segments;
  if ((kind !== "p" && kind !== "reel") || !SHORTCODE_PATTERN.test(shortcode)) {
    return null;
  }
  return { kind, shortcode };
}

/** Geçerliyse kanonik `https://www.instagram.com/{p|reel}/{shortcode}/` biçimine normalize eder (izleme query param'ları/www farkı atılır); geçersizse `null`. */
export function normalizeInstagramPostUrl(value: string): string | null {
  const parsed = parseInstagramPostUrl(value);
  if (!parsed) {
    return null;
  }
  return `https://www.instagram.com/${parsed.kind}/${parsed.shortcode}/`;
}

function isInstagramPostUrl(value: string): boolean {
  return parseInstagramPostUrl(value) !== null;
}

/** Instagram gönderisi formunun tek doğrulama kaynağı. `isActive` action içinde ele alınır. */
export const instagramPostFormSchema = z.object({
  postUrl: z
    .string()
    .trim()
    .min(1, "Gönderi linki zorunludur.")
    .max(500, "Gönderi linki en fazla 500 karakter olabilir.")
    .refine(
      isInstagramPostUrl,
      "Geçerli bir Instagram gönderi veya reel linki girin (https://www.instagram.com/p/... veya /reel/...).",
    ),
  caption: z.string().trim().max(300, "Alt metin en fazla 300 karakter olabilir.").optional(),
  sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
});

export type InstagramPostFormSchema = z.infer<typeof instagramPostFormSchema>;
