import type { AddressType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export interface AddressFields {
  type: AddressType;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  postalCode: string | null;
  addressLine: string;
  invoiceCompanyName: string | null;
  taxOffice: string | null;
  taxNumber: string | null;
  isDefault: boolean;
}

/** Kullanıcının TÜM adresleri — yalnızca kendi hesabı, `userId` sorgunun içinde scope edilir. */
export async function listAddressesForUser(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

/** Düzenleme formunu doldurmak için — `id` + `userId` BİRLİKTE sorgulanır (IDOR'a kapalı). */
export async function findAddressForUser(id: string, userId: string) {
  return prisma.address.findFirst({ where: { id, userId } });
}

export async function createAddress(userId: string, fields: AddressFields) {
  if (fields.isDefault) {
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.address.create({ data: { ...fields, userId } });
    });
  }
  return prisma.address.create({ data: { ...fields, userId } });
}

/**
 * `updateMany` ile `id`+`userId` AYNI sorguda scope edilir (fetch-then-check
 * YAPILMAZ) — dönen `count === 0` ise ya adres yok ya da başkasına ait,
 * çağıran katman ikisini de aynı generic hatayla ele alır.
 */
export async function updateAddress(id: string, userId: string, fields: AddressFields): Promise<boolean> {
  if (fields.isDefault) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      return tx.address.updateMany({ where: { id, userId }, data: fields });
    });
    return result.count > 0;
  }
  const result = await prisma.address.updateMany({ where: { id, userId }, data: fields });
  return result.count > 0;
}

export async function deleteAddress(id: string, userId: string): Promise<boolean> {
  const result = await prisma.address.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
