import Image from "next/image";
import Link from "next/link";
import { CartTrigger } from "@/components/cart/cart-trigger";
import { UserIcon } from "@/components/ui/icons";
import { HeaderSearch } from "./header-search";

export function Header() {
  return (
    <header className="border-border-muted bg-white">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1320px] items-center gap-3 px-5 py-3 sm:gap-6 sm:px-6 lg:gap-8 lg:px-10">
        {/* Logo — kaynak: `src/app/icon.png` (Next.js'in otomatik favicon/metadata
        icon konvansiyonu bu dosyayı zaten kullanıyor, DOKUNULMADI). Header'da
        kullanmak için `public/images/ossa-logo-icon.png`'a birebir kopyalandı
        (yeni logo ÜRETİLMEDİ) — footer.tsx ve `Organization` JSON-LD (`layout.tsx`)
        AYNI asset'i kullanıyor, eski `/images/ossa-logo.png` artık hiçbir
        kullanıcıya görünen yerde kullanılmıyor. */}
        <Link
          href="/"
          aria-label="OSSA ana sayfa"
          className="flex h-12 w-12 shrink-0 items-center justify-start sm:h-14 sm:w-14 lg:h-16 lg:w-16"
        >
          {/* `unoptimized`: Next.js'in `/_next/image` optimizer proxy'si varsayılan
          olarak `Content-Disposition: attachment` döner — bu, tarayıcının `<img>`
          içinde görseli asla render ETMEMESİNE yol açar (bkz. `ProductImage`'daki
          aynı desen). Kalıcı çözüm `next.config.ts`'de `images.contentDispositionType`
          ayarlamak olur ama bu, mevcut kapsamı aşan site geneli bir karar. */}
          <Image
            src="/images/ossa-logo-icon.png"
            alt="OSSA Kuru Yemiş"
            width={130}
            height={122}
            priority
            unoptimized
            className="h-full w-full object-contain"
          />
        </Link>

        {/* Masaüstü arama */}
        <div className="hidden min-w-0 flex-1 md:block">
          <HeaderSearch inputId="site-search" className="mx-auto w-full max-w-[720px]" />
        </div>

        {/* Hesap ve sepet */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/hesabim"
            aria-label="Hesabım"
            className="group hover:bg-surface-muted flex min-h-[50px] items-center gap-2 rounded-xl px-2.5 transition-colors sm:px-3"
          >
            <span className="border-border-muted group-hover:border-brand flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors">
              <UserIcon className="text-brand h-5.5 w-5.5" />
            </span>

            <span className="hidden leading-tight lg:block">
              <span className="text-muted-text block text-[11px] font-medium">Üyelik</span>

              <span className="text-foreground block text-sm font-bold">Hesabım</span>
            </span>
          </Link>

          <CartTrigger />
        </div>
      </div>

      {/* Mobil arama */}
      <div className="border-border-muted border-t px-4 py-2.5 md:hidden">
        <HeaderSearch inputId="mobile-site-search" size="compact" />
      </div>
    </header>
  );
}
