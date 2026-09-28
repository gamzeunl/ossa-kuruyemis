"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstagramIcon, SpeakerOffIcon, SpeakerOnIcon } from "@/components/ui/icons";
import type { InstagramMediaKind } from "@/generated/prisma/client";

export interface InstagramMediaCardPost {
  id: string;
  postUrl: string;
  mediaType: InstagramMediaKind | null;
  mediaUrl: string;
  caption: string | null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

// 320-1023px arası kartlar yatay scroll/swipe içinde kalır (768'de "2-3 kart
// hissi" için sabit ~300px genişlik); 1024px+'ta grid devralır (lg:w-auto).
const CARD_CLASSNAME =
  "relative aspect-[9/16] w-[78vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-black shadow-lg sm:w-[300px] lg:w-auto lg:shrink";

/**
 * OSSA Instagram vitrini kartı — Hicret referansındaki gibi büyük, dikey,
 * native bir medya kartı; Instagram'ın embed chrome'u YOK. `mediaUrl` her
 * zaman Instagram Graph API'den önceden çözülüp cache'lenmiş gerçek bir CDN
 * adresidir (bkz. `instagram-graph-api-provider.ts`). VIDEO'da autoplay/mute/
 * viewport davranışı `InstagramVideoCard` (2 tur önce doğrulanmış aynı desen)
 * ile birebir aynı mantığı kullanır.
 */
export function InstagramMediaCard({ post }: { post: InstagramMediaCardPost }) {
  const caption = post.caption ? truncate(post.caption, 90) : null;

  return post.mediaType === "VIDEO" ? (
    <InstagramVideoMediaCard post={post} caption={caption} />
  ) : (
    <InstagramImageMediaCard post={post} caption={caption} />
  );
}

function InstagramShowLink({ postUrl }: { postUrl: string }) {
  return (
    <Link
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram'da gör"
      className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
    >
      <InstagramIcon className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function CaptionOverlay({ caption }: { caption: string | null }) {
  if (!caption) {
    return null;
  }
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pt-10 pb-4">
      <p className="line-clamp-2 text-sm font-medium text-white">{caption}</p>
    </div>
  );
}

function InstagramImageMediaCard({
  post,
  caption,
}: {
  post: InstagramMediaCardPost;
  caption: string | null;
}) {
  return (
    <div className={CARD_CLASSNAME}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URL'leri geçici/süreli imzalıdır, next/image optimizasyon+remotePatterns kapsamına bilerek alınmadı */}
      <img
        src={post.mediaUrl}
        alt={caption ?? "OSSA Instagram gönderisi"}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <CaptionOverlay caption={caption} />
      <InstagramShowLink postUrl={post.postUrl} />
    </div>
  );
}

function InstagramVideoMediaCard({
  post,
  caption,
}: {
  post: InstagramMediaCardPost;
  caption: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  function toggleMute() {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (!video) {
      return;
    }
    video.muted = nextMuted;
    if (reducedMotion && video.paused) {
      video.play().catch(() => {});
    }
  }

  return (
    <div className={CARD_CLASSNAME}>
      <video
        ref={videoRef}
        src={post.mediaUrl}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Videonun sesini aç" : "Videonun sesini kapat"}
        aria-pressed={!muted}
        className="focus-visible:outline-brand absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
          {muted ? (
            <SpeakerOffIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <SpeakerOnIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>

      <CaptionOverlay caption={caption} />
      <InstagramShowLink postUrl={post.postUrl} />
    </div>
  );
}
