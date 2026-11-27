import {
  PaystackTransactionData,
  PaystackVerifyApiResponse,
} from "../../types/payment.types";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export class PaystackVerificationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "PaystackVerificationError";
    this.statusCode = statusCode;
  }
}

export const verifyPaystackTransaction = async (
  paymentReference: string,
): Promise<PaystackTransactionData> => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new PaystackVerificationError(
      "PAYSTACK_SECRET_KEY is not configured",
      500,
    );
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(paymentReference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
    },
  );

  const payload = (await response.json()) as PaystackVerifyApiResponse;

  if (!response.ok || !payload.status || !payload.data) {
    const statusCode = response.status >= 400 && response.status < 500 ? 400 : 500;
    throw new PaystackVerificationError(
      payload.message || "Payment verification failed",
      statusCode,
    );
  }

  return payload.data;
};
