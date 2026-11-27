import { Router } from "express";
const router = Router();
import {
  getCurrentUser,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import {
  authenticateUser,
  authorizePermissions,
} from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import { updateUserSchema } from "../validators/user.validator";

router
  .route("/")
  .get(authenticateUser, authorizePermissions("ADMIN"), getAllUsers);

router.route("/me").get(authenticateUser, getCurrentUser);

router
  .route("/:id")
  .patch(
    authenticateUser,
    authorizePermissions("ADMIN"),
    validate(updateUserSchema),
    updateUser,
  )
  .delete(authenticateUser, authorizePermissions("ADMIN"), deleteUser);

export default router;
