import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiResponse, AuthToken, Role, User } from "@shared/api";

export type UserRole = Role;
export type AuthUser = User;

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  hasAccess: (allowedRoles?: UserRole[]) => boolean;
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

  const hasAccess = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    return !!user && allowedRoles.includes(user.role);
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
