import "server-only";

import { getIyzicoClient } from "./iyzico-client";

export type IyzicoPaymentResult = {
  status?: string;
  paymentStatus?: string;
  paymentId?: string;
  basketId?: string;
  signature?: string;
  conversationId?: string;
  token?: string;
  price?: number | string;
  paidPrice?: number | string;
  currency?: string;
  errorCode?: string;
  errorMessage?: string;
};

/**
 * `conversationId` iyzico'ya GÖNDERİLİR çünkü yanıt onu aynen geri yansıtır
 * ve hem imza yükünün (`verifyIyzicoCheckoutSignature`) hem de kimlik
 * eşleştirmesinin (`verifyIyzicoPayment`) parçasıdır. Gönderilmezse yanıttaki
 * alan boş/farklı gelir, imza doğrulaması başarısız olur ve GERÇEKTEN ödenmiş
 * bir sipariş asla PAID'e geçemez.
 */
export async function retrieveIyzicoPayment(
  token: string,
  conversationId?: string,
): Promise<IyzicoPaymentResult> {
  if (!token.trim()) {
    throw new Error("iyzico ödeme token'ı eksik.");
  }

  const client = getIyzicoClient();

  const result = await new Promise<unknown>((resolve, reject) => {
    client.checkoutForm.retrieve(
      conversationId ? { locale: "tr", token, conversationId } : { locale: "tr", token },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      },
    );
  });

  if (!result || typeof result !== "object") {
    throw new Error("iyzico geçersiz ödeme sonucu döndürdü.");
  }

  return result as IyzicoPaymentResult;
}
