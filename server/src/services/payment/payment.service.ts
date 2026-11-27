import { VerifiedPaymentResult } from "../../types/payment.types";
import {
  PaystackVerificationError,
  verifyPaystackTransaction,
} from "./paystack.service";

export { PaystackVerificationError };

export const verifyPaymentService = async (
  paymentReference: string,
): Promise<VerifiedPaymentResult> => {
  const paymentData = await verifyPaystackTransaction(paymentReference);

  return {
    verified: paymentData.status === "success",
    paidAmount: paymentData.amount / 100,
    reference: paymentData.reference || paymentReference,
    gatewayStatus: paymentData.status,
  };
};
