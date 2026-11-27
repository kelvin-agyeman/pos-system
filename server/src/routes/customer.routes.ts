import { Router } from "express";
const router = Router();
import {
  createCustomer,
  getAllCustomers,
} from "../controllers/customer.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import { createCustomerSchema } from "../validators/customer.validator";

router
  .route("/")
  .post(authenticateUser, validate(createCustomerSchema), createCustomer)
  .get(authenticateUser, getAllCustomers);

export default router;
