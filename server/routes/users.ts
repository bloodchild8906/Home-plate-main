import { RequestHandler } from "express";
import { type ApiResponse, type User } from "@shared/api";
import { listUsers } from "../lib/database";

export const getUsers: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    data: listUsers(),
  } satisfies ApiResponse<User[]>);
};
