import { describe, expect, it } from "vitest";
import { isSafeHttpUrl } from "@/lib/safe-url";

describe("isSafeHttpUrl", () => {
  it("http/https URL'leri kabul eder", () => {
    expect(isSafeHttpUrl("https://fdc.nal.usda.gov/food-details/170567/nutrients")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });

  it("javascript:/data:/vbscript: gibi güvensiz şemaları reddeder", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("geçersiz/boş URL'leri reddeder", () => {
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl("not a url")).toBe(false);
    expect(isSafeHttpUrl("//example.com")).toBe(false);
  });
});
