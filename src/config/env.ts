import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Production'da gerçek bir domain kullanan site URL'i ASLA `http://` olamaz —
 * checkout/ödeme/iyzico callback akışları ve karışık içerik (mixed content)
 * riski nedeniyle bu bilinçli bir sert kontroldür (bkz. iyzico başvuru
 * hazırlığı görevi). Vercel gibi platformlarda HTTPS zaten otomatik sağlanır;
 * burada "sahte SSL" KURULMAZ, yalnızca yanlış yapılandırılmış bir `http://`
 * production domain URL'i anlaşılır bir hatayla ERKEN yakalanır.
 *
 * `localhost`/`127.0.0.1` istisnadır: `next build` (üretim paketleme adımı)
 * `NODE_ENV`'i geliştirme makinesinde de her zaman `production` yapar, bu
 * yüzden `isProduction` tek başına "gerçekten canlı bir domaine dağıtılıyor"
 * anlamına gelmez — bu istisna olmadan yerel `npm run build` bile `.env`'deki
 * `http://localhost:3000` ile kırılırdı. Gerçek bir production domaininde bu
 * istisna devreye girmez, HTTPS zorunluluğu tam olarak uygulanır.
 */
const isLocalhostUrl = (value: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/.test(value);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: isProduction
    ? z
        .string()
        .url()
        .refine((value) => value.startsWith("https://") || isLocalhostUrl(value), {
          message:
            "Production'da NEXT_PUBLIC_SITE_URL https:// ile başlamalıdır (ör. https://ossakuruyemis.com) — checkout/iyzico akışları için HTTPS zorunludur.",
        })
    : z.string().url().default("http://localhost:3000"),
});

// Bu alanların tamamı burada opsiyoneldir; her sağlayıcı gerçek entegrasyonuna başladığı
// fazda kendi kullanım noktasında (DATABASE_URL → src/server/db/prisma.ts, Faz 2;
// AUTH_SECRET → src/server/auth/auth.ts, Faz 3; EMAIL_* → src/server/providers/email-provider.ts)
// net bir hata/açık "yapılandırılmamış" davranışıyla ele alınır. iyzico ve
// storage alanları henüz hiçbir yerde kullanılmıyor.
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  // Yalnızca `npm run test`teki entegrasyon testleri tarafından kullanılır
  // (bkz. tests/db.ts) — uygulama kodu bu değeri hiçbir zaman okumaz.
  TEST_DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_BASE_URL: z.string().optional(),
  STORAGE_PROVIDER: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ENDPOINT: z.string().optional(),
  EMAIL_PROVIDER: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  // Resend (`EMAIL_PROVIDER=resend`) — bkz. src/server/providers/resend-email-provider.ts.
  RESEND_API_KEY: z.string().optional(),
  ORDER_NOTIFICATION_EMAIL: z.string().email().optional(),
  // Instagram Graph API ("Instagram API with Instagram Login") — @ossa.kuruyemis
  // hesabının kendi medyasını okumak için. Yalnızca kullanım noktasında
  // (src/server/providers/instagram-graph-api.ts) net bir hatayla zorunlu kılınır.
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),
});

function parse<Schema extends z.ZodTypeAny>(
  schema: Schema,
  source: unknown,
  label: string,
): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`${label} doğrulaması başarısız: ${result.error.message}`);
  }
  return result.data;
}

// Yalnızca NEXT_PUBLIC_ önekli değerler; client bileşenlerinden içe aktarılabilir.
export const publicEnv = parse(
  publicEnvSchema,
  { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL },
  "Public env",
);

// Yalnızca sunucu tarafı koddan (Server Component/Action/Route Handler) içe aktarılmalıdır;
// "use client" dosyalarına import edilmez.
export const serverEnv = parse(serverEnvSchema, process.env, "Server env");
