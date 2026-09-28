import Link from "next/link";
import { InstagramIcon } from "@/components/ui/icons";
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL } from "@/lib/social-links";

/**
 * Hicret referansındaki profil şeridi hiyerarşisi (avatar + handle + kısa
 * ifade solda, "Takip Et" sağda) — birebir kopya değil. Gerçek bir OSSA logo
 * asset'i henüz yok (bkz. `Header` component'indeki aynı bekleyen not); bu
 * yüzden avatar, site genelinde zaten kullanılan "OSSA" marka metniyle aynı
 * üslupta bir daire rozet olarak gösterilir — sahte bir görsel/ikon UYDURULMAZ.
 * Takipçi/gönderi sayısı Instagram API'den güvenilir biçimde alınmadığından
 * hiç GÖSTERİLMEZ.
 */
export function InstagramProfileHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="border-brand text-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold tracking-wide"
        >
          OSSA
        </span>
        <div className="flex flex-col">
          <span className="text-foreground text-base font-bold">{INSTAGRAM_HANDLE}</span>
          <span className="text-foreground/60 text-xs">OSSA&apos;nın kadrajından</span>
        </div>
      </div>

      <Link
        href={INSTAGRAM_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-brand hover:bg-brand-dark inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-brand-foreground transition-colors sm:px-5"
      >
        <InstagramIcon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Instagram&apos;da Takip Et</span>
        <span className="sm:hidden">Takip Et</span>
      </Link>
    </div>
  );
}
