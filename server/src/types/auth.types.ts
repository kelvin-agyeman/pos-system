import { TokenUser } from "./user.types";

export type RegisterUserType = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role?: "ADMIN" | "CASHIER";
};

export type LoginUserType = { 
  username: string; 
  password: string; 
};

export type ResetPasswordType = {
  resetPasswordToken: string;
  email: string;
  password: string;
};

export type ServiceResponse = {
  status: number;
  message?: string;
  data?: any;
  cookieData?: {
    user: TokenUser;
    refreshToken: string;
  };
};