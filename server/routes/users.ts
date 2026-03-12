import { RequestHandler } from "express";
import { type ApiResponse, type User, type UserUpsertInput } from "@shared/api";
import {
  deleteUserRecord,
  getUserById,
  saveUser,
  listUsers,
} from "../lib/database";

function buildUserPayload(body: Partial<UserUpsertInput>, current?: User | null) {
  const now = new Date().toISOString();

  return {
    user: {
      id: current?.id ?? `user-${Date.now()}`,
      username: String(body.username ?? current?.username ?? "").trim(),
      email: String(body.email ?? current?.email ?? "").trim(),
      name: String(body.name ?? current?.name ?? "").trim(),
      role: String(body.role ?? current?.role ?? "operator").trim() || "operator",
      roleName: current?.roleName ?? "",
      roleColor: current?.roleColor,
      permissions: current?.permissions ?? [],
      status: body.status ?? current?.status ?? "Pending",
      phone: String(body.phone ?? current?.phone ?? "").trim() || undefined,
      title: String(body.title ?? current?.title ?? "").trim() || undefined,
      department: String(body.department ?? current?.department ?? "").trim() || undefined,
      notes: String(body.notes ?? current?.notes ?? "").trim() || undefined,
      avatar: String(body.avatar ?? current?.avatar ?? "").trim() || undefined,
      lastLoginAt: current?.lastLoginAt,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    },
    password: typeof body.password === "string" && body.password.trim() ? body.password : undefined,
  };
}

export const getUsers: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: await listUsers(),
  } satisfies ApiResponse<User[]>);
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    } satisfies ApiResponse<never>);
  }

  res.status(200).json({
    success: true,
    data: user,
  } satisfies ApiResponse<User>);
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    const { user, password } = buildUserPayload(req.body);

    if (!user.username || !user.email || !user.name) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and name are required.",
      } satisfies ApiResponse<never>);
    }

    const created = await saveUser(user, password);

    res.status(201).json({
      success: true,
      data: created,
    } satisfies ApiResponse<User>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    } satisfies ApiResponse<never>);
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  const current = await getUserById(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    } satisfies ApiResponse<never>);
  }

  try {
    const { user, password } = buildUserPayload(req.body, current);
    const updated = await saveUser(user, password);

    res.status(200).json({
      success: true,
      data: updated,
    } satisfies ApiResponse<User>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    } satisfies ApiResponse<never>);
  }
};

export const deleteUser: RequestHandler = async (req, res) => {
  const deleted = await deleteUserRecord(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    } satisfies ApiResponse<never>);
  }

  res.status(200).json({
    success: true,
    data: deleted,
  } satisfies ApiResponse<User>);
};
