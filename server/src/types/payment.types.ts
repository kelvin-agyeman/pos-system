export type PaystackTransactionData = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency?: string;
  channel?: string;
  paid_at?: string;
};

export type PaystackVerifyApiResponse = {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
};

export type VerifiedPaymentResult = {
  verified: boolean;
  paidAmount: number;
  reference: string;
  gatewayStatus: string;
};
