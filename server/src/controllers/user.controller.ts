import { Request, Response } from "express";
import * as userService from "../services/user/user.service";
import { UpdateUserType } from "../types/user.types";

export const getCurrentUser = async (req: Request, res: Response) => {
  const result = await userService.getCurrentUserService(req.user!.id);

  if (!result.data) {
    return res.status(result.status).json({ msg: result.message });
  }

  res.status(result.status).json(result.data);
};

export const getAllUsers = async (req: Request, res: Response) => {
  const result = await userService.getAllUsersService();
  res.status(result.status).json(result.data);
};

export const updateUser = async (
  req: Request<{ id: string }, {}, UpdateUserType>,
  res: Response,
) => {
  const result = await userService.updateUserService(
    Number(req.params.id),
    req.user!.id,
    req.body,
  );

  res.status(result.status).json({ msg: result.message });
};

export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = await userService.deleteUserService(
    Number(req.params.id),
    req.user!.id,
  );

  res.status(result.status).json({ msg: result.message });
};
