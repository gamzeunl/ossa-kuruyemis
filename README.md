# OSSA Kuruyemiş

Production seviyesinde, güvenli sipariş/ödeme akışına sahip bir kuruyemiş e-ticaret platformu (Next.js App Router + TypeScript).

Kapsamlı planlama dokümanları için bkz. [docs/](docs/) ve proje kuralları için [CLAUDE.md](CLAUDE.md).

## Geliştirme Komutları

```bash
npm install      # bağımlılıkları kur
npm run dev      # geliştirme sunucusu (Turbopack)
npm run build    # production build
npm run start    # production sunucusunu çalıştır
```

## Kalite Kontrol Komutları

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format         # Prettier ile otomatik biçimlendirme
npm run format:check   # Prettier kontrolü (yazmadan)
```

## Environment Kurulumu

`.env.example` dosyasını `.env.local` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.example .env.local
```

Ortam değişkeni doğrulaması `src/config/env.ts` içindedir (Zod ile). Bu fazda `NEXT_PUBLIC_SITE_URL` dışındaki entegrasyon anahtarları (DB, auth, iyzico, storage, e-posta) henüz kullanılmadığı için opsiyoneldir; ilgili faz başladığında zorunlu hale getirilir.

## Mevcut Faz

**Faz 1 — Proje İskeleti.** Next.js App Router projesi, temel klasör yapısı, kalite araçları (ESLint/Prettier), sağlayıcı arayüz sözleşmeleri (`src/server/providers/`) ve environment doğrulama altyapısı kuruldu.

## Henüz Uygulanmayan Modüller

- Veritabanı bağlantısı ve Prisma şeması (Faz 2)
- Authentication (Faz 3)
- Ürün/kategori sistemi (Faz 4)
- Storefront, sepet, checkout (Faz 5-7)
- Ödeme entegrasyonu (Faz 8)
- Sipariş yönetimi, admin paneli (Faz 9-10)
- SEO/performans son ayarları, testler (Faz 11-12)

Faz planı ve açık kararlar için [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) ve [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) dosyalarına bakın.
