import { Customer } from "../../generated/prisma/client";

export type CreateCustomerType = {
  fullName?: string;
  phone: string;
  email?: string;
};

export type CustomersData = {
  totalCustomers: number;
  customers: Customer[];
};

export type ServiceResponse<T = any> = {
  status: number;
  message?: string;
  data?: T;
};
