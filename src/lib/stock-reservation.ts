/**
 * Rezervasyon süresi — sipariş oluşturulduğunda tutulan stoğun ödeme
 * tamamlanana kadar ne kadar kilitli kalacağı. Henüz canlı bir ödeme
 * entegrasyonu (iyzico) yok; checkout senkron tamamlanıyor, bu yüzden bu
 * süre bugün asıl olarak EŞZAMANLI checkout denemeleri arasındaki overselling'i
 * engeller. İleride iyzico'nun barındırdığı ödeme sayfasına yönlendirme
 * eklendiğinde (kart bilgisi girme + geri dönüş) aynı süre o bekleme
 * penceresini de karşılayacak şekilde seçildi — sektörde yaygın 10-20 dk
 * aralığının ortası. TEK merkezi kaynak: değiştirmek için yalnızca burası
 * düzenlenir (bkz. `checkout-shipping.ts`'teki `FREE_SHIPPING_THRESHOLD_TRY`
 * ile aynı desen).
 */
export const RESERVATION_TTL_MS = 15 * 60 * 1000;

export function computeReservationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESERVATION_TTL_MS);
}
