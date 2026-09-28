import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { RoleKey } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { publicEnv, serverEnv } from "@/config/env";

function createAuth() {
  if (!serverEnv.AUTH_SECRET) {
    throw new Error("AUTH_SECRET tanımlı değil; authentication başlatılamaz.");
  }

  return betterAuth({
    secret: serverEnv.AUTH_SECRET,
    baseURL: publicEnv.NEXT_PUBLIC_SITE_URL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        firstName: {
          type: "string",
          required: true,
          input: true,
        },
        lastName: {
          type: "string",
          required: true,
          input: true,
        },
        // roleId, Better Auth'un bilmediği/geçirmediği bir alan olduğundan `create.before`
        // hook'unun döndürdüğü değerin gerçek Prisma create() çağrısına ulaşabilmesi için
        // burada tanıtılmalı. `input: false` ile istemciden asla kabul edilmez; `required: false`
        // ile Better Auth istek gövdesinde bu alanı zorunlu tutmaz (asıl değeri her zaman
        // `databaseHooks.user.create.before` atar; Prisma'daki NOT NULL kısıtı böylece korunur).
        roleId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    account: {
      fields: {
        providerId: "provider",
        accountId: "providerAccountId",
        accessTokenExpiresAt: "expiresAt",
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Yeni kullanıcı her zaman CUSTOMER rolüyle oluşturulur; roleId istemciden
          // gelmez, burada sunucu tarafında atanır (bkz. CLAUDE.md — admin işlemlerinde
          // rol kontrolü ilkesi).
          before: async (user) => {
            const customerRole = await prisma.role.findUnique({
              where: { key: RoleKey.CUSTOMER },
            });
            if (!customerRole) {
              throw new Error(
                "CUSTOMER rolü veritabanında bulunamadı; önce `npm run db:seed` çalıştırılmalı.",
              );
            }
            return {
              data: {
                ...user,
                roleId: customerRole.id,
              },
            };
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

export const auth = createAuth();
