import type { Metadata } from "next";
import type { ReactNode } from "react";

// Erişim zaten her `/hesabim/**` sayfasının kendi `requireUser(...)` çağrısıyla
// korunuyor; `noindex` yalnızca ek bir savunma katmanı — bkz. `yonetim/layout.tsx`
// ile aynı gerekçe. Bu layout başka hiçbir görsel/işlevsel değişiklik yapmaz.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
