
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { marketingCampaignFormSchema } from "@/lib/marketing-campaign-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  createMarketingCampaign,
  deactivateMarketingCampaign,
  deleteMarketingCampaign,
  findMarketingCampaignForAdmin,
  updateMarketingCampaign,
  type MarketingCampaignFields,
} from "@/server/repositories/marketing-campaign-repository";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; message: string };

const LIST_PATH = "/yonetim/kampanyalar";

function parseFormInput(formData: FormData) {
  const variantIds = formData
    .getAll("variantIds")
    .map((value) => String(value));

  const campaignPrices: Record<string, string> = {};

  for (const variantId of variantIds) {
    campaignPrices[variantId] = String(
      formData.get(`campaignPrice_${variantId}`) ?? ""
    );
  }

  return marketingCampaignFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    headline:
      String(formData.get("headline") ?? "").trim() || undefined,
    description:
      String(formData.get("description") ?? "").trim() || undefined,
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    variantIds,
    campaignPrices,
  });
}

function toFields(
  parsed: {
    name: string;
    type: "DAILY" | "WEEKLY" | "MONTHLY";
    startsAt: string;
    endsAt: string;
    headline?: string;
    description?: string;
    sortOrder: number;
  },
  isActive: boolean,
  showOnHomepage: boolean,
  showPopup: boolean
): MarketingCampaignFields {
  return {
    name: parsed.name,
    type: parsed.type,
    startsAt: new Date(parsed.startsAt),
    endsAt: new Date(parsed.endsAt),
    isActive,
    showOnHomepage,
    showPopup,
    headline: parsed.headline ?? null,
    description: parsed.description ?? null,
    sortOrder: parsed.sortOrder,
  };
}

function auditMetadata(
  fields: MarketingCampaignFields,
  productCount: number
) {
  return {
    name: fields.name,
    type: fields.type,
    startsAt: fields.startsAt.toISOString(),
    endsAt: fields.endsAt.toISOString(),
    showOnHomepage: fields.showOnHomepage,
    showPopup: fields.showPopup,
    productCount,
  };
}

export async function createMarketingCampaignAction(
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return {
      ok: false,
      message: "Bu işlem için yetkiniz yok.",
    };
  }

  const parsed = parseFormInput(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Girdi doğrulanamadı.",
    };
  }

  const isActive = formData.get("isActive") === "on";
  const showOnHomepage =
    formData.get("showOnHomepage") === "on";
  const showPopup = formData.get("showPopup") === "on";

  const fields = toFields(
    parsed.data,
    isActive,
    showOnHomepage,
    showPopup
  );

  let createdId: string;

  try {
    // Repository henüz kampanyalı fiyatları kabul etmiyor.
    // Sonraki adımda fiyatları da bu çağrıya ekleyeceğiz.
    const campaign = await createMarketingCampaign(
  fields,
  parsed.data.variantIds.map((variantId) => ({
    variantId,
    campaignPrice: parsed.data.campaignPrices[variantId],
  }))
);

    createdId = campaign.id;
  } catch {
    return {
      ok: false,
      message: "Kaydedilemedi.",
    };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CAMPAIGN_CREATED",
    entityType: "MarketingCampaign",
    entityId: createdId,
    metadata: auditMetadata(
      fields,
      parsed.data.variantIds.length
    ),
  });

  revalidatePath("/");

  redirect(`${LIST_PATH}/${createdId}`);
}

export async function updateMarketingCampaignAction(
  campaignId: string,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return {
      ok: false,
      message: "Bu işlem için yetkiniz yok.",
    };
  }

  const existing = await findMarketingCampaignForAdmin(
    campaignId
  );

  if (!existing) {
    return {
      ok: false,
      message: "Kampanya bulunamadı.",
    };
  }

  const parsed = parseFormInput(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ??
        "Girdi doğrulanamadı.",
    };
  }

  const isActive = formData.get("isActive") === "on";
  const showOnHomepage =
    formData.get("showOnHomepage") === "on";
  const showPopup = formData.get("showPopup") === "on";

  const fields = toFields(
    parsed.data,
    isActive,
    showOnHomepage,
    showPopup
  );

  try {
    // Repository güncellendiğinde kampanyalı fiyatları
    // da bu çağrıya ekleyeceğiz.
    await updateMarketingCampaign(
  campaignId,
  fields,
  parsed.data.variantIds.map((variantId) => ({
    variantId,
    campaignPrice: parsed.data.campaignPrices[variantId],
  }))
);
  } catch {
    return {
      ok: false,
      message: "Kaydedilemedi.",
    };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CAMPAIGN_UPDATED",
    entityType: "MarketingCampaign",
    entityId: campaignId,
    metadata: auditMetadata(
      fields,
      parsed.data.variantIds.length
    ),
  });

  revalidatePath("/");

  return { ok: true };
}

/**
 * Kampanyayı pasif yapar.
 * Kayıt silinmez, yalnızca isActive=false olur.
 */
export async function deactivateMarketingCampaignAction(
  campaignId: string
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return {
      ok: false,
      message: "Bu işlem için yetkiniz yok.",
    };
  }

  const existing = await findMarketingCampaignForAdmin(
    campaignId
  );

  if (!existing) {
    return {
      ok: false,
      message: "Kampanya bulunamadı.",
    };
  }

  try {
    await deactivateMarketingCampaign(campaignId);
  } catch {
    return {
      ok: false,
      message: "Güncellenemedi.",
    };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CAMPAIGN_DEACTIVATED",
    entityType: "MarketingCampaign",
    entityId: campaignId,
  });

  revalidatePath("/");
  revalidatePath(LIST_PATH);

  return { ok: true };
}

export async function deleteMarketingCampaignAction(
  campaignId: string
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();

  if (!admin || admin.role !== "ADMIN") {
    return {
      ok: false,
      message: "Bu işlem için yetkiniz yok.",
    };
  }

  const existing = await findMarketingCampaignForAdmin(
    campaignId
  );

  if (!existing) {
    return {
      ok: false,
      message: "Kampanya bulunamadı.",
    };
  }

  try {
    await deleteMarketingCampaign(campaignId);
  } catch {
    return {
      ok: false,
      message: "Silinemedi.",
    };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "CAMPAIGN_DELETED",
    entityType: "MarketingCampaign",
    entityId: campaignId,
  });

  revalidatePath("/");

  redirect(LIST_PATH);
}
