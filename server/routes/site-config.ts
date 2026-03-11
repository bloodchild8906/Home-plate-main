import { RequestHandler } from "express";
import { z } from "zod";
import {
  type ApiResponse,
  type DashboardPreferencesConfig,
  type SiteBrandConfig,
} from "@shared/api";
import {
  getDashboardPreferences,
  getSiteBrandConfig,
  setDashboardPreferences,
  setSiteBrandConfig,
} from "../lib/database";

function resolveDashboardConfigKey(req: Parameters<RequestHandler>[0]) {
  return `homeplate_dashboard_preferences:${req.user?.email ?? req.user?.role ?? "guest"}`;
}

const siteBrandSchema = z.object({
  name: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  logo: z.string().trim().min(1).max(3),
  logoImage: z.string().optional().default(""),
  faviconImage: z.string().optional().default(""),
  primary: z.string().trim().min(4),
  secondary: z.string().trim().min(4),
  accent: z.string().trim().min(4),
  themePresetId: z.string().trim().min(1),
  fontPresetId: z.string().trim().min(1),
  fontFamily: z.string().trim().min(1),
  customFontName: z.string().optional().default(""),
  customFontSource: z.string().optional().default(""),
  customFontFormat: z.string().optional().default(""),
  domain: z.string().trim().min(1),
});

const dashboardPreferencesSchema = z.object({
  density: z.enum(["comfortable", "compact"]),
  focusModulePath: z.string().trim().min(1),
  showLockedModules: z.boolean(),
  moduleColumns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  widgetOrder: z.array(
    z.enum([
      "focus",
      "overview",
      "quickActions",
      "categoryBreakdown",
      "accessRadar",
      "activity",
      "notes",
      "moduleBoard",
    ]),
  ),
  hiddenWidgets: z.array(
    z.enum([
      "focus",
      "overview",
      "quickActions",
      "categoryBreakdown",
      "accessRadar",
      "activity",
      "notes",
      "moduleBoard",
    ]),
  ),
});

export const getSiteBrand: RequestHandler = (_req, res) => {
  const response: ApiResponse<SiteBrandConfig> = {
    success: true,
    data: getSiteBrandConfig(),
  };

  res.status(200).json(response);
};

export const updateSiteBrand: RequestHandler = (req, res) => {
  const parsed = siteBrandSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid site brand payload",
    });
  }

  const nextBrand = setSiteBrandConfig(parsed.data as SiteBrandConfig);
  res.status(200).json({
    success: true,
    data: nextBrand,
  } satisfies ApiResponse<SiteBrandConfig>);
};

export const getDashboardConfig: RequestHandler = (req, res) => {
  const userKey = req.params.userKey?.trim();

  if (!userKey || !req.user) {
    return res.status(400).json({
      success: false,
      error: "Dashboard config key is required",
    });
  }

  if (userKey !== resolveDashboardConfigKey(req)) {
    return res.status(403).json({
      success: false,
      error: "Dashboard config key does not match the active user",
    });
  }

  res.status(200).json({
    success: true,
    data: getDashboardPreferences(userKey),
  } satisfies ApiResponse<DashboardPreferencesConfig | null>);
};

export const updateDashboardConfig: RequestHandler = (req, res) => {
  const userKey = req.params.userKey?.trim();

  if (!userKey || !req.user) {
    return res.status(400).json({
      success: false,
      error: "Dashboard config key is required",
    });
  }

  if (userKey !== resolveDashboardConfigKey(req)) {
    return res.status(403).json({
      success: false,
      error: "Dashboard config key does not match the active user",
    });
  }

  const parsed = dashboardPreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid dashboard configuration payload",
    });
  }

  const nextConfig = setDashboardPreferences(
    userKey,
    parsed.data as DashboardPreferencesConfig,
  );
  res.status(200).json({
    success: true,
    data: nextConfig,
  } satisfies ApiResponse<DashboardPreferencesConfig>);
};
