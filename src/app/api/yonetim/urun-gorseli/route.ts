import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { optimizeProductImage, validateUploadedImage } from "@/lib/image-upload";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import { isProductImageUrlInUse } from "@/server/repositories/product-repository";

/**
 * Ürün görsel upload'u — Server Action'lar üzerinden BİNARY dosya GEÇMEZ
 * (Next.js Server Action body limiti varsayılan 1 MB'dır; gerçek ürün
 * fotoğrafları bunu kolayca aşar). Bunun yerine: admin dosyayı BURAYA (ayrı
 * bir Route Handler) yükler, sunucu doğrular/optimize eder/depolar ve yalnızca
 * küçük bir URL string'i döner — `createProductAction`/`addProductImageAction`
 * artık yalnızca bu URL'i alır, hiçbir zaman dosya binary'si almaz.
 *
 * Dış servisten gelen bir çağrı değil (yalnızca bu uygulamanın admin panelinden
 * `fetch` ile çağrılır) ama yine de bilinçli olarak bir Route Handler'dır,
 * Server Action DEĞİLDİR — çünkü `request.formData()` çok parçalı (multipart)
 * dosya yükleme akışını Server Action'ların aksine boyut sınırı sorunu
 * yaşamadan karşılar.
 */
export async function POST(request: NextRequest) {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin) {
    return NextResponse.json({ message: "Giriş yapmalısınız." }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const rateLimitCheck = await checkRateLimit(
    `product-image-upload:admin:${admin.id}`,
    RATE_LIMIT_POLICIES.adminImageUploadByAdmin,
  );
  if (!rateLimitCheck.ok) {
    return NextResponse.json(
      { message: "Çok fazla yükleme denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(rateLimitCheck.retryAfterSeconds ?? 60) } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Bir görsel dosyası seçmelisiniz." }, { status: 400 });
  }

  // Uzantı yerine gerçek MIME/type + boyut kontrolü (bkz. `validateUploadedImage`);
  // SVG kabul edilmez (`ALLOWED_IMAGE_MIME_TYPES`'ta yok).
  const validation = validateUploadedImage(file);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message ?? "Desteklenmeyen görsel formatı." }, { status: 400 });
  }

  let optimized: { data: Uint8Array; contentType: string };
  try {
    optimized = await optimizeProductImage(file);
  } catch {
    return NextResponse.json({ message: "Görsel işlenemedi." }, { status: 400 });
  }

  const baseName = file.name.replace(/\.[^./\\]+$/, "") || "urun-gorseli";
  const uploaded = await resolveStorageProvider().upload({
    fileName: `${baseName}.webp`,
    contentType: optimized.contentType,
    data: optimized.data,
  });

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_IMAGE_UPLOADED",
    entityType: "ProductImage",
    metadata: { url: uploaded.url },
  });

  return NextResponse.json({ url: uploaded.url });
}

/**
 * Orphan temizliği — admin bir görseli upload edip henüz hiçbir ürüne
 * BAĞLAMADAN (ör. formu iptal ederek/"Kaldır"a basarak) vazgeçerse, bu uçla
 * fiziksel dosya hemen silinir. Güvenlik: `isProductImageUrlInUse` ile
 * ÖNCE gerçekten bir `ProductImage` satırına bağlı OLMADIĞI doğrulanır —
 * aksi halde bir admin başka bir ürünün hâlâ kullanılan görselini silebilirdi.
 */
export async function DELETE(request: NextRequest) {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin) {
    return NextResponse.json({ message: "Giriş yapmalısınız." }, { status: 401 });
  }
  if (admin.role !== "ADMIN") {
    return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const url = request.nextUrl.searchParams.get("url");
  const storageProvider = resolveStorageProvider();
  if (!url || !storageProvider.isOwnedUrl(url)) {
    return NextResponse.json({ message: "Geçersiz görsel." }, { status: 400 });
  }

  if (await isProductImageUrlInUse(url)) {
    // Zaten bir ürüne bağlı — sessizce no-op (silme İSTEĞİ reddedilmez, ama
    // fiziksel dosyaya dokunulmaz; çağıran taraf için gözlemlenebilir fark yok).
    return NextResponse.json({ ok: true });
  }

  await storageProvider.deleteByUrl(url);
  return NextResponse.json({ ok: true });
}
