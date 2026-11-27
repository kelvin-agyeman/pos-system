import { Request, Response } from "express";
import * as saleService from "../services/sale/sale.service";
import { CreateSaleType } from "../types/sale.types";

export const createSale = async (
  req: Request<{}, {}, CreateSaleType>,
  res: Response,
) => {
  const result = await saleService.createSaleService(req.user!.id, req.body);

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json({
    msg: result.message,
    sale: result.data,
  });
};

export const verifyPaystackPayment = async (
  req: Request<{}, {}, CreateSaleType>,
  res: Response,
) => {
  const result = await saleService.createSaleService(req.user!.id, req.body);

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json({
    msg: result.message,
    totalAmount: result.data.totalAmount,
    paymentReference: result.data.paymentReference,
  });
};

export const getAllSales = async (req: Request, res: Response) => {
  const result = await saleService.getAllSalesService();
  res.status(result.status).json(result.data);
};

export const getAllSalesMade = async (req: Request, res: Response) => {
  const result = await saleService.getAllSalesMadeService(req.user!.id);
  res.status(result.status).json(result.data);
};

export const getSaleById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = await saleService.getSaleByIdService(Number(req.params.id));

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json(result.data);
};
