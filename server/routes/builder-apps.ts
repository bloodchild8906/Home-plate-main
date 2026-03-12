import { RequestHandler } from "express";
import { z } from "zod";
import { type ApiResponse, type BuilderPersistedApp } from "@shared/api";
import { getBuilderAppsConfig, setBuilderAppsConfig } from "../lib/database";

const builderAppsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    published: z.boolean(),
    live: z.boolean(),
    updatedAt: z.string().trim().min(1),
    brand: z.object({
      appName: z.string().trim().min(1),
      logo: z.string().trim().min(1),
      logoImage: z.string().optional(),
      primary: z.string().trim().min(4),
      secondary: z.string().trim().min(4),
      accent: z.string().trim().min(4),
      surface: z.string().trim().min(4),
      textColor: z.string().trim().min(4),
      cardBackground: z.string().trim().min(4),
      themePresetId: z.string().trim().min(1),
      fontPresetId: z.string().trim().min(1),
      fontFamily: z.string().trim().min(1),
      customFontName: z.string().optional().default(""),
      customFontSource: z.string().optional().default(""),
      customFontFormat: z.string().optional().default(""),
      backgroundImage: z.string().optional(),
      heroImage: z.string().optional(),
      customCss: z.string(),
      customCssFileName: z.string(),
      domain: z.string().trim().min(1),
    }),
    apiFunctions: z.array(z.unknown()),
    pages: z.array(z.unknown()),
  }).passthrough(),
);

export const getBuilderApps: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: await getBuilderAppsConfig(),
  } satisfies ApiResponse<BuilderPersistedApp[] | null>);
};

export const replaceBuilderApps: RequestHandler = async (req, res) => {
  const parsed = builderAppsSchema.safeParse(req.body?.apps);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid builder app payload",
    });
  }

  const apps = await setBuilderAppsConfig(parsed.data as BuilderPersistedApp[]);
  res.status(200).json({
    success: true,
    data: apps,
  } satisfies ApiResponse<BuilderPersistedApp[]>);
};
