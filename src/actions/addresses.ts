"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addressFormSchema } from "@/lib/address-schema";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  type AddressFields,
} from "@/server/repositories/address-repository";

export type AddressActionResult = { ok: true } | { ok: false; message: string };

const LIST_PATH = "/hesabim/adresler";

function parseFormInput(formData: FormData) {
  return addressFormSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    district: String(formData.get("district") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    addressLine: String(formData.get("addressLine") ?? ""),
    invoiceCompanyName: String(formData.get("invoiceCompanyName") ?? ""),
    taxOffice: String(formData.get("taxOffice") ?? ""),
    taxNumber: String(formData.get("taxNumber") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
}

export async function createAddressAction(formData: FormData): Promise<AddressActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Adres eklemek için giriş yapmalısınız." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  try {
    await createAddress(user.id, parsed.data as AddressFields);
  } catch {
    return { ok: false, message: "Adres kaydedilemedi." };
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function updateAddressAction(addressId: string, formData: FormData): Promise<AddressActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Bu işlem için giriş yapmalısınız." };
  }

  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  let updated: boolean;
  try {
    updated = await updateAddress(addressId, user.id, parsed.data as AddressFields);
  } catch {
    return { ok: false, message: "Adres güncellenemedi." };
  }

  if (!updated) {
    return { ok: false, message: "Adres bulunamadı." };
  }

  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function deleteAddressAction(addressId: string): Promise<AddressActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Bu işlem için giriş yapmalısınız." };
  }

  let deleted: boolean;
  try {
    deleted = await deleteAddress(addressId, user.id);
  } catch {
    return { ok: false, message: "Adres silinemedi." };
  }

  if (!deleted) {
    return { ok: false, message: "Adres bulunamadı." };
  }

  revalidatePath(LIST_PATH);
  return { ok: true };
}
