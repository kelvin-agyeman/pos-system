import { Request, Response } from "express";
import * as customerService from "../services/customer/customer.service";
import { CreateCustomerType } from "../types/customer.types";

export const createCustomer = async (
  req: Request<{}, {}, CreateCustomerType>,
  res: Response,
) => {
  const result = await customerService.createCustomerService(req.body);

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json({
    msg: result.message,
    customer: result.data,
  });
};

export const getAllCustomers = async (req: Request, res: Response) => {
  const result = await customerService.getAllCustomersService();
  res.status(result.status).json(result.data);
};
