import { RequestHandler } from "express";
import { Menu, ApiResponse } from "@shared/api";

// Mock data
const mockMenus: Menu[] = [
  {
    id: "menu-1",
    name: "Main Restaurant",
    location: "Downtown",
    items: [
      {
        id: "item-1",
        name: "Signature Burger",
        description: "Premium beef burger with special sauce",
        price: 14.99,
        category: "Burgers",
      },
      {
        id: "item-2",
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with house-made dressing",
        price: 9.99,
        category: "Salads",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const getMenus: RequestHandler = (req, res) => {
  const response: ApiResponse<Menu[]> = {
    success: true,
    data: mockMenus,
  };
  res.status(200).json(response);
};

export const getMenuById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const menu = mockMenus.find((m) => m.id === id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  res.status(200).json({
    success: true,
    data: menu,
  });
};

export const createMenu: RequestHandler = (req, res) => {
  const { name, location } = req.body;

  const newMenu: Menu = {
    id: `menu-${Date.now()}`,
    name,
    location,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockMenus.push(newMenu);

  res.status(201).json({
    success: true,
    data: newMenu,
  });
};

export const updateMenu: RequestHandler = (req, res) => {
  const { id } = req.params;
  const menu = mockMenus.find((m) => m.id === id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  Object.assign(menu, req.body, {
    updatedAt: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    data: menu,
  });
};

export const deleteMenu: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = mockMenus.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Menu not found",
    });
  }

  const deletedMenu = mockMenus.splice(index, 1);

  res.status(200).json({
    success: true,
    data: deletedMenu[0],
  });
};
