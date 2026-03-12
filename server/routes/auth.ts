import { RequestHandler } from "express";
import { type ApiResponse, type AuthToken, type User } from "@shared/api";
import {
  authenticateUser,
  createAuthSession,
  deleteAuthSession,
  saveUser,
} from "../lib/database";
import { SESSION_COOKIE_NAME } from "../middleware/rbac";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function setSessionCookie(res: Parameters<RequestHandler>[1], token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

function clearSessionCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function getCookieValue(cookieHeader: string | undefined, cookieName: string) {
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

export const login: RequestHandler = async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");
  const user = await authenticateUser(username, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    } satisfies ApiResponse<AuthToken>);
  }

  const session = await createAuthSession(user.id);
  setSessionCookie(res, session.token);

  res.status(200).json({
    success: true,
    data: {
      token: session.token,
      user,
    },
  } satisfies ApiResponse<AuthToken>);
};

export const register: RequestHandler = async (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const email = String(req.body?.email ?? "").trim();
  const name = String(req.body?.name ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!username || !email || !name || !password) {
    return res.status(400).json({
      success: false,
      error: "Name, username, email, and password are required.",
    } satisfies ApiResponse<never>);
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 8 characters.",
    } satisfies ApiResponse<never>);
  }

  try {
    const now = new Date().toISOString();
    const created = await saveUser(
      {
        id: `user-${Date.now()}`,
        username,
        email,
        name,
        role: "operator",
        roleName: "",
        permissions: [],
        status: "Pending",
        createdAt: now,
        updatedAt: now,
      },
      password,
    );

    res.status(201).json({
      success: true,
      data: created,
    } satisfies ApiResponse<User>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Unable to register account",
    } satisfies ApiResponse<never>);
  }
};

export const getSessionUser: RequestHandler = (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user ?? null,
  } satisfies ApiResponse<User | null>);
};

export const logout: RequestHandler = async (req, res) => {
  const cookieToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7).trim()
    : "";
  const token = cookieToken || headerToken;

  if (token) {
    await deleteAuthSession(token);
  }

  clearSessionCookie(res);
  res.status(200).json({
    success: true,
    data: null,
  } satisfies ApiResponse<null>);
};
