import { Product } from "../../generated/prisma/client";

export type CreateProductType = {
  name: string;
  price: number;
  quantity: number;
  category: string;
};

export type UpdateProductType = {
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
};

export type ProductQueryType = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
};

export type ProductsData = {
  totalProducts: number;
  products: Product[];
};

export type ServiceResponse<T = any> = {
  status: number;
  message?: string;
  data?: T;
};
