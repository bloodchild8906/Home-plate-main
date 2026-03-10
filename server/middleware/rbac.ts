import { Request, Response, NextFunction } from "express";
import { Role } from "@shared/api";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
      };
    }
  }
}

/**
 * Mock authentication middleware
 * In production, this would verify JWT tokens
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Mock user for demo purposes
  // In production, extract and verify JWT from Authorization header
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // In production: verify JWT token here
    const token = authHeader.substring(7);
    
    // Mock implementation: parse token or use default user
    req.user = {
      id: "user-123",
      email: "admin@restaurant.com",
      role: "admin",
    };
  } else {
    req.user = {
      id: "user-123",
      email: "admin@restaurant.com",
      role: "admin",
    };
  }

  next();
};

/**
 * RBAC middleware factory
 * Creates a middleware that checks if user has required role
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

/**
 * Permission-based access control
 * Maps roles to specific permissions
 */
export const rolePermissions: Record<Role, string[]> = {
  admin: [
    "manage_menus",
    "manage_rewards",
    "manage_members",
    "manage_branding",
    "manage_users",
    "view_analytics",
  ],
  manager: [
    "manage_menus",
    "manage_rewards",
    "manage_members",
    "view_analytics",
  ],
  staff: ["view_menus", "manage_members", "view_analytics"],
  viewer: ["view_menus", "view_analytics"],
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (role: Role, permission: string): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
