"use server";

import { revalidatePath } from "next/cache";
import { profileSettingsSchema } from "@/lib/account-settings-schema";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { updateUserProfile } from "@/server/repositories/user-profile-repository";

export type ProfileSettingsActionResult = { ok: true } | { ok: false; message: string };

export async function updateProfileAction(formData: FormData): Promise<ProfileSettingsActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Bu işlem için giriş yapmalısınız." };
  }

  const parsed = profileSettingsSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  try {
    await updateUserProfile(user.id, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
    });
  } catch {
    return { ok: false, message: "Profil güncellenemedi." };
  }

  revalidatePath("/hesabim/ayarlar");
  revalidatePath("/hesabim");
  return { ok: true };
}
