import { createAuthClient } from "better-auth/react";
import { publicEnv } from "@/config/env";

export const authClient = createAuthClient({
  baseURL: publicEnv.NEXT_PUBLIC_SITE_URL,
});
