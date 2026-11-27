import { Router } from "express";
const router = Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  registerUserSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  loginUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 1000 * 60 * 15, // 15 minutes
  max: 15,
  message: {
    msg: "IP rate limit exceeded, retry in 15 minutes",
  },
});

const emailRequestLimiter = rateLimiter({
  windowMs: 1000 * 60 * 10, // 10 minutes
  max: 5,
  message: {
    msg: "Too many email requests from this IP, please try again later",
  },
});

router
  .route("/forgot-password")
  .post(emailRequestLimiter, validate(forgotPasswordSchema), forgotPassword);

router
  .route("/resend-verification-email")
  .post(
    emailRequestLimiter,
    validate(resendVerificationEmailSchema),
    resendVerificationEmail,
  );

router
  .route("/register")
  .post(apiLimiter, validate(registerUserSchema), registerUser);

router.route("/login").post(apiLimiter, validate(loginUserSchema), loginUser);

router
  .route("/verify-email")
  .post(apiLimiter, validate(verifyEmailSchema), verifyEmail);

router
  .route("/reset-password")
  .post(apiLimiter, validate(resetPasswordSchema), resetPassword);

router.route("/logout").delete(authenticateUser, logoutUser);

export default router;
