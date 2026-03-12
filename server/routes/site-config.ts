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

const loginBuilderSchema = z.object({
  layout: z.enum(["split", "stacked"]).optional().default("split"),
  heroWidth: z.coerce.number().int().min(35).max(70).optional().default(58),
  cardRadius: z.coerce.number().int().min(16).max(44).optional().default(32),
  heroPanelOpacity: z.coerce.number().int().min(4).max(24).optional().default(8),
  authPanelOpacity: z.coerce.number().int().min(45).max(90).optional().default(70),
  featureColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(3),
  leftBlocks: z.array(
    z.enum([
      "badge",
      "brand",
      "headline",
      "description",
      "featureTiles",
      "loginTitle",
      "loginHint",
      "loginForm",
      "demoAccounts",
      "footer",
    ]),
  ).optional().default(["badge", "brand", "headline", "description", "featureTiles"]),
  rightBlocks: z.array(
    z.enum([
      "badge",
      "brand",
      "headline",
      "description",
      "featureTiles",
      "loginTitle",
      "loginHint",
      "loginForm",
      "demoAccounts",
      "footer",
    ]),
  ).optional().default(["loginTitle", "loginHint", "loginForm", "demoAccounts", "footer"]),
});

const siteBrandSchema = z.object({
  name: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  logo: z.string().trim().min(1).max(3),
  logoImage: z.string().optional().default(""),
  faviconImage: z.string().optional().default(""),
  primary: z.string().trim().min(4),
  secondary: z.string().trim().min(4),
  accent: z.string().trim().min(4),
  splashTitle: z.string().trim().min(1).optional().default("Loading workspace..."),
  splashSubtitle: z
    .string()
    .trim()
    .min(1)
    .optional()
    .default("Preparing your command center."),
  splashBackgroundColor: z.string().trim().min(4).optional().default("#0f172a"),
  splashSpinnerStyle: z
    .enum(["ring", "dots", "pulse", "bars", "dual-ring", "orbit"])
    .optional()
    .default("ring"),
  splashSpinnerColor: z.string().trim().min(4).optional().default("#ea580c"),
  splashSpinnerAccent: z.string().trim().min(4).optional().default("#f59e0b"),
  loginBuilder: loginBuilderSchema.optional().default({
    layout: "split",
    heroWidth: 58,
    cardRadius: 32,
    heroPanelOpacity: 8,
    authPanelOpacity: 70,
    featureColumns: 3,
    leftBlocks: ["badge", "brand", "headline", "description", "featureTiles"],
    rightBlocks: ["loginTitle", "loginHint", "loginForm", "demoAccounts", "footer"],
  }),
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

export const getSiteBrand: RequestHandler = async (_req, res) => {
  const response: ApiResponse<SiteBrandConfig> = {
    success: true,
    data: await getSiteBrandConfig(),
  };

  res.status(200).json(response);
};

export const updateSiteBrand: RequestHandler = async (req, res) => {
  const parsed = siteBrandSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid site brand payload",
    });
  }

  const nextBrand = await setSiteBrandConfig(parsed.data as SiteBrandConfig);
  res.status(200).json({
    success: true,
    data: nextBrand,
  } satisfies ApiResponse<SiteBrandConfig>);
};

export const getDashboardConfig: RequestHandler = async (req, res) => {
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
    data: await getDashboardPreferences(userKey),
  } satisfies ApiResponse<DashboardPreferencesConfig | null>);
};

export const updateDashboardConfig: RequestHandler = async (req, res) => {
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

  const nextConfig = await setDashboardPreferences(
    userKey,
    parsed.data as DashboardPreferencesConfig,
  );
  res.status(200).json({
    success: true,
    data: nextConfig,
  } satisfies ApiResponse<DashboardPreferencesConfig>);
};
