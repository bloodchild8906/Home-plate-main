import { RequestHandler } from "express";
import { type ApiResponse, type BrandingConfig } from "@shared/api";
import {
  deleteBrandingConfigRecord,
  getBrandingConfig,
  listBrandingConfigs,
  saveBrandingConfig,
} from "../lib/database";

export const getBrandingConfigs: RequestHandler = (_req, res) => {
  const response: ApiResponse<BrandingConfig[]> = {
    success: true,
    data: listBrandingConfigs(),
  };

  res.status(200).json(response);
};

export const getBrandingConfigById: RequestHandler = (req, res) => {
  const config = getBrandingConfig(req.params.id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  res.status(200).json({
    success: true,
    data: config,
  } satisfies ApiResponse<BrandingConfig>);
};

export const createBrandingConfig: RequestHandler = (req, res) => {
  const newConfig: BrandingConfig = {
    id: `brand-${Date.now()}`,
    brandName: String(req.body?.brandName ?? "").trim(),
    primaryColor: String(req.body?.primaryColor ?? "").trim(),
    secondaryColor: String(req.body?.secondaryColor ?? "").trim(),
    accentColor: String(req.body?.accentColor ?? "").trim(),
    logo: String(req.body?.logo ?? "").trim() || undefined,
    favicon: String(req.body?.favicon ?? "").trim() || undefined,
    customDomain: String(req.body?.customDomain ?? "").trim() || undefined,
    fontFamily:
      req.body?.fontFamily === "poppins" || req.body?.fontFamily === "playfair"
        ? req.body.fontFamily
        : "inter",
  };

  saveBrandingConfig(newConfig);
  res.status(201).json({
    success: true,
    data: newConfig,
  } satisfies ApiResponse<BrandingConfig>);
};

export const updateBrandingConfig: RequestHandler = (req, res) => {
  const current = getBrandingConfig(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  const nextConfig: BrandingConfig = {
    ...current,
    ...req.body,
    id: current.id,
    fontFamily:
      req.body?.fontFamily === "poppins" || req.body?.fontFamily === "playfair"
        ? req.body.fontFamily
        : current.fontFamily,
  };

  saveBrandingConfig(nextConfig);
  res.status(200).json({
    success: true,
    data: nextConfig,
  } satisfies ApiResponse<BrandingConfig>);
};

export const deleteBrandingConfig: RequestHandler = (req, res) => {
  const deleted = deleteBrandingConfigRecord(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  res.status(200).json({
    success: true,
    data: deleted,
  } satisfies ApiResponse<BrandingConfig>);
};

export const deployBrandingConfig: RequestHandler = (req, res) => {
  const config = getBrandingConfig(req.params.id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      message: "Brand configuration deployed successfully",
      config,
      deployed: new Date().toISOString(),
      platforms: ["web-app", "ios-app", "android-app", "restaurant-dashboard"],
    },
  });
};

export const getThemeVariables: RequestHandler = (req, res) => {
  const config = getBrandingConfig(req.params.id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      "--primary": hexToHsl(config.primaryColor),
      "--secondary": hexToHsl(config.secondaryColor),
      "--accent": hexToHsl(config.accentColor),
      "--sidebar-background": hexToHsl(config.secondaryColor),
      "--sidebar-primary": hexToHsl(config.primaryColor),
      "--sidebar-accent": hexToHsl(config.accentColor),
      "--font-family": config.fontFamily,
      "--custom-domain": config.customDomain || "homeplate.app",
    },
  });
};

function hexToHsl(hex: string): string {
  let r = 0;
  let g = 0;
  let b = 0;

  if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16) / 255;
    g = parseInt(hex.substring(3, 5), 16) / 255;
    b = parseInt(hex.substring(5, 7), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
