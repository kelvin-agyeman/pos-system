import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import {
  CreateCustomerType,
  CustomersData,
  ServiceResponse,
} from "../../types/customer.types";
import { Customer, Prisma } from "../../../generated/prisma/client";

export const createCustomerService = async (
  payload: CreateCustomerType,
): Promise<ServiceResponse<Customer>> => {
  const { fullName, phone, email } = payload;

  const existingCustomer = await prisma.customer.findFirst({
    where: email ? { OR: [{ phone }, { email }] } : { phone },
  });

  if (existingCustomer) {
    if (existingCustomer.phone === phone) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Customer already exists",
      };
    }
    if (email && existingCustomer.email === email) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Email already exists",
      };
    }
  }

  const customer = await prisma.customer.create({
    data: {
      fullName,
      phone,
      email,
    },
  });

  return {
    status: StatusCodes.CREATED,
    message: "Customer registered successfully",
    data: customer,
  };
};

export const getAllCustomersService = async (): Promise<
  ServiceResponse<CustomersData>
> => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    status: StatusCodes.OK,
    data: {
      totalCustomers: customers.length,
      customers,
    },
  };
};

export const addLoyaltyPointsService = async (
  customerId: number,
  amountSpent: number,
  tx: Prisma.TransactionClient = prisma,
): Promise<void> => {
  const customer = await tx.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) return;

  // Example: 1 point for every ₵10 spent
  const pointsEarned = Math.floor(amountSpent / 10);

  if (pointsEarned <= 0) return;

  await tx.customer.update({
    where: { id: customerId },
    data: {
      loyaltyPoints: {
        increment: pointsEarned,
      },
    },
  });
};
