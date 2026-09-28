import { describe, expect, it } from "vitest";
import {
  instagramPostFormSchema,
  normalizeInstagramPostUrl,
  parseInstagramPostUrl,
} from "@/lib/instagram-post-schema";

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    postUrl: "https://www.instagram.com/p/ABC123/",
    caption: "Test caption",
    sortOrder: 0,
    ...overrides,
  };
}

describe("instagramPostFormSchema — postUrl güvenliği ve format doğrulaması", () => {
  it("gerçek post linki (https://www.instagram.com/p/...) kabul edilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("gerçek reel linki (https://www.instagram.com/reel/...) kabul edilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://www.instagram.com/reel/XYZ789/" }));
    expect(result.success).toBe(true);
  });

  it("www'suz post linki kabul edilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://instagram.com/p/XYZ/" }));
    expect(result.success).toBe(true);
  });

  it("javascript: şeması reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "javascript:alert(1)" }));
    expect(result.success).toBe(false);
  });

  it("data: şeması reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(
      baseInput({ postUrl: "data:text/html,<script>alert(1)</script>" }),
    );
    expect(result.success).toBe(false);
  });

  it("instagram.com OLMAYAN gerçek bir http(s) linki reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://evil.example.com/p/1" }));
    expect(result.success).toBe(false);
  });

  it("instagram.com içeren ama farklı bir domain (typosquatting) reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://instagram.com.evil.example.com/p/1" }));
    expect(result.success).toBe(false);
  });

  it("başka bir alt alan adı (ör. help.instagram.com) reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://help.instagram.com/p/1/" }));
    expect(result.success).toBe(false);
  });

  it("profil URL'si reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://www.instagram.com/ossa.kuruyemis/" }));
    expect(result.success).toBe(false);
  });

  it("story URL'si reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(
      baseInput({ postUrl: "https://www.instagram.com/stories/ossa.kuruyemis/123456/" }),
    );
    expect(result.success).toBe(false);
  });

  it("DM URL'si reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "https://www.instagram.com/direct/t/123/" }));
    expect(result.success).toBe(false);
  });

  it("boş postUrl reddedilir", () => {
    const result = instagramPostFormSchema.safeParse(baseInput({ postUrl: "" }));
    expect(result.success).toBe(false);
  });
});

describe("parseInstagramPostUrl", () => {
  it("post linkini {kind:'p', shortcode} olarak ayrıştırır", () => {
    expect(parseInstagramPostUrl("https://www.instagram.com/p/ABC123/")).toEqual({ kind: "p", shortcode: "ABC123" });
  });

  it("reel linkini {kind:'reel', shortcode} olarak ayrıştırır", () => {
    expect(parseInstagramPostUrl("https://www.instagram.com/reel/XYZ789/")).toEqual({
      kind: "reel",
      shortcode: "XYZ789",
    });
  });

  it("geçersiz path (profil) için null döner", () => {
    expect(parseInstagramPostUrl("https://www.instagram.com/ossa.kuruyemis/")).toBeNull();
  });
});

describe("normalizeInstagramPostUrl", () => {
  it("www'suz + izleme query param'lı bir linki kanonik forma indirger", () => {
    expect(normalizeInstagramPostUrl("https://instagram.com/p/ABC123/?utm_source=ig_web")).toBe(
      "https://www.instagram.com/p/ABC123/",
    );
  });

  it("trailing slash olmayan bir linki de doğru normalize eder", () => {
    expect(normalizeInstagramPostUrl("https://www.instagram.com/reel/XYZ789")).toBe(
      "https://www.instagram.com/reel/XYZ789/",
    );
  });

  it("geçersiz URL için null döner", () => {
    expect(normalizeInstagramPostUrl("https://evil.example.com/p/1")).toBeNull();
  });
});
