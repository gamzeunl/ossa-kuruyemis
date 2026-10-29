import "server-only";

import { createRequire } from "node:module";
import { serverEnv } from "@/config/env";

const require = createRequire(import.meta.url);

type IyzipayClient = {
  checkoutFormInitialize: {
    create: (
      request: Record<string, unknown>,
      callback: (error: Error | null, result: unknown) => void,
    ) => void;
  };
  checkoutForm: {
    retrieve: (
      request: Record<string, unknown>,
      callback: (error: Error | null, result: unknown) => void,
    ) => void;
  };
};

type IyzipayConstructor = new (options: {
  apiKey: string;
  secretKey: string;
  uri: string;
}) => IyzipayClient;

export function getIyzicoClient(): IyzipayClient {
  const { IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL } = serverEnv;

  if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY || !IYZICO_BASE_URL) {
    throw new Error("iyzico API yapılandırması eksik.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(IYZICO_BASE_URL);
  } catch {
    throw new Error("iyzico API adresi geçersiz.");
  }

  const hosts = {
    live: "api.iyzipay.com",
    sandbox: "sandbox-api.iyzipay.com",
  };

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.port ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error("iyzico API adresi güvenlik kontrolünden geçemedi.");
  }

  const isSandbox = parsedUrl.hostname === hosts.sandbox;
  const isLive = parsedUrl.hostname === hosts.live;

  if (!isSandbox && !isLive) {
    throw new Error("İzin verilmeyen iyzico API adresi.");
  }

  const sandboxKey = IYZICO_API_KEY.startsWith("sandbox-");
  const sandboxSecret = IYZICO_SECRET_KEY.startsWith("sandbox-");

  if (
    (isSandbox && (!sandboxKey || !sandboxSecret)) ||
    (isLive && (sandboxKey || sandboxSecret))
  ) {
    throw new Error("iyzico ortamı ile API anahtarları eşleşmiyor.");
  }

  const Iyzipay = require("iyzipay") as IyzipayConstructor;

  return new Iyzipay({
    apiKey: IYZICO_API_KEY,
    secretKey: IYZICO_SECRET_KEY,
    uri: parsedUrl.origin,
  });
}
