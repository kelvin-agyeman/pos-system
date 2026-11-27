import { Request, Response } from "express";
import * as productService from "../services/product/product.service";
import {
  CreateProductType,
  ProductQueryType,
  UpdateProductType,
} from "../types/product.types";

export const createProduct = async (
  req: Request<{}, {}, CreateProductType>,
  res: Response,
) => {
  const result = await productService.createProductService(req.body);

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json(result.data);
};

export const getAllProducts = async (
  req: Request<{}, {}, {}, ProductQueryType>,
  res: Response,
) => {
  const result = await productService.getAllProductsService(req.query);
  res.status(result.status).json(result.data);
};

export const getSingleProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = await productService.getSingleProductService(
    Number(req.params.id),
  );

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json(result.data);
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, UpdateProductType>,
  res: Response,
) => {
  const result = await productService.updateProductService(
    Number(req.params.id),
    req.body,
  );

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json(result.data);
};

export const deleteProduct = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = await productService.deleteProductService(
    Number(req.params.id),
  );

  res.status(result.status).json({ msg: result.message });
};
