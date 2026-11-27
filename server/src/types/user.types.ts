export type UserRole = "ADMIN" | "CASHIER";

export type TokenUser = {
  id: number;
  fullName: string | null;
  role: UserRole;
  username: string;
};

export type PublicUser = {
  id: number;
  fullName: string | null;
  username: string;
  email: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateUserType = {
  fullName?: string;
  username?: string;
  role?: UserRole;
};

export type UsersListData = {
  totalUsers: number;
  users: PublicUser[];
};

export type ServiceResponse<T = any> = {
  status: number;
  message?: string;
  data?: T;
};
