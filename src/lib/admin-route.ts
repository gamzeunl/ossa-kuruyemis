const ADMIN_ROOT = "/yonetim";

/**
 * Tek karar kaynağı: bir pathname yönetim paneline mi ait? Storefront-only
 * bileşenler (ör. `CampaignPopup`) bunu kullanarak `/yonetim/**` altında
 * kendini hiç render etmez — admin panel storefront popup'larından tamamen
 * izole kalır.
 */
export function isAdminPathname(pathname: string): boolean {
  return pathname === ADMIN_ROOT || pathname.startsWith(`${ADMIN_ROOT}/`);
}
