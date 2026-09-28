import sharp from "sharp";
import type { UploadInput } from "@/types/provider";

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Ürün görsel upload Route Handler'ının (`/api/yonetim/urun-gorseli`) optimize çıktısı. */
export const PRODUCT_IMAGE_MAX_DIMENSION = 1200;
const PRODUCT_IMAGE_WEBP_QUALITY = 82;

export interface ImageValidationResult {
  ok: boolean;
  message?: string;
}

/** Admin içerik formlarındaki (banner/etkinlik kartı/kategori görseli/ürün görseli) TEK dosya doğrulama kuralı. */
export function validateUploadedImage(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, message: "Desteklenmeyen görsel formatı." };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { ok: false, message: "Görsel dosyası çok büyük." };
  }
  return { ok: true };
}

export async function fileToUploadInput(file: File): Promise<UploadInput> {
  const buffer = await file.arrayBuffer();
  return { fileName: file.name, contentType: file.type, data: new Uint8Array(buffer) };
}

/**
 * Yalnızca ürün görsel upload Route Handler'ı tarafından kullanılır — mevcut
 * banner/etkinlik kartı/kategori görseli akışları (`fileToUploadInput`)
 * BOZULMADI, bu ayrı, ek bir yardımcıdır. EXIF orientation'a göre otomatik
 * döndürür, ardından `.toBuffer()` metadata'yı (EXIF/GPS dahil) YAZMADAN
 * döner (sharp varsayılanı: `withMetadata()` çağrılmadıkça çıktıya metadata
 * kopyalanmaz), maksimum kenar `PRODUCT_IMAGE_MAX_DIMENSION`'a küçültülür
 * (`fit: "inside"` ile aspect ratio KORUNUR, `withoutEnlargement` ile küçük
 * görseller büyütülmez), WebP'ye çevrilir.
 */
export async function optimizeProductImage(file: File): Promise<{ data: Uint8Array; contentType: string }> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: PRODUCT_IMAGE_MAX_DIMENSION,
      height: PRODUCT_IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: PRODUCT_IMAGE_WEBP_QUALITY })
    .toBuffer();
  return { data: outputBuffer, contentType: "image/webp" };
}
