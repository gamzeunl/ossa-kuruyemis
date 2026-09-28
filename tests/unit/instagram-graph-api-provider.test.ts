import { describe, expect, it } from "vitest";
import { isInstagramApiConfigured } from "@/server/providers/instagram-graph-api-provider";

describe("isInstagramApiConfigured", () => {
  it("test ortamında INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_BUSINESS_ACCOUNT_ID tanımlı değilse false döner", () => {
    // Bu test ortamı .env'den yalnızca DATABASE_URL/TEST_DATABASE_URL gibi
    // zaten kullanılan değişkenleri okur — Instagram env'leri burada BİLEREK
    // ayarlanmaz (gerçek token repoya/CI'ya asla yazılmaz).
    if (process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      return;
    }
    expect(isInstagramApiConfigured()).toBe(false);
  });
});
