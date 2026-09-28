import type { AuthSession, AuthUser, Role, SignInInput, SignUpInput } from "@/types/provider";

export interface AuthProvider {
  signUp(input: SignUpInput): Promise<AuthUser>;
  signIn(input: SignInInput): Promise<AuthUser>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<AuthUser | null>;
  requireUser(): Promise<AuthUser>;
  requireRole(role: Role): Promise<AuthUser>;
  requireAnyRole(roles: Role[]): Promise<AuthUser>;
}
