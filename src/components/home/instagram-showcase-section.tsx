import Link from "next/link";
import { HomeContainer, HOME_SECTION_PADDING } from "@/components/home/home-container";
import { InstagramMediaCard } from "@/components/home/instagram-media-card";
import { InstagramProfileHeader } from "@/components/home/instagram-profile-header";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import { InstagramIcon } from "@/components/ui/icons";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL } from "@/lib/social-links";
import type { InstagramPostSummary } from "@/server/services/content-service";

const HEADING_ID = "instagram-vitrini-baslik";

/**
 * Ana sayfa Instagram vitrini — Hicret referansındaki hiyerarşiyi (profil
 * şeridi + büyük dikey medya kartları) esas alan, OSSA'nın kendi tasarım
 * sistemi içinde native bir bölüm. Instagram'ın embed chrome'u (iframe/
 * blockquote) YOK — her kart gerçek medyayı doğrudan `<video>`/`<img>` ile
 * gösterir (bkz. `InstagramMediaCard`), veri kaynağı Instagram Graph API'den
 * önceden çözülüp cache'lenmiştir (`instagram-graph-api-provider.ts`).
 * Cache'i hiç oluşmamış (senkronize edilememiş) gönderiler `listActiveInstagramPosts`
 * tarafından zaten filtrelenir — burada `post.mediaUrl` her zaman dolu gelir.
 * 0 aktif/senkronize gönderi varsa "Yakında" gibi bir placeholder YERİNE
 * zarif, yalnızca profil linkine yönlendiren küçük bir şerit gösterilir.
 */
export function InstagramShowcaseSection({ posts }: { posts: InstagramPostSummary[] }) {
  const safePosts = posts.filter(
    (post): post is InstagramPostSummary & { mediaUrl: string } =>
      isSafeHttpUrl(post.postUrl) && Boolean(post.mediaUrl),
  );

  if (safePosts.length === 0) {
    return (
      <section aria-labelledby={HEADING_ID} className={`bg-surface-muted ${HOME_SECTION_PADDING}`}>
        <HomeContainer>
          <ScrollReveal className="flex flex-col items-center gap-3 text-center">
            <span className="text-brand text-xs font-bold tracking-[0.18em] uppercase">Sosyal Medya</span>
            <h2 id={HEADING_ID} className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
              OSSA&apos;yı Instagram&apos;da Takip Edin
            </h2>
            <p className="text-foreground/60 max-w-md text-sm leading-6">
              Yeni lezzetler, sunum fikirleri ve OSSA&apos;dan kareler.
            </p>
            <Link
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-brand text-brand-dark hover:bg-brand/5 mt-1 inline-flex min-h-11 items-center gap-2 rounded-full border px-6 text-sm font-bold transition-colors"
            >
              <InstagramIcon className="h-4 w-4" aria-hidden="true" />
              {INSTAGRAM_HANDLE}
            </Link>
          </ScrollReveal>
        </HomeContainer>
      </section>
    );
  }

  return (
    <section aria-labelledby={HEADING_ID} className={`bg-surface-muted ${HOME_SECTION_PADDING}`}>
      <HomeContainer>
        <h2 id={HEADING_ID} className="sr-only">
          OSSA&apos;yı Instagram&apos;da Takip Edin
        </h2>
        <InstagramProfileHeader />

        {/* 320-1023px: yatay scroll/swipe (768'de sabit ~300px kart genişliği "2-3 kart hissi" verir);
            1024px+ (lg:): 4 kart yan yana grid. */}
        <div className="hide-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:mt-8 sm:gap-4 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {safePosts.map((post) => (
            <InstagramMediaCard
              key={post.id}
              post={{
                id: post.id,
                postUrl: post.postUrl,
                mediaType: post.mediaType,
                mediaUrl: post.mediaUrl,
                caption: post.caption ?? post.captionCached,
              }}
            />
          ))}
        </div>
      </HomeContainer>
    </section>
  );
}
