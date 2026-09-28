/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `address-repository.ts`'i
 * uçtan uca test eder: create/update/delete, VARSAYıLAN adres transaction'ı
 * ve en kritiği — KULLANICI İZOLASYONU (B kullanıcısı A'nın adresini
 * update/delete edemez, IDOR'a kapalı olduğu `where: {id, userId}` scope'lu
 * mutasyonlarla doğrulanır).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  createAddress,
  deleteAddress,
  findAddressForUser,
  listAddressesForUser,
  updateAddress,
  type AddressFields,
} from "@/server/repositories/address-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/addresses] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Address repository (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdUserIds: string[] = [];

  async function createUser(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    const user = await prisma.user.create({
      data: { roleId: role.id, email: `addr-${label}-${suffix}@ossa-test.local`, firstName: "Test", lastName: label },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  function baseFields(overrides: Partial<AddressFields> = {}): AddressFields {
    return {
      type: "SHIPPING",
      title: "Ev",
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "05349567879",
      city: "Mersin",
      district: "Mut",
      neighborhood: null,
      postalCode: null,
      addressLine: "Seyran Sokak No:2",
      invoiceCompanyName: null,
      taxOffice: null,
      taxNumber: null,
      isDefault: false,
      ...overrides,
    };
  }

  afterAll(async () => {
    await prisma.address.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("oluşturma: adres kullanıcıya bağlı kaydedilir", async () => {
    const userId = await createUser("create");
    const address = await createAddress(userId, baseFields());

    const found = await findAddressForUser(address.id, userId);
    expect(found?.title).toBe("Ev");
    expect(found?.city).toBe("Mersin");
  });

  it("güncelleme: kendi adresini günceller", async () => {
    const userId = await createUser("update");
    const address = await createAddress(userId, baseFields());

    const updated = await updateAddress(address.id, userId, baseFields({ title: "İş Adresi" }));
    expect(updated).toBe(true);

    const found = await findAddressForUser(address.id, userId);
    expect(found?.title).toBe("İş Adresi");
  });

  it("silme: kendi adresini siler", async () => {
    const userId = await createUser("delete");
    const address = await createAddress(userId, baseFields());

    const deleted = await deleteAddress(address.id, userId);
    expect(deleted).toBe(true);

    const found = await findAddressForUser(address.id, userId);
    expect(found).toBeNull();
  });

  it("KULLANICI İZOLASYONU: B kullanıcısı A'nın adresini GÖREMEZ", async () => {
    const userA = await createUser("iso-view-a");
    const userB = await createUser("iso-view-b");
    const address = await createAddress(userA, baseFields());

    const foundByB = await findAddressForUser(address.id, userB);
    expect(foundByB).toBeNull();

    const listByB = await listAddressesForUser(userB);
    expect(listByB.some((a) => a.id === address.id)).toBe(false);
  });

  it("KULLANICI İZOLASYONU: B kullanıcısı A'nın adresini GÜNCELLEYEMEZ (IDOR)", async () => {
    const userA = await createUser("iso-update-a");
    const userB = await createUser("iso-update-b");
    const address = await createAddress(userA, baseFields());

    const updated = await updateAddress(address.id, userB, baseFields({ title: "Ele Geçirildi" }));
    expect(updated).toBe(false);

    const found = await findAddressForUser(address.id, userA);
    expect(found?.title).toBe("Ev");
  });

  it("KULLANICI İZOLASYONU: B kullanıcısı A'nın adresini SİLEMEZ (IDOR)", async () => {
    const userA = await createUser("iso-delete-a");
    const userB = await createUser("iso-delete-b");
    const address = await createAddress(userA, baseFields());

    const deleted = await deleteAddress(address.id, userB);
    expect(deleted).toBe(false);

    const found = await findAddressForUser(address.id, userA);
    expect(found).not.toBeNull();
  });

  it("varsayılan adres: yeni varsayılan eklenince eskisi otomatik false olur", async () => {
    const userId = await createUser("default");
    const first = await createAddress(userId, baseFields({ title: "İlk", isDefault: true }));
    const second = await createAddress(userId, baseFields({ title: "İkinci", isDefault: true }));

    const firstAfter = await findAddressForUser(first.id, userId);
    const secondAfter = await findAddressForUser(second.id, userId);
    expect(firstAfter?.isDefault).toBe(false);
    expect(secondAfter?.isDefault).toBe(true);
  });
});
