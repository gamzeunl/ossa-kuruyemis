"use server";

import { redirect } from "next/navigation";
import { toErrorMessage } from "@/lib/auth-error-message";
import { signInSchema, signUpSchema } from "@/lib/auth-schemas";
import { checkRateLimit, hashRateLimitIdentifier, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import type { AuthUser } from "@/types/provider";

export type AuthActionResult = { ok: true; user: AuthUser } | { ok: false; message: string };

function rateLimitedResult(retryAfterSeconds: number): AuthActionResult {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return {
    ok: false,
    message: `Çok fazla deneme yapıldı. Lütfen ${minutes} dakika sonra tekrar deneyin.`,
  };
}

export async function signUpAction(input: unknown): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const ipCheck = await checkRateLimit(`register:ip:${ip}`, RATE_LIMIT_POLICIES.registerByIp);
  if (!ipCheck.ok) {
    return rateLimitedResult(ipCheck.retryAfterSeconds ?? 60);
  }

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Girdi doğrulanamadı." };
  }

  try {
    const user = await betterAuthProvider.signUp(parsed.data);
    return { ok: true, user };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error, "Kayıt başarısız.") };
  }
}

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Girdi doğrulanamadı." };
  }

  const ip = await getClientIp();
  const [ipCheck, emailCheck] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, RATE_LIMIT_POLICIES.loginByIp),
    checkRateLimit(
      `login:email:${hashRateLimitIdentifier(parsed.data.email)}`,
      RATE_LIMIT_POLICIES.loginByEmail,
    ),
  ]);
  if (!ipCheck.ok || !emailCheck.ok) {
    return rateLimitedResult(Math.max(ipCheck.retryAfterSeconds ?? 0, emailCheck.retryAfterSeconds ?? 0));
  }

  try {
    const user = await betterAuthProvider.signIn(parsed.data);
    return { ok: true, user };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error, "Giriş başarısız.") };
  }
}

export async function signOutAction(): Promise<void> {
  await betterAuthProvider.signOut();
  redirect("/giris");
}
