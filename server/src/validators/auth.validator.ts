import { z } from "zod";

export const registerUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(50),
  email: z.email("Please provide a valid email address").trim().toLowerCase(),
  username: z
    .string()
    .trim()
    .min(4, "Username must be at least 4 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
  role: z.enum(["ADMIN", "CASHIER"]).optional(),
});

export const loginUserSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z.email().trim().toLowerCase(),
  verificationToken: z.string().trim().min(1, "Invalid verification token"),
});

export const resendVerificationEmailSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
  resetPasswordToken: z.string().trim().min(1, "Invalid reset password token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Uppercase required")
    .regex(/[0-9]/, "Number required")
    .regex(/[^A-Za-z0-9]/, "Special character required"),
});
