import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "@/server/providers/storage-provider";
import type { UploadInput, UploadResult } from "@/types/provider";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const UPLOAD_URL_PREFIX = "/uploads/";

function slugifyFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, ext);
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${slug || "dosya"}${ext}`;
}

/**
 * `StorageProvider`'ın yerel dosya sistemi implementasyonu — `public/uploads/`
 * altına yazar, Docker/VPS/Railway'de kalıcı çalışır. Vercel gibi ephemeral
 * dosya sistemli platformlarda KALICI OLMAZ (bkz. docs/OPEN_QUESTIONS.md,
 * nesne depolama sağlayıcısı Faz 4 açık kararı). Gerçek bulut sağlayıcı kararı
 * netleştiğinde iş mantığı değişmeden yeni bir implementasyon
 * `resolveStorageProvider`'a eklenir.
 */
export class LocalStorageProvider implements StorageProvider {
  async upload(input: UploadInput): Promise<UploadResult> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const key = `${Date.now()}-${slugifyFileName(input.fileName)}`;
    await writeFile(path.join(UPLOAD_DIR, key), input.data);
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(path.join(UPLOAD_DIR, path.basename(key)));
    } catch {
      // Dosya zaten yoksa/erişilemiyorsa akışı bloklamaz (best-effort silme).
    }
  }

  /** `url` bu sağlayıcının `/uploads/` önekine ait değilse (ör. seed SVG'leri) sessizce atlar. */
  async deleteByUrl(url: string): Promise<void> {
    if (!this.isOwnedUrl(url)) {
      return;
    }
    await this.delete(url.slice(UPLOAD_URL_PREFIX.length));
  }

  getPublicUrl(key: string): string {
    return `${UPLOAD_URL_PREFIX}${key}`;
  }

  isOwnedUrl(url: string): boolean {
    return url.startsWith(UPLOAD_URL_PREFIX);
  }
}
