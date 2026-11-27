import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { Prisma, Product } from "../../../generated/prisma/client";
import {
  CreateProductType,
  ProductQueryType,
  ProductsData,
  ServiceResponse,
  UpdateProductType,
} from "../../types/product.types";

const findProductByIdOrError = async (
  id: number,
): Promise<
  | { product: Product; error?: never }
  | { product?: never; error: ServiceResponse<never> }
> => {
  if (!Number.isInteger(id) || id <= 0) {
    return {
      error: {
        status: StatusCodes.BAD_REQUEST,
        message: "Invalid product id",
      },
    };
  }

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    return {
      error: {
        status: StatusCodes.NOT_FOUND,
        message: `No product found with id ${id}`,
      },
    };
  }

  return { product };
};

export const createProductService = async (
  payload: CreateProductType,
): Promise<ServiceResponse<Product>> => {
  const { name, price, quantity, category } = payload;

  const existingProduct = await prisma.product.findFirst({
    where: { name },
  });

  if (existingProduct) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Product "${name}" already exists`,
    };
  }

  const newProduct = await prisma.product.create({
    data: {
      name,
      price,
      quantity,
      category,
    },
  });

  return {
    status: StatusCodes.CREATED,
    data: newProduct,
  };
};

export const getAllProductsService = async (
  query: ProductQueryType,
): Promise<ServiceResponse<ProductsData>> => {
  const { search, category, minPrice, maxPrice } = query;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (category) {
    where.category = category;
  }

  const priceFilter: Prisma.FloatFilter = {};
  if (minPrice !== undefined && minPrice !== "") {
    const parsedMin = Number(minPrice);
    if (!Number.isNaN(parsedMin)) priceFilter.gte = parsedMin;
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    const parsedMax = Number(maxPrice);
    if (!Number.isNaN(parsedMax)) priceFilter.lte = parsedMax;
  }
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
  ]);

  return {
    status: StatusCodes.OK,
    data: {
      totalProducts,
      products,
    },
  };
};

export const getSingleProductService = async (
  id: number,
): Promise<ServiceResponse<{ product: Product }>> => {
  const { product, error } = await findProductByIdOrError(id);

  if (error) return error;

  return {
    status: StatusCodes.OK,
    data: { product },
  };
};

export const updateProductService = async (
  id: number,
  payload: UpdateProductType,
): Promise<ServiceResponse<Product>> => {
  const { error } = await findProductByIdOrError(id);

  if (error) return error;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: payload.name,
      price: payload.price,
      quantity: payload.quantity,
      category: payload.category,
    },
  });

  return {
    status: StatusCodes.OK,
    data: updatedProduct,
  };
};

export const deleteProductService = async (
  id: number,
): Promise<ServiceResponse> => {
  const { error } = await findProductByIdOrError(id);

  if (error) return error;

  await prisma.product.delete({ where: { id } });

  return {
    status: StatusCodes.OK,
    message: "Product deleted successfully",
  };
};
