import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import {
  Customer,
  PaymentMethod,
  Prisma,
  Product,
  Sale,
  SalesItem,
} from "../../../generated/prisma/client";
import { addLoyaltyPointsService } from "../customer/customer.service";
import {
  PaystackVerificationError,
  verifyPaymentService,
} from "../payment/payment.service";
import {
  CreateSaleType,
  SaleCustomerSummary,
  SaleItemInput,
  SalesListData,
  SaleWithDetails,
  ServiceResponse,
} from "../../types/sale.types";

class SaleProcessingError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SaleProcessingError";
    this.status = status;
  }
}

type PreparedSaleItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
};

type PrismaSaleWithRelations = Sale & {
  salesItems: (SalesItem & { product: Product })[];
  customer?: SaleCustomerSummary | null;
};

const saleListInclude = {
  salesItems: {
    include: {
      product: true,
    },
  },
  customer: {
    select: {
      id: true,
      fullName: true,
      loyaltyPoints: true,
    },
  },
} satisfies Prisma.SaleInclude;

const formatSaleWithDetails = (
  sale: PrismaSaleWithRelations,
): SaleWithDetails => {
  const { salesItems, customer, ...baseSale } = sale;

  return {
    ...baseSale,
    SalesItems: salesItems.map(({ product, ...item }) => ({
      ...item,
      Product: product,
    })),
    ...(customer !== undefined ? { Customer: customer } : {}),
  };
};

const prepareSaleItems = async (
  tx: Prisma.TransactionClient,
  items: SaleItemInput[],
): Promise<{ preparedItems: PreparedSaleItem[]; totalAmount: number }> => {
  const productStockMap = new Map<number, Product>();
  const preparedItems: PreparedSaleItem[] = [];
  let totalAmount = 0;

  for (const item of items) {
    let product = productStockMap.get(item.productId);

    if (!product) {
      const found = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!found) {
        throw new SaleProcessingError(
          StatusCodes.NOT_FOUND,
          "Product not found",
        );
      }

      product = { ...found };
      productStockMap.set(item.productId, product);
    }

    if (product.quantity < item.quantity) {
      throw new SaleProcessingError(
        StatusCodes.BAD_REQUEST,
        `Not enough stock for ${product.name}`,
      );
    }

    product.quantity -= item.quantity;
    totalAmount += product.price * item.quantity;

    preparedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      price: product.price,
    });
  }

  return { preparedItems, totalAmount };
};

