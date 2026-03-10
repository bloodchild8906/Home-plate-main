import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

export type UserRole = "admin" | "designer" | "operator" | "analyst";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
  hasAccess: (allowedRoles?: UserRole[]) => boolean;
}

const AUTH_STORAGE_KEY = "homeplate_auth_user";

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  admin: {
    password: "admin123!",
    user: {
      name: "Michael Brown",
      email: "michael@homeplate.app",
      role: "admin",
    },
  },
  designer: {
    password: "design123!",
    user: {
      name: "Ava Patel",
      email: "ava@homeplate.app",
      role: "designer",
    },
  },
  operator: {
    password: "store123!",
    user: {
      name: "Jordan Kim",
      email: "jordan@homeplate.app",
      role: "operator",
    },
  },
  analyst: {
    password: "insight123!",
    user: {
      name: "Nina Cole",
      email: "nina@homeplate.app",
      role: "analyst",
    },
  },
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  const signIn = async (username: string, password: string) => {
    const account = DEMO_USERS[username.trim().toLowerCase()];

    await new Promise((resolve) => window.setTimeout(resolve, 700));

    if (!account || account.password !== password) {
      throw new Error("Invalid credentials");
    }

    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(account.user),
    );
    setUser(account.user);

    return account.user;
  };

  const signOut = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
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

export const demoCredentials = Object.entries(DEMO_USERS).map(
  ([username, value]) => ({
    username,
    password: value.password,
    user: value.user,
  }),
);
