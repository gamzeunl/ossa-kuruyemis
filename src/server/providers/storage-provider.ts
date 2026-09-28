import { LocalStorageProvider } from "@/server/providers/local-storage-provider";
import type { UploadInput, UploadResult } from "@/types/provider";

export interface StorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  /** `getPublicUrl`'in tersi — DB'de saklanan bir URL'den fiziksel dosyayı best-effort siler. Sağlayıcı kendi URL şeklini tanımıyorsa no-op. */
  deleteByUrl(url: string): Promise<void>;
  getPublicUrl(key: string): string;
  /** Bir URL'nin gerçekten BU sağlayıcı tarafından üretilmiş olup olmadığını doğrular (ör. client'tan gelen hidden input değerinin kabul edilebilir olup olmadığını kontrol etmek için) — sağlayıcı değiştiğinde çağıran taraf DEĞİŞMEZ. */
  isOwnedUrl(url: string): boolean;
}

/**
 * Gerçek nesne depolama sağlayıcısı (S3/R2/Cloudinary) seçimi henüz
 * netleşmemiş bir iş kararıdır (bkz. `docs/OPEN_QUESTIONS.md`, Faz 4).
 * Şimdilik her zaman `LocalStorageProvider` döner — gerçek sağlayıcı
 * seçildiğinde yalnızca burada yeni bir dal eklenir, çağıran taraf değişmez.
 */
export function resolveStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}
