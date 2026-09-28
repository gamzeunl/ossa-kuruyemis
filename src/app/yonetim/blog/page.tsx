import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/layout/container";
import { formatDate } from "@/lib/format-date";
import { BlogPostStatus } from "@/generated/prisma/client";
import { requireRole } from "@/server/auth/guard";
import { listAllPosts } from "@/server/repositories/blog-repository";

export const metadata: Metadata = { title: "Blog Yönetimi" };

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  ARCHIVED: "Arşivlendi",
};

const STATUS_TONE: Record<BlogPostStatus, StatusTone> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export default async function AdminBlogListPage() {
  await requireRole("ADMIN", "/yonetim/blog");
  const posts = await listAllPosts();

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Blog Yönetimi</h1>
          <Link
            href="/yonetim/blog/yeni"
            className="bg-brand hover:bg-brand-dark min-h-10 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
          >
            Yeni Yazı
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div
          role="status"
          className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm"
        >
          Henüz yazı yok.
        </div>
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Başlık</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Güncellendi</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium">{post.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={STATUS_LABELS[post.status]} tone={STATUS_TONE[post.status]} />
                  </td>
                  <td className="px-4 py-3">{formatDate(post.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/yonetim/blog/${post.id}`}
                      className="text-brand font-semibold underline underline-offset-2"
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
