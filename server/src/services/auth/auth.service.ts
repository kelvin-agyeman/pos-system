import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import {
  comparePassword,
  hashPassword,
  hashPasswordToken,
} from "../../utils/passwordUtils";
import * as emailService from "../email/email.service";
import { StatusCodes } from "http-status-codes";
import {
  RegisterUserType,
  LoginUserType,
  ResetPasswordType,
  ServiceResponse,
} from "../../types/auth.types";
import { TokenUser } from "../../types/user.types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

export const registerUserService = async (
  payload: RegisterUserType,
  origin: string,
): Promise<ServiceResponse> => {
  const { fullName, email, username, password, role } = payload;

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Email already exists",
      };
    }
    if (existingUser.username === username) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Username already exists",
      };
    }
  }

  const verificationToken = crypto.randomBytes(40).toString("hex");
  console.log("Email Verification Token:",verificationToken)
  const oneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      username,
      password: hashedPassword,
      role: role || "CASHIER",
      verificationToken: hashPasswordToken(verificationToken),
      verificationTokenExpirationDate: oneDay,
    },
  });

  try {
    await emailService.sendVerificationEmail({
      name: user.fullName || "User",
      email: user.email as string,
      verificationToken,
      origin,
      purpose: "User Registration",
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExpirationDate: null,
      },
    });
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to send verification email.",
    };
  }

  return { status: StatusCodes.CREATED, message: "Verification email sent" };
};

export const loginUserService = async (
  payload: LoginUserType,
  ip: string,
  userAgent: string = "",
): Promise<ServiceResponse> => {
  const { username, password } = payload;

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }
  if (user.isDeleted) {
    return {
      status: StatusCodes.UNAUTHORIZED,
      message: "Account does not exist",
    };
  }
  if (!user.isActive) {
    return { status: StatusCodes.FORBIDDEN, message: "Account deactivated" };
  }

  // Handle Account Lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    return {
      status: StatusCodes.LOCKED,
      message: `Account locked. Try again in ${minutes} minutes.`,
    };
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    const attempts = user.failedLoginAttempts + 1;
    const lockUntil =
      attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCK_TIME) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts, lockUntil },
    });
    return { status: StatusCodes.UNAUTHORIZED, message: "Invalid credentials" };
  }

  if (!user.emailVerified) {
    return {
      status: StatusCodes.UNAUTHORIZED,
      message: "Please verify your email",
    };
  }

  // Reset lockouts and update login time
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() },
  });

  const tokenUser: TokenUser = {
    id: user.id,
    fullName: user.fullName,
    role: user.role,
    username: user.username,
  };

  let refreshToken = crypto.randomBytes(40).toString("hex");

  await prisma.token.create({
    data: {
      refreshToken,
      ip,
      userAgent,
      userId: user.id,
    },
  });

  return {
    status: StatusCodes.OK,
    cookieData: { user: tokenUser, refreshToken },
  };
};

export const logoutUserService = async (userId: number): Promise<void> => {
  await prisma.token.deleteMany({ where: { userId } });
};

export const verifyEmailService = async (
  email: string,
  verificationToken: string,
): Promise<ServiceResponse> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Invalid verification request",
    };
  }

  if (user.emailVerified) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Account already verified",
    };
  }

  if (
    !user.verificationTokenExpirationDate ||
    user.verificationTokenExpirationDate < new Date()
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: null, verificationTokenExpirationDate: null },
    });
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Verification token has expired",
    };
  }

  if (user.verificationToken !== hashPasswordToken(verificationToken)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Invalid verification request",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpirationDate: null,
    },
  });

  return { status: StatusCodes.OK, message: "Email verified successfully" };
};

export const resendVerificationEmailService = async (
  email: string,
  origin: string,
): Promise<ServiceResponse> => {
  if (!email) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Please provide an email",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      status: StatusCodes.OK,
      message:
        "If this email is registered, a new verification link has been sent.",
    };
  }

  if (user.emailVerified) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Account is already verified",
    };
  }

  if (
    user.lastVerificationEmailSent &&
    Date.now() - user.lastVerificationEmailSent.getTime() < 60 * 1000
  ) {
    return {
      status: StatusCodes.TOO_MANY_REQUESTS,
      message: "Please wait before requesting another verification email.",
    };
  }

  const verificationToken = crypto.randomBytes(40).toString("hex");
  const oneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: hashPasswordToken(verificationToken),
      verificationTokenExpirationDate: oneDay,
      lastVerificationEmailSent: new Date(),
    },
  });

  try {
    await emailService.sendVerificationEmail({
      name: user.fullName || "User",
      email: user.email as string,
      verificationToken,
      origin,
      purpose: "User Registration",
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        verificationTokenExpirationDate: null,
        lastVerificationEmailSent: null,
      },
    });
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to send verification email. Please try again later.",
    };
  }

  return {
    status: StatusCodes.OK,
    message:
      "If this email is registered, a new verification link has been sent.",
  };
};

export const forgotPasswordService = async (
  email: string,
  origin: string,
): Promise<ServiceResponse> => {
  if (!email) {
    return { status: StatusCodes.BAD_REQUEST, message: "Please provide email" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || user.isDeleted) {
    return {
      status: StatusCodes.OK,
      message: "Please check your email for the reset link.",
    };
  }

  if (
    user.lastPasswordResetRequest &&
    Date.now() - user.lastPasswordResetRequest.getTime() < 60 * 1000
  ) {
    return {
      status: StatusCodes.TOO_MANY_REQUESTS,
      message: "Please wait before requesting another reset email.",
    };
  }

  const resetPasswordToken = crypto.randomBytes(70).toString("hex");
  console.log("Reset Password Token:", resetPasswordToken);
  const expirationDate = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashPasswordToken(resetPasswordToken),
      resetPasswordTokenExpirationDate: expirationDate,
      lastPasswordResetRequest: new Date(),
    },
  });

  try {
    await emailService.sendResetPasswordEmail({
      name: user.fullName || "User",
      email: user.email as string,
      resetPasswordToken,
      origin,
    });
  } catch (error) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordTokenExpirationDate: null,
        lastPasswordResetRequest: null,
      },
    });
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to send reset password email. Please try again later.",
    };
  }

  return {
    status: StatusCodes.OK,
    message: "Please check your email for the reset link.",
  };
};

export const resetPasswordService = async (
  payload: ResetPasswordType,
): Promise<ServiceResponse> => {
  const { resetPasswordToken, email, password } = payload;

  if (!resetPasswordToken || !email || !password) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Please provide all required fields",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return { status: StatusCodes.UNAUTHORIZED, message: "User does not exist" };
  }

  if (!user.resetPasswordToken || !user.resetPasswordTokenExpirationDate) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "No password reset request found",
    };
  }

  const currentDate = new Date();

  if (user.resetPasswordTokenExpirationDate < currentDate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: null,
        resetPasswordTokenExpirationDate: null,
      },
    });
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Reset password token has expired",
    };
  }

  if (user.resetPasswordToken !== hashPasswordToken(resetPasswordToken)) {
    return { status: StatusCodes.BAD_REQUEST, message: "Invalid reset token" };
  }

  const newHashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newHashedPassword,
      passwordChangedAt: currentDate,
      resetPasswordToken: null,
      resetPasswordTokenExpirationDate: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  });

  return { status: StatusCodes.OK, message: "Password reset successfully" };
};
