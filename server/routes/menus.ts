import { RequestHandler } from "express";
import { type ApiResponse, type Menu, type MenuUpsertInput } from "@shared/api";
import {
  deleteMenuRecord,
  getMenu,
  listMenus,
  saveMenu,
} from "../lib/database";

export const getMenus: RequestHandler = async (_req, res) => {
  const response: ApiResponse<Menu[]> = {
    success: true,
    data: await listMenus(),
  };

  res.status(200).json(response);
};

export const getMenuById: RequestHandler = async (req, res) => {
  const menu = await getMenu(req.params.id);

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

export const createMenu: RequestHandler = async (req, res) => {
  const body = req.body as Partial<MenuUpsertInput>;
  const newMenu: Menu = {
    id: `menu-${Date.now()}`,
    name: String(body?.name ?? "").trim(),
    location: String(body?.location ?? "").trim(),
    items: Array.isArray(body?.items) ? body.items : [],
    specials: Array.isArray(body?.specials) ? body.specials : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveMenu(newMenu);
  res.status(201).json({
    success: true,
    data: newMenu,
  } satisfies ApiResponse<Menu>);
};

export const updateMenu: RequestHandler = async (req, res) => {
  const current = await getMenu(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  const body = req.body as Partial<MenuUpsertInput>;
  const nextMenu: Menu = {
    ...current,
    ...body,
    id: current.id,
    items: Array.isArray(body?.items) ? body.items : current.items,
    specials: Array.isArray(body?.specials) ? body.specials : current.specials,
    updatedAt: new Date().toISOString(),
  };

  await saveMenu(nextMenu);
  res.status(200).json({
    success: true,
    data: nextMenu,
  } satisfies ApiResponse<Menu>);
};

export const deleteMenu: RequestHandler = async (req, res) => {
  const deleted = await deleteMenuRecord(req.params.id);

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
