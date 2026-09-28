import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { CampaignPopup } from "@/components/campaign/campaign-popup";
import { MiniCart } from "@/components/cart/mini-cart";
import { CategoryMenu } from "@/components/layout/category-menu";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { StorefrontChrome } from "@/components/layout/storefront-chrome";
import { TopBar } from "@/components/layout/top-bar";
import { publicEnv } from "@/config/env";
import { INSTAGRAM_PROFILE_URL } from "@/lib/social-links";
import { getActiveCampaignPopup } from "@/server/services/campaign-popup-service";

const SITE_NAME = "OSSA Kuruyemiş";
const SITE_DESCRIPTION =
  "Taze kuruyemiş, lokum, kahve, hurma ve özel davet paketlerini OSSA kalitesiyle keşfedin.";

/**
 * `Organization`/`WebSite` JSON-LD — yalnızca DOĞRULANMIŞ gerçek verilerle
 * (isim, site URL'i, gerçek logo asset'i, gerçek Instagram profili).
 * Adres/telefon gibi henüz netleşmemiş işletme bilgileri (bkz.
 * docs/OPEN_QUESTIONS.md) UYDURULMAZ, bu alanlar netleşene kadar şemadan
 * tamamen dışarıda bırakılır.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  // Header/footer'da kullanılan GÜNCEL marka logosuyla aynı asset (bkz.
  // `header.tsx`/`footer.tsx`) — favicon (`src/app/icon.png`, Next.js'in
  // ayrı otomatik konvansiyonu) ile KARIŞTIRILMAMALI, buradaki `logo` alanı
  // Google'ın Organization/Logo zengin sonuçlarında kullandığı marka
  // görselidir ve neredeyse kare (1296×1214) olması schema.org/Google'ın
  // logo önerisiyle de daha uyumludur.
  logo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/images/ossa-logo-icon.png`,
  sameAs: [INSTAGRAM_PROFILE_URL],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
};

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Sayfa bazlı `generateMetadata` (PDP/blog/kategori) kendi `openGraph.images`'ını
  // EKLER, bu varsayılanların üzerine YAZMAZ (Next.js metadata birleştirme
  // davranışı) — bu yüzden burada gerçek bir görsel YOK, yalnızca site
  // kimliği (isim/tip/locale) tanımlanır.
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "tr_TR",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaignPopup = await getActiveCampaignPopup();

  return (
    <html lang="tr" className={`${manrope.variable} h-full`}>
      <body className="text-foreground bg-background flex min-h-full flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        <StorefrontChrome
          header={<Header />}
          categoryMenu={<CategoryMenu />}
          topBar={<TopBar />}
          footer={<Footer />}
          miniCart={<MiniCart />}
        >
          <main className="flex-1">{children}</main>
        </StorefrontChrome>

        <CampaignPopup data={campaignPopup} />
      </body>
    </html>
  );
}
