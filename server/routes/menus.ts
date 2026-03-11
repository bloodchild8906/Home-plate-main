import { RequestHandler } from "express";
import { type ApiResponse, type Menu } from "@shared/api";
import {
  deleteMenuRecord,
  getMenu,
  listMenus,
  saveMenu,
} from "../lib/database";

export const getMenus: RequestHandler = (_req, res) => {
  const response: ApiResponse<Menu[]> = {
    success: true,
    data: listMenus(),
  };

  res.status(200).json(response);
};

export const getMenuById: RequestHandler = (req, res) => {
  const menu = getMenu(req.params.id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  res.status(200).json({
    success: true,
    data: menu,
  } satisfies ApiResponse<Menu>);
};

export const createMenu: RequestHandler = (req, res) => {
  const newMenu: Menu = {
    id: `menu-${Date.now()}`,
    name: String(req.body?.name ?? "").trim(),
    location: String(req.body?.location ?? "").trim(),
    items: Array.isArray(req.body?.items) ? req.body.items : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveMenu(newMenu);
  res.status(201).json({
    success: true,
    data: newMenu,
  } satisfies ApiResponse<Menu>);
};

export const updateMenu: RequestHandler = (req, res) => {
  const current = getMenu(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  const nextMenu: Menu = {
    ...current,
    ...req.body,
    id: current.id,
    items: Array.isArray(req.body?.items) ? req.body.items : current.items,
    updatedAt: new Date().toISOString(),
  };

  saveMenu(nextMenu);
  res.status(200).json({
    success: true,
    data: nextMenu,
  } satisfies ApiResponse<Menu>);
};

export const deleteMenu: RequestHandler = (req, res) => {
  const deleted = deleteMenuRecord(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  res.status(200).json({
    success: true,
    data: deleted,
  } satisfies ApiResponse<Menu>);
};
