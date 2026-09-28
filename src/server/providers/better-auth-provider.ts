import { headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import type { AuthProvider } from "./auth-provider";
import type { AuthSession, AuthUser, Role, SignInInput, SignUpInput } from "@/types/provider";

async function resolveAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: true },
  });
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.key,
  };
}

export class BetterAuthProvider implements AuthProvider {
  async signUp(input: SignUpInput): Promise<AuthUser> {
    const name = `${input.firstName} ${input.lastName}`.trim();
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        callbackURL: sanitizeRedirectPath(input.redirectTo),
      },
    });
    return resolveAuthUser(result.user.id);
  }

  async signIn(input: SignInInput): Promise<AuthUser> {
    const result = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
        callbackURL: sanitizeRedirectPath(input.redirectTo),
      },
    });
    return resolveAuthUser(result.user.id);
  }

  async signOut(): Promise<void> {
    await auth.api.signOut({ headers: await headers() });
  }

  async getSession(): Promise<AuthSession | null> {
    const result = await auth.api.getSession({ headers: await headers() });
    if (!result) {
      return null;
    }
    const user = await resolveAuthUser(result.user.id);
    return { user, expiresAt: result.session.expiresAt };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  async requireUser(): Promise<AuthUser> {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("Kimliği doğrulanmış kullanıcı bulunamadı.");
    }
    return user;
  }

  async requireRole(role: Role): Promise<AuthUser> {
    const user = await this.requireUser();
    if (user.role !== role) {
      throw new Error("Bu işlem için yetkiniz yok.");
    }
    return user;
  }

  async requireAnyRole(roles: Role[]): Promise<AuthUser> {
    const user = await this.requireUser();
    if (!roles.includes(user.role)) {
      throw new Error("Bu işlem için yetkiniz yok.");
    }
    return user;
  }
}

export const betterAuthProvider = new BetterAuthProvider();
