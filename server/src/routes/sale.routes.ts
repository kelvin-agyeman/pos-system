import { Router } from "express";
const router = Router();
import {
  createSale,
  verifyPaystackPayment,
  getAllSales,
  getAllSalesMade,
  getSaleById,
} from "../controllers/sale.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import { createSaleSchema } from "../validators/sale.validator";

router
  .route("/")
  .post(authenticateUser, validate(createSaleSchema), createSale)
  .get(authenticateUser, getAllSales);

router
  .route("/verify-paystack")
  .post(authenticateUser, validate(createSaleSchema), verifyPaystackPayment);

router.route("/my-sales").get(authenticateUser, getAllSalesMade);

router.route("/:id").get(authenticateUser, getSaleById);

export default router;
