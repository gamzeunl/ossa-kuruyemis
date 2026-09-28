/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `user-profile-repository.ts`'i
 * test eder: `updateUserProfile` yalnızca `where:{id}` (oturumdaki kullanıcının
 * KENDİ id'si) ile çalıştığından yapısal olarak izolasyon zaten garantidir;
 * burada güncellemenin doğru satırı etkilediği ve BAŞKA bir kullanıcının
 * verisine dokunmadığı doğrulanır.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getUserProfile, updateUserProfile } from "@/server/repositories/user-profile-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/account-settings] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("user-profile-repository (izole test DB)", () => {
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
      data: {
        roleId: role.id,
        email: `profile-${label}-${suffix}@ossa-test.local`,
        firstName: "Eski",
        lastName: "Ad",
        phone: "05340000000",
      },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("kendi profilini günceller", async () => {
    const userId = await createUser("update");
    await updateUserProfile(userId, { firstName: "Yeni", lastName: "Soyad", phone: "05341112233" });

    const profile = await getUserProfile(userId);
    expect(profile?.firstName).toBe("Yeni");
    expect(profile?.lastName).toBe("Soyad");
    expect(profile?.phone).toBe("05341112233");
  });

  it("İZOLASYON: bir kullanıcının güncellemesi BAŞKA kullanıcıyı etkilemez", async () => {
    const userA = await createUser("iso-a");
    const userB = await createUser("iso-b");

    await updateUserProfile(userA, { firstName: "A-Güncellendi", lastName: "Ad", phone: null });

    const profileB = await getUserProfile(userB);
    expect(profileB?.firstName).toBe("Eski");
  });

  it("telefon null'a çekilebilir", async () => {
    const userId = await createUser("phone-null");
    await updateUserProfile(userId, { firstName: "Eski", lastName: "Ad", phone: null });

    const profile = await getUserProfile(userId);
    expect(profile?.phone).toBeNull();
  });
});
