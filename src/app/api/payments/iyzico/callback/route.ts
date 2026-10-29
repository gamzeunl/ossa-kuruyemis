import { NextRequest, NextResponse } from "next/server";
import { finalizeIyzicoPayment } from "@/server/payments/iyzico-finalize";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let token: string | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body: unknown = await request.json();

      if (
        body &&
        typeof body === "object" &&
        "token" in body &&
        typeof body.token === "string"
      ) {
        token = body.token;
      }
    } else {
      const form = await request.formData();
      const value = form.get("token");
      token = typeof value === "string" ? value : null;
    }

    if (!token || token.length > 512) {
      return NextResponse.json(
        { error: "Geçersiz ödeme bildirimi." },
        { status: 400 },
      );
    }

    const result = await finalizeIyzicoPayment(token);

    return NextResponse.redirect(
      new URL("/odeme/sonuc", request.url),
      { status: 303 },
    );
  } catch (error) {
    console.error(
      "iyzico callback işlenemedi:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );

    return NextResponse.redirect(
      new URL("/odeme/sonuc", request.url),
      { status: 303 },
    );
  }
}
