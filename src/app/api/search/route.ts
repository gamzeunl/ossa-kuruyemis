import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { searchProductSuggestions } from "@/server/services/catalog-service";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

const SUGGESTION_LIMIT = 6;

/**
 * Header autocomplete için hafif öneri endpoint'i. Kişiye özel veri
 * içermediğinden kısa süreli, paylaşılabilir bir `Cache-Control` kullanılır —
 * geliştirme sırasında eski sonuç görülmemesi için süre kısa (30sn) tutulur.
 */
const CACHE_CONTROL_HEADER = "public, max-age=30, s-maxage=30, stale-while-revalidate=30";

export async function GET(request: NextRequest) {
  const ip = await getClientIp();
  const rateLimitCheck = await checkRateLimit(`search:ip:${ip}`, RATE_LIMIT_POLICIES.searchByIp);
  if (!rateLimitCheck.ok) {
    const retryAfterSeconds = rateLimitCheck.retryAfterSeconds ?? 60;
    return NextResponse.json(
      { items: [] },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const parsed = searchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    // Boş/çok kısa/çok uzun sorgu — DB'ye hiç gidilmez.
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchProductSuggestions(parsed.data.q, SUGGESTION_LIMIT);
    return NextResponse.json({ items }, { headers: { "Cache-Control": CACHE_CONTROL_HEADER } });
  } catch {
    // Teknik hata detayı asla kullanıcıya sızdırılmaz; istemci `response.ok`
    // üzerinden bunu "error" durumu olarak yorumlar (bkz. `HeaderSearch`).
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
