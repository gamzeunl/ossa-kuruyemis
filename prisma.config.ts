import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Node'un yerleşik .env yükleyicisi: Prisma CLI, prisma.config.ts'i process.env
// henüz .env'den doldurulmadan değerlendirdiği için burada elle yükleniyor.
// Dosya yoksa (ör. production; gerçek değerler platform tarafından enjekte edilir) sessizce geçilir.
try {
  process.loadEnvFile();
} catch {
  // .env bulunamadı — gerçek ortamlarda beklenen durum.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
