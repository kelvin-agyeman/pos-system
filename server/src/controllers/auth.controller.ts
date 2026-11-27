import { Request, Response } from "express";
import { attachCookiesToResponse } from "../utils/tokenUtils";
import * as authService from "../services/auth/auth.service";
import { StatusCodes } from "http-status-codes";
import { ResetPasswordType } from "../types/auth.types";

export const registerUser = async (req: Request, res: Response) => {
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : "http://localhost:5173";

  if (!origin) {
    throw new Error("CLIENT_URL is not configured");
  }

  const result = await authService.registerUserService(req.body, origin);
  res.status(result.status).json({ message: result.message });
};

export const loginUser = async (req: Request, res: Response) => {
  const result = await authService.loginUserService(
    req.body,
    req.ip || "",
    req.headers["user-agent"],
  );

  if (result.cookieData) {
    attachCookiesToResponse({
      res,
      user: result.cookieData.user,
      refreshToken: result.cookieData.refreshToken,
    });
    return res.status(result.status).json({ user: result.cookieData.user });
  }

  res.status(result.status).json({ message: result.message });
};

export const logoutUser = async (req: Request, res: Response) => {
  // Assuming req.user is populated by your authenticateUser middleware
  await authService.logoutUserService(req.user!.id);

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(Date.now()),
  });
  res
    .status(StatusCodes.OK)
    .json({ success: true, message: "User logged out" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { verificationToken, email } = req.body;
  const result = await authService.verifyEmailService(email, verificationToken);
  res.status(result.status).json({ message: result.message });
};

export const resendVerificationEmail = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
) => {
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : "http://localhost:5173";

  if (!origin) {
    throw new Error("CLIENT_URL is not configured");
  }

  const result = await authService.resendVerificationEmailService(
    req.body.email,
    origin,
  );
  res.status(result.status).json({ message: result.message });
};

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
) => {
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : "http://localhost:5173";

  if (!origin) {
    throw new Error("CLIENT_URL is not configured");
  }

  const result = await authService.forgotPasswordService(
    req.body.email,
    origin,
  );
  res.status(result.status).json({ message: result.message });
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordType>,
  res: Response,
) => {
  const result = await authService.resetPasswordService(req.body);
  res.status(result.status).json({ message: result.message });
};
