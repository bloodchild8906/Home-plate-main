import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiResponse, AuthToken, PermissionId, Role, User } from "@shared/api";
import { DEFAULT_ACCESS_ROLES } from "@shared/access-control";

export type UserRole = Role;
export type AuthUser = User;

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  hasAccess: (required?: Array<UserRole | PermissionId>) => boolean;
}

const DEMO_USERS: Array<{
  username: string;
  password: string;
  user: AuthUser;
}> = [
  {
    username: "admin",
    password: "admin123!",
    user: {
      id: "user-admin",
      username: "admin",
      name: "Michael Brown",
      email: "michael@homeplate.app",
      role: "admin",
      roleName: "Administrator",
      roleColor: "#f97316",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "admin")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-03T09:00:00.000Z",
    },
  },
  {
    username: "designer",
    password: "design123!",
    user: {
      id: "user-designer",
      username: "designer",
      name: "Ava Patel",
      email: "ava@homeplate.app",
      role: "designer",
      roleName: "App Designer",
      roleColor: "#0f766e",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "designer")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-04T09:00:00.000Z",
    },
  },
  {
    username: "operator",
    password: "store123!",
    user: {
      id: "user-operator",
      username: "operator",
      name: "Jordan Kim",
      email: "jordan@homeplate.app",
      role: "operator",
      roleName: "Store Operator",
      roleColor: "#2563eb",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "operator")?.permissions ?? [],
      status: "Pending",
      createdAt: "2025-01-05T09:00:00.000Z",
    },
  },
  {
    username: "analyst",
    password: "insight123!",
    user: {
      id: "user-analyst",
      username: "analyst",
      name: "Nina Cole",
      email: "nina@homeplate.app",
      role: "analyst",
      roleName: "Analyst",
      roleColor: "#7c3aed",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "analyst")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-06T09:00:00.000Z",
    },
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          throw new Error("Failed to load auth session");
        }

        const payload = (await response.json()) as ApiResponse<AuthUser | null>;
        if (!cancelled) {
          setUser(payload.success ? payload.data ?? null : null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const payload = (await response.json()) as ApiResponse<AuthToken>;
    if (!response.ok || !payload.success || !payload.data?.user) {
      throw new Error(payload.error || "Invalid credentials");
    }

    setUser(payload.data.user);
    return payload.data.user;
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
    }
  };

  const hasAccess = (required?: Array<UserRole | PermissionId>) => {
    if (!required || required.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    const expectsPermissions = required.some((value) => String(value).includes("."));
    return expectsPermissions
      ? required.every((permission) => user.permissions.includes(permission as PermissionId))
      : required.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        isReady,
        isAuthenticated: !!user,
        user,
        signIn,
        signOut,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export const demoCredentials = DEMO_USERS;
