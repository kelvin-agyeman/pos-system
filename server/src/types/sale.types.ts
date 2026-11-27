import {
  Customer,
  PaymentMethod,
  Product,
  Sale,
  SalesItem,
} from "../../generated/prisma/client";

export type SaleItemInput = {
  productId: number;
  quantity: number;
};

export type CreateSaleType = {
  items: SaleItemInput[];
  cashGiven?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  customerId?: number;
};

export type SaleCustomerSummary = Pick<
  Customer,
  "id" | "fullName" | "loyaltyPoints"
>;

export type SaleItemWithProduct = SalesItem & {
  Product: Product;
};

export type SaleWithDetails = Sale & {
  SalesItems: SaleItemWithProduct[];
  Customer?: SaleCustomerSummary | null;
};

export type SalesListData = {
  totalSales: number;
  totalRevenue: number;
  sales: SaleWithDetails[];
};

export type ServiceResponse<T = any> = {
  status: number;
  message?: string;
  data?: T;
};
