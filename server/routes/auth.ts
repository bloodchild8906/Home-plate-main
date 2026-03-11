import { RequestHandler } from "express";
import { type ApiResponse, type AuthToken, type User } from "@shared/api";
import {
  authenticateUser,
  createAuthSession,
  deleteAuthSession,
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

export const login: RequestHandler = (req, res) => {
  const username = String(req.body?.username ?? "").trim();
  const password = String(req.body?.password ?? "");
  const user = authenticateUser(username, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    } satisfies ApiResponse<AuthToken>);
  }

  const session = createAuthSession(user.id);
  setSessionCookie(res, session.token);

  res.status(200).json({
    success: true,
    data: {
      token: session.token,
      user,
    },
  } satisfies ApiResponse<AuthToken>);
};

export const getSessionUser: RequestHandler = (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user ?? null,
  } satisfies ApiResponse<User | null>);
};

export const logout: RequestHandler = (req, res) => {
  const cookieToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7).trim()
    : "";
  const token = cookieToken || headerToken;

  if (token) {
    deleteAuthSession(token);
  }

  clearSessionCookie(res);
  res.status(200).json({
    success: true,
    data: null,
  } satisfies ApiResponse<null>);
};
