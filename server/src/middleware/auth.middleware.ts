import { Request, Response, NextFunction } from "express";
import { isTokenValid, attachCookiesToResponse } from "../utils/tokenUtils";
import { StatusCodes } from "http-status-codes";
import { TokenUser } from "../types/user.types";
import { prisma } from "../lib/prisma";

type AuthPayload = {
  user: TokenUser;
  refreshToken?: string;
};

// Ensure your global Express Request definition includes `user?: TokenUser`
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken) as AuthPayload;
      req.user = payload.user;
      return next();
    }

    if (!refreshToken) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Invalid" });
      return;
    }

    const payload = isTokenValid(refreshToken) as AuthPayload;

    const existingToken = await prisma.token.findFirst({
      where: {
        userId: payload.user.id,
        refreshToken: payload.refreshToken,
      },
    });

    if (!existingToken || !existingToken.isValid) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Invalid" });
      return;
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });

    req.user = payload.user;
    next();
  } catch (error) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Invalid" });
  }
};

export const authorizePermissions = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(StatusCodes.FORBIDDEN).json({
        message: "Unauthorized to access this route",
      });
      return;
    }
    next();
  };
};
