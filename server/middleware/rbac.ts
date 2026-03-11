import { Request, Response, NextFunction } from "express";
import { type Role, type User } from "@shared/api";
import { getUserBySessionToken } from "../lib/database";

export const SESSION_COOKIE_NAME = "homeplate_session";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

function getCookieValue(req: Request, cookieName: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return "";
  }

  for (const segment of cookieHeader.split(";")) {
    const [name, ...value] = segment.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(value.join("="));
    }
  }

  return "";
}

function getSessionToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return getCookieValue(req, SESSION_COOKIE_NAME);
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = getSessionToken(req);

  if (!token) {
    req.user = undefined;
    return next();
  }

  req.user = getUserBySessionToken(token) ?? undefined;
  next();
};

export const requireAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  next();
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Insufficient permissions",
      });
    }

    next();
  };
};

export const rolePermissions: Record<Role, string[]> = {
  admin: [
    "manage_menus",
    "manage_rewards",
    "manage_members",
    "manage_branding",
    "manage_users",
    "view_analytics",
    "manage_builder",
  ],
  designer: ["manage_branding", "manage_builder"],
  operator: ["manage_menus", "manage_rewards", "manage_members"],
  analyst: ["view_analytics"],
};

export const hasPermission = (role: Role, permission: string): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
