import { headers } from "next/headers";

/**
 * İstemci IP'sini `x-forwarded-for`/`x-real-ip` başlıklarından okur. Bu
 * başlıklar İSTEMCİ TARAFINDAN SPOOF EDİLEBİLİR — güvenilirlikleri tamamen
 * deployment topolojisine (Vercel/nginx/vb. güvenilir bir ters proxy'nin bu
 * başlıkları KENDİSİ set edip/üzerine yazıp yazmadığına) bağlıdır:
 *  - Vercel: `x-forwarded-for` platformun kendisi tarafından güvenilir şekilde
 *    ayarlanır (istemci override edemez).
 *  - Docker/VPS + nginx: yalnızca ters proxy `proxy_set_header X-Forwarded-For
 *    $remote_addr;` ile KENDİ değerini yazıyorsa güvenilirdir — proxy bunu
 *    yapılandırılmamışsa istemcinin gönderdiği değer doğrudan geçer (spoof
 *    edilebilir).
 * Bu belirsizlik nedeniyle rate limiting'te IP TEK BAŞINA hiçbir zaman
 * yeterli kabul edilmez — hassas uçlarda (giriş, sipariş takibi) her zaman
 * ikinci, IP'den bağımsız bir anahtarla (ör. hash'lenmiş e-posta) birleştirilir.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = headerList.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Hiçbir proxy başlığı yoksa (ör. doğrudan bağlantı/geliştirme ortamı) tüm
  // istekler aynı, sabit bir anahtır altında toplanır — IP bazlı ayrım
  // yapılamaz ama sistem asla çökmez/istisna atmaz.
  return "unknown";
}
