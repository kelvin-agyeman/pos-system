import { Router } from "express";
const router = Router();
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.validator";

router
  .route("/")
  .post(authenticateUser, validate(createProductSchema), createProduct)
  .get(authenticateUser, getAllProducts);

router
  .route("/:id")
  .get(authenticateUser, getSingleProduct)
  .patch(authenticateUser, validate(updateProductSchema), updateProduct)
  .delete(authenticateUser, deleteProduct);

export default router;