const persistSaleAndItems = async (
  tx: Prisma.TransactionClient,
  params: {
    userId: number;
    totalAmount: number;
    paymentMethod?: PaymentMethod;
    cashGiven: number;
    change: number;
    paymentReference?: string;
    customerId?: number;
    preparedItems: PreparedSaleItem[];
  },
): Promise<Sale> => {
  const {
    userId,
    totalAmount,
    paymentMethod,
    cashGiven,
    change,
    paymentReference,
    customerId,
    preparedItems,
  } = params;

  if (customerId) {
    const customer: Customer | null = await tx.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new SaleProcessingError(
        StatusCodes.NOT_FOUND,
        "Customer not found",
      );
    }
  }

  const sale = await tx.sale.create({
    data: {
      userId,
      totalAmount,
      ...(paymentMethod ? { paymentMethod } : {}),
      cashGiven,
      change,
      paymentReference: paymentReference ?? null,
      customerId: customerId ?? null,
    },
  });

  for (const item of preparedItems) {
    const updated = await tx.product.updateMany({
      where: {
        id: item.productId,
        quantity: { gte: item.quantity },
      },
      data: {
        quantity: { decrement: item.quantity },
      },
    });

    if (updated.count === 0) {
      throw new SaleProcessingError(
        StatusCodes.BAD_REQUEST,
        `Not enough stock for ${item.productName}`,
      );
    }
  }

  await tx.salesItem.createMany({
    data: preparedItems.map((item) => ({
      saleId: sale.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  if (customerId) {
    await addLoyaltyPointsService(customerId, totalAmount, tx);
  }

  return sale;
};

export const createSaleService = async (
  userId: number,
  payload: CreateSaleType,
): Promise<ServiceResponse<Sale>> => {
  const { items, cashGiven, paymentMethod, paymentReference, customerId } =
    payload;

  if (!items || items.length === 0) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Cart is empty",
    };
  }

  const isPaystackPayment = Boolean(paymentReference);
  const resolvedPaymentMethod =
    paymentMethod ?? (isPaystackPayment ? undefined : "CASH");

  let verifiedPaidAmount: number | undefined;

  if (isPaystackPayment && paymentReference) {
    try {
      const verification = await verifyPaymentService(paymentReference);

      if (!verification.verified) {
        return {
          status: StatusCodes.BAD_REQUEST,
          message: "Payment verification failed",
        };
      }

      verifiedPaidAmount = verification.paidAmount;
    } catch (error) {
      if (error instanceof PaystackVerificationError && error.statusCode < 500) {
        return {
          status: StatusCodes.BAD_REQUEST,
          message: "Payment verification failed",
        };
      }

      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Payment verification failed",
      };
    }
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const { preparedItems, totalAmount } = await prepareSaleItems(tx, items);

      let change = 0;
      let finalCashGiven = totalAmount;

      if (isPaystackPayment) {
        if (
          verifiedPaidAmount === undefined ||
          verifiedPaidAmount < totalAmount
        ) {
          throw new SaleProcessingError(
            StatusCodes.BAD_REQUEST,
            "Paid amount is less than cart total",
          );
        }

        finalCashGiven = verifiedPaidAmount;
      } else if (resolvedPaymentMethod === "CASH") {
        if (cashGiven === undefined || cashGiven < totalAmount) {
          throw new SaleProcessingError(
            StatusCodes.BAD_REQUEST,
            "Insufficient cash provided",
          );
        }

        change = cashGiven - totalAmount;
        finalCashGiven = cashGiven;
      }

      return persistSaleAndItems(tx, {
        userId,
        totalAmount,
        paymentMethod: resolvedPaymentMethod,
        cashGiven: finalCashGiven,
        change,
        paymentReference,
        customerId,
        preparedItems,
      });
    });

    return {
      status: StatusCodes.CREATED,
      message: isPaystackPayment
        ? "Payment verified and sale completed"
        : "Sale successful",
      data: sale,
    };
  } catch (error) {
    if (error instanceof SaleProcessingError) {
      return {
        status: error.status,
        message: error.message,
      };
    }

    throw error;
  }
};

export const getAllSalesService = async (): Promise<
  ServiceResponse<SalesListData>
> => {
  const [sales, totalSales] = await Promise.all([
    prisma.sale.findMany({
      include: saleListInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count(),
  ]);

  const totalRevenue = sales.reduce(
    (acc, sale) => acc + Number(sale.totalAmount || 0),
    0,
  );

  return {
    status: StatusCodes.OK,
    data: {
      totalSales,
      totalRevenue,
      sales: sales.map(formatSaleWithDetails),
    },
  };
};

export const getAllSalesMadeService = async (
  cashierId: number,
): Promise<ServiceResponse<SalesListData>> => {
  const [sales, totalSales] = await Promise.all([
    prisma.sale.findMany({
      where: { userId: cashierId },
      include: saleListInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({
      where: { userId: cashierId },
    }),
  ]);

  const totalRevenue = sales.reduce(
    (acc, sale) => acc + Number(sale.totalAmount || 0),
    0,
  );

  return {
    status: StatusCodes.OK,
    data: {
      totalSales,
      totalRevenue,
      sales: sales.map(formatSaleWithDetails),
    },
  };
};

export const getSaleByIdService = async (
  id: number,
): Promise<ServiceResponse<SaleWithDetails>> => {
  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Invalid sale id",
    };
  }

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      salesItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!sale) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Sale not found",
    };
  }

  return {
    status: StatusCodes.OK,
    data: formatSaleWithDetails(sale),
  };
};
