/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * `InstagramPost` repository katmanının CRUD + yalnızca ACTIVE filtreleme +
 * `sortOrder` sıralaması + "cache yoksa storefront'ta gösterme" davranışını
 * doğrular. Model artık Instagram Graph API'den çözülen medya cache alanları
 * taşır (bkz. `InstagramMediaCard`, `instagram-graph-api-provider.ts`).
 */
import { afterAll, describe, expect, it } from "vitest";
import {
  createInstagramPost,
  deleteInstagramPost,
  listActiveInstagramPosts,
  listInstagramPostsForAdmin,
  updateInstagramPost,
  type InstagramPostFields,
} from "@/server/repositories/instagram-post-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/instagram-post] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

type MediaCacheFields = Pick<
  InstagramPostFields,
  "instagramMediaId" | "mediaType" | "mediaUrl" | "thumbnailUrl" | "captionCached" | "publishedAt" | "lastSyncedAt"
>;

const NO_MEDIA_CACHE: MediaCacheFields = {
  instagramMediaId: null,
  mediaType: null,
  mediaUrl: null,
  thumbnailUrl: null,
  captionCached: null,
  publishedAt: null,
  lastSyncedAt: null,
};

function withSyncedMedia(mediaUrl: string): MediaCacheFields {
  return {
    instagramMediaId: `ig-${mediaUrl}`,
    mediaType: "IMAGE",
    mediaUrl,
    thumbnailUrl: null,
    captionCached: null,
    publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSyncedAt: new Date(),
  };
}

describe.skipIf(!hasTestDatabase)("InstagramPost — repository katmanı (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdPostIds: string[] = [];

  afterAll(async () => {
    await prisma.instagramPost.deleteMany({ where: { id: { in: createdPostIds } } });
  });

  it("yalnızca isActive:true VE senkronize (mediaUrl dolu) gönderiler storefront listesinde döner", async () => {
    const active = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/ACTIVE/",
      caption: "Aktif gönderi",
      isActive: true,
      sortOrder: 0,
      ...withSyncedMedia("https://cdninstagram.com/active.jpg"),
    });
    const inactive = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/INACTIVE/",
      caption: "Pasif gönderi",
      isActive: false,
      sortOrder: 1,
      ...withSyncedMedia("https://cdninstagram.com/inactive.jpg"),
    });
    const notSynced = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/NOTSYNCED/",
      caption: "Senkronize edilememiş gönderi",
      isActive: true,
      sortOrder: 2,
      ...NO_MEDIA_CACHE,
    });
    createdPostIds.push(active.id, inactive.id, notSynced.id);

    const publicPosts = await listActiveInstagramPosts(10);
    const publicIds = publicPosts.map((p) => p.id);
    expect(publicIds).toContain(active.id);
    expect(publicIds).not.toContain(inactive.id);
    expect(publicIds).not.toContain(notSynced.id);

    const adminPosts = await listInstagramPostsForAdmin();
    const adminIds = adminPosts.map((p) => p.id);
    expect(adminIds).toContain(active.id);
    expect(adminIds).toContain(inactive.id);
    expect(adminIds).toContain(notSynced.id);
  });

  it("gönderiler sortOrder'a göre artan sırada döner", async () => {
    const second = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/ORDER2/",
      caption: null,
      isActive: true,
      sortOrder: 20,
      ...withSyncedMedia("https://cdninstagram.com/order2.jpg"),
    });
    const first = await createInstagramPost({
      postUrl: "https://www.instagram.com/reel/ORDER1/",
      caption: null,
      isActive: true,
      sortOrder: 10,
      ...withSyncedMedia("https://cdninstagram.com/order1.mp4"),
    });
    createdPostIds.push(second.id, first.id);

    const posts = await listActiveInstagramPosts(50);
    const indexFirst = posts.findIndex((p) => p.id === first.id);
    const indexSecond = posts.findIndex((p) => p.id === second.id);
    expect(indexFirst).toBeGreaterThanOrEqual(0);
    expect(indexSecond).toBeGreaterThanOrEqual(0);
    expect(indexFirst).toBeLessThan(indexSecond);
  });

  it("5 senkronize aktif gönderi varsa listActiveInstagramPosts(4) yalnızca sortOrder'a göre İLK 4'ünü döner", async () => {
    const entries = await Promise.all(
      [-100, -99, -98, -97, -96].map((sortOrder, index) =>
        createInstagramPost({
          postUrl: `https://www.instagram.com/p/LIMIT${index}/`,
          caption: null,
          isActive: true,
          sortOrder,
          ...withSyncedMedia(`https://cdninstagram.com/limit${index}.jpg`),
        }),
      ),
    );
    createdPostIds.push(...entries.map((p) => p.id));

    const posts = await listActiveInstagramPosts(4);
    expect(posts).toHaveLength(4);
    expect(posts.map((p) => p.id)).toEqual(entries.slice(0, 4).map((p) => p.id));
  });

  it("reel URL'si (postUrl) ve VIDEO medya cache'i doğru saklanır ve okunur", async () => {
    const post = await createInstagramPost({
      postUrl: "https://www.instagram.com/reel/REEL1/",
      caption: "Reel gönderi",
      isActive: true,
      sortOrder: 5,
      instagramMediaId: "ig-reel-1",
      mediaType: "VIDEO",
      mediaUrl: "https://cdninstagram.com/reel1.mp4",
      thumbnailUrl: "https://cdninstagram.com/reel1-thumb.jpg",
      captionCached: "Gerçek Instagram caption'ı",
      publishedAt: new Date("2026-02-01T00:00:00.000Z"),
      lastSyncedAt: new Date(),
    });
    createdPostIds.push(post.id);
    expect(post.postUrl).toBe("https://www.instagram.com/reel/REEL1/");
    expect(post.mediaType).toBe("VIDEO");
    expect(post.mediaUrl).toBe("https://cdninstagram.com/reel1.mp4");
  });

  it("updateInstagramPost mevcut kaydı günceller, yeni kayıt oluşturmaz", async () => {
    const post = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/UPDATE/",
      caption: "Eski caption",
      isActive: true,
      sortOrder: 0,
      ...withSyncedMedia("https://cdninstagram.com/update.jpg"),
    });
    createdPostIds.push(post.id);

    const updated = await updateInstagramPost(post.id, {
      postUrl: post.postUrl,
      caption: "Yeni caption",
      isActive: true,
      sortOrder: 0,
      instagramMediaId: post.instagramMediaId,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      thumbnailUrl: post.thumbnailUrl,
      captionCached: post.captionCached,
      publishedAt: post.publishedAt,
      lastSyncedAt: post.lastSyncedAt,
    });
    expect(updated.id).toBe(post.id);
    expect(updated.caption).toBe("Yeni caption");

    const countWithSameUrl = await prisma.instagramPost.count({ where: { postUrl: post.postUrl } });
    expect(countWithSameUrl).toBe(1);
  });

  it("deleteInstagramPost kaydı gerçekten kaldırır", async () => {
    const post = await createInstagramPost({
      postUrl: "https://www.instagram.com/p/DELETE/",
      caption: null,
      isActive: true,
      sortOrder: 0,
      ...withSyncedMedia("https://cdninstagram.com/delete.jpg"),
    });
    await deleteInstagramPost(post.id);
    const found = await prisma.instagramPost.findUnique({ where: { id: post.id } });
    expect(found).toBeNull();
  });
});
