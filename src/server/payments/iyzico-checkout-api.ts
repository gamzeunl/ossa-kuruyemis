import "server-only";

import { getIyzicoClient } from "./iyzico-client";

export type IyzicoCheckoutResponse = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  conversationId?: string;
};

export async function initializeIyzicoCheckout(
  request: Record<string, unknown>,
): Promise<IyzicoCheckoutResponse> {
  const client = getIyzicoClient();

  const result = await new Promise<unknown>((resolve, reject) => {
    client.checkoutFormInitialize.create(request, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });

  if (!result || typeof result !== "object") {
    throw new Error("iyzico geçersiz bir yanıt döndürdü.");
  }

  const response = result as IyzicoCheckoutResponse;

  if (
    response.status !== "success" ||
    !response.token ||
    !response.conversationId ||
    (!response.checkoutFormContent && !response.paymentPageUrl)
  ) {
    throw new Error(
      response.errorMessage || "iyzico ödeme formu başlatılamadı.",
    );
  }

  return response;
}
