import { prisma } from "../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";
import {
  PublicUser,
  ServiceResponse,
  UpdateUserType,
  UsersListData,
} from "../../types/user.types";

const userPublicSelect = {
  id: true,
  fullName: true,
  username: true,
  email: true,
  role: true,
  emailVerified: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const getCurrentUserService = async (
  userId: number,
): Promise<ServiceResponse<{ user: PublicUser }>> => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
    select: userPublicSelect,
  });

  if (!user) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "User not found",
    };
  }

  return {
    status: StatusCodes.OK,
    data: { user },
  };
};

export const getAllUsersService = async (): Promise<
  ServiceResponse<UsersListData>
> => {
  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: { isDeleted: false },
      select: userPublicSelect,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({
      where: { isDeleted: false },
    }),
  ]);

  return {
    status: StatusCodes.OK,
    data: {
      totalUsers,
      users,
    },
  };
};

export const updateUserService = async (
  id: number,
  currentUserId: number,
  payload: UpdateUserType,
): Promise<ServiceResponse> => {
  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Invalid user id",
    };
  }

  const user = await prisma.user.findFirst({
    where: { id, isDeleted: false },
  });

  if (!user) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "User not found",
    };
  }

  const { fullName, username, role } = payload;

  if (currentUserId === user.id && role) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "You cannot change your own role",
    };
  }

  if (username && username !== user.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message: "Username already exists",
      };
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      fullName,
      username,
      role,
    },
  });

  return {
    status: StatusCodes.OK,
    message: "User updated successfully",
  };
};

export const deleteUserService = async (
  id: number,
  currentUserId: number,
): Promise<ServiceResponse> => {
  if (!Number.isInteger(id) || id <= 0) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Invalid user id",
    };
  }

  const user = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    include: {
      _count: {
        select: { sales: true },
      },
    },
  });

  if (!user) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "User not found",
    };
  }

  if (currentUserId === user.id) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "You cannot delete your own account",
    };
  }

  if (user._count.sales === 0) {
    await prisma.user.delete({ where: { id } });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.token.deleteMany({ where: { userId: id } });
      await tx.user.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false,
        },
      });
    });
  }

  return {
    status: StatusCodes.OK,
    message: "User deleted successfully",
  };
};
