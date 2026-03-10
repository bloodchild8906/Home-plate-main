import { RequestHandler } from "express";
import { ApiResponse } from "@shared/api";

export interface ExtendedBrandingConfig {
  id: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo?: string;
  favicon?: string;
  customDomain?: string;
  fontFamily: "inter" | "poppins" | "playfair";
}

// Mock data
const mockBrandingConfigs: ExtendedBrandingConfig[] = [
  {
    id: "brand-1",
    brandName: "HomePlate Main",
    primaryColor: "#DC2626",
    secondaryColor: "#7C2D12",
    accentColor: "#FF8C00",
    fontFamily: "inter",
    customDomain: "homeplate.app",
    logo: "https://via.placeholder.com/200",
    favicon: "https://via.placeholder.com/32",
  },
  {
    id: "brand-2",
    brandName: "Premium Restaurant",
    primaryColor: "#8B5CF6",
    secondaryColor: "#4C1D95",
    accentColor: "#EC4899",
    fontFamily: "playfair",
    customDomain: "premium.homeplate.app",
  },
];

export const getBrandingConfigs: RequestHandler = (req, res) => {
  const response: ApiResponse<ExtendedBrandingConfig[]> = {
    success: true,
    data: mockBrandingConfigs,
  };
  res.status(200).json(response);
};

export const getBrandingConfigById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const config = mockBrandingConfigs.find((c) => c.id === id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  res.status(200).json({
    success: true,
    data: config,
  });
};

export const createBrandingConfig: RequestHandler = (req, res) => {
  const {
    brandName,
    primaryColor,
    secondaryColor,
    accentColor,
    logo,
    favicon,
    customDomain,
    fontFamily,
  } = req.body;

  const newConfig: ExtendedBrandingConfig = {
    id: `brand-${Date.now()}`,
    brandName,
    primaryColor,
    secondaryColor,
    accentColor,
    logo,
    favicon,
    customDomain,
    fontFamily: fontFamily || "inter",
  };

  mockBrandingConfigs.push(newConfig);

  res.status(201).json({
    success: true,
    data: newConfig,
  });
};

export const updateBrandingConfig: RequestHandler = (req, res) => {
  const { id } = req.params;
  const config = mockBrandingConfigs.find((c) => c.id === id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  Object.assign(config, req.body);

  res.status(200).json({
    success: true,
    data: config,
  });
};

export const deleteBrandingConfig: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = mockBrandingConfigs.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  const deletedConfig = mockBrandingConfigs.splice(index, 1);

  res.status(200).json({
    success: true,
    data: deletedConfig[0],
  });
};

/**
 * Deploy a brand configuration across all platforms
 * This applies the branding to all apps, websites, and interfaces
 */
export const deployBrandingConfig: RequestHandler = (req, res) => {
  const { id } = req.params;
  const config = mockBrandingConfigs.find((c) => c.id === id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  // In production, this would:
  // 1. Update CSS variables across all deployments
  // 2. Deploy to CDN
  // 3. Update all app manifests
  // 4. Trigger cache invalidation
  // 5. Update domain DNS if custom domain

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

/**
 * Get theme CSS variables for a brand
 * This returns CSS variables that can be applied to the application
 */
export const getThemeVariables: RequestHandler = (req, res) => {
  const { id } = req.params;
  const config = mockBrandingConfigs.find((c) => c.id === id);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: "Branding configuration not found",
    });
  }

  // Convert hex colors to HSL for CSS variables
  const cssVariables = {
    "--primary": hexToHsl(config.primaryColor),
    "--secondary": hexToHsl(config.secondaryColor),
    "--accent": hexToHsl(config.accentColor),
    "--sidebar-background": hexToHsl(config.secondaryColor),
    "--sidebar-primary": hexToHsl(config.primaryColor),
    "--sidebar-accent": hexToHsl(config.accentColor),
    "--font-family": config.fontFamily,
    "--custom-domain": config.customDomain || "homplate.app",
  };

  res.status(200).json({
    success: true,
    data: cssVariables,
  });
};

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHsl(hex: string): string {
  // Simple conversion - in production use a proper color library
  let r = 0,
    g = 0,
    b = 0;

  if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16) / 255;
    g = parseInt(hex.substring(3, 5), 16) / 255;
    b = parseInt(hex.substring(5, 7), 16) / 255;
  }

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
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
