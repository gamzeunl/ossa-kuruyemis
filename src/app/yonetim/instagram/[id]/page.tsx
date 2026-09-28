import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInstagramPostAction } from "@/actions/admin-instagram";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import {
  InstagramPostAdminForm,
  type InstagramPostAdminFormValues,
} from "@/components/admin/instagram-post-admin-form";
import { PageContainer } from "@/components/layout/container";
import { formatShortDateTime } from "@/lib/format-date";
import { requireRole } from "@/server/auth/guard";
import { findInstagramPostById } from "@/server/repositories/instagram-post-repository";

export const metadata: Metadata = { title: "Instagram Gönderisini Düzenle" };

export default async function AdminEditInstagramPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "/yonetim/instagram");
  const { id } = await params;
  const post = await findInstagramPostById(id);

  if (!post) {
    notFound();
  }

  const initialValues: InstagramPostAdminFormValues = {
    postUrl: post.postUrl,
    caption: post.caption ?? "",
    isActive: post.isActive,
    sortOrder: post.sortOrder,
  };

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/instagram" className="text-brand w-fit text-xs font-semibold">
          ← Instagram Vitrini Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {post.caption ?? "Instagram Gönderisini Düzenle"}
        </h1>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          post.mediaUrl
            ? "border-green-300 bg-green-50 text-green-800"
            : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        {post.mediaUrl ? (
          <>
            Instagram medyası senkronize edildi ({post.mediaType?.toLocaleLowerCase("tr-TR")}
            {post.lastSyncedAt ? ` · ${formatShortDateTime(post.lastSyncedAt)}` : ""}).
          </>
        ) : (
          "Bu gönderi için Instagram medyası henüz senkronize edilemedi — ana sayfada gösterilmiyor. Kaydedince tekrar denenir."
        )}
      </div>

      <InstagramPostAdminForm postId={post.id} initialValues={initialValues} />

      <div className="border-border-muted border-t pt-6">
        <ContentDeleteForm
          action={deleteInstagramPostAction.bind(null, post.id)}
          confirmMessage="Bu Instagram gönderisini silmek istediğinize emin misiniz?"
        />
      </div>
    </PageContainer>
  );
}
