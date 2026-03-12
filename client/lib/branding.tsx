import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiResponse, SiteBrandConfig } from "@shared/api";
import {
  getContrastTextColor,
  hexToHsl,
  mixHex,
  normalizeHex,
} from "@/lib/color-utils";
import { getInitials } from "@/lib/asset-utils";
import { resolveFontFamily, syncFontAssets } from "@/lib/font-utils";
import {
  DEFAULT_FONT_PRESET_ID,
  DEFAULT_PLATFORM_THEME_PRESET_ID,
  UPLOADED_FONT_PRESET_ID,
} from "@/lib/theme-presets";
import {
  createDefaultLoginBuilderConfig,
  createDefaultRegisterBuilderConfig,
  normalizeLoginBuilderConfig,
} from "@/lib/login-builder";

export type SiteBrand = SiteBrandConfig;

const DEFAULT_BRAND: SiteBrand = {
  name: "HomePlate",
  tagline: "Restaurant app platform",
  logo: "HP",
  logoImage: "",
  faviconImage: "",
  primary: "#ea580c",
  secondary: "#0f172a",
  accent: "#f59e0b",
  splashTitle: "Loading workspace...",
  splashSubtitle: "Preparing your command center.",
  splashBackgroundColor: "#0f172a",
  splashSpinnerStyle: "ring",
  splashSpinnerColor: "#ea580c",
  splashSpinnerAccent: "#f59e0b",
  loginBuilder: createDefaultLoginBuilderConfig(),
  registerBuilder: createDefaultRegisterBuilderConfig(),
  themePresetId: DEFAULT_PLATFORM_THEME_PRESET_ID,
  fontPresetId: DEFAULT_FONT_PRESET_ID,
  fontFamily: '"Manrope", "Inter", ui-sans-serif, system-ui, sans-serif',
  customFontName: "",
  customFontSource: "",
  customFontFormat: "",
  domain: "homeplate.app",
};

type BrandingContextValue = {
  brand: SiteBrand;
  updateBrand: (updates: Partial<SiteBrand>) => void;
  resetBrand: () => void;
  saveBrand: () => Promise<void>;
  isSaving: boolean;
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

function normalizeSpinnerStyle(value?: string): SiteBrand["splashSpinnerStyle"] {
  if (
    value === "dots" ||
    value === "pulse" ||
    value === "ring" ||
    value === "bars" ||
    value === "dual-ring" ||
    value === "orbit"
  ) {
    return value;
  }
  return DEFAULT_BRAND.splashSpinnerStyle;
}

function normalizeBrand(value?: Partial<SiteBrand>) {
  const nextName = value?.name?.trim() || DEFAULT_BRAND.name;
  const nextLogo = value?.logo?.trim() || getInitials(nextName);
  const fontPresetId =
    value?.fontPresetId?.trim() ||
    (value?.customFontSource ? UPLOADED_FONT_PRESET_ID : DEFAULT_FONT_PRESET_ID);

  return {
    ...DEFAULT_BRAND,
    ...value,
    name: nextName,
    tagline: value?.tagline?.trim() || DEFAULT_BRAND.tagline,
    logo: nextLogo.toUpperCase().slice(0, 3),
    logoImage: value?.logoImage ?? "",
    faviconImage: value?.faviconImage ?? "",
    primary: normalizeHex(value?.primary ?? DEFAULT_BRAND.primary),
    secondary: normalizeHex(value?.secondary ?? DEFAULT_BRAND.secondary),
    accent: normalizeHex(value?.accent ?? DEFAULT_BRAND.accent),
    splashTitle: value?.splashTitle?.trim() || DEFAULT_BRAND.splashTitle,
    splashSubtitle: value?.splashSubtitle?.trim() || DEFAULT_BRAND.splashSubtitle,
    splashBackgroundColor: normalizeHex(
      value?.splashBackgroundColor ?? DEFAULT_BRAND.splashBackgroundColor,
    ),
    splashSpinnerStyle: normalizeSpinnerStyle(value?.splashSpinnerStyle),
    splashSpinnerColor: normalizeHex(
      value?.splashSpinnerColor ?? DEFAULT_BRAND.splashSpinnerColor,
    ),
    splashSpinnerAccent: normalizeHex(
      value?.splashSpinnerAccent ?? DEFAULT_BRAND.splashSpinnerAccent,
    ),
    loginBuilder: normalizeLoginBuilderConfig(value?.loginBuilder, "login"),
    registerBuilder: normalizeLoginBuilderConfig(value?.registerBuilder, "register"),
    themePresetId: value?.themePresetId?.trim() || DEFAULT_BRAND.themePresetId,
    fontPresetId,
    fontFamily: resolveFontFamily({
      fontPresetId,
      fontFamily: value?.fontFamily,
      customFontName: value?.customFontName,
      customFontSource: value?.customFontSource,
    }),
    customFontName: value?.customFontName?.trim() ?? "",
    customFontSource: value?.customFontSource ?? "",
    customFontFormat: value?.customFontFormat?.trim() ?? "",
    domain: value?.domain?.trim() || DEFAULT_BRAND.domain,
  } satisfies SiteBrand;
}

function ensureFavicon(href: string) {
  const existing =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
    document.createElement("link");
  existing.rel = "icon";
  existing.href = href;

  if (!existing.parentNode) {
    document.head.appendChild(existing);
  }
}

export function BrandingProvider({ children }: PropsWithChildren) {
  const [brand, setBrand] = useState<SiteBrand>(DEFAULT_BRAND);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBrand = async () => {
      try {
        const response = await fetch("/api/site-config/brand");
        if (!response.ok) {
          throw new Error("Failed to load site brand");
        }

        const payload = (await response.json()) as ApiResponse<SiteBrandConfig>;
        if (!cancelled && payload.success && payload.data) {
          setBrand(normalizeBrand(payload.data));
        }
      } catch {
        if (!cancelled) {
          setBrand(DEFAULT_BRAND);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void loadBrand();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const nextBrand = normalizeBrand(brand);
    const root = document.documentElement;
    const backgroundHex = mixHex(nextBrand.primary, "#ffffff", 0.97);
    const cardHex = mixHex(nextBrand.primary, "#ffffff", 0.985);
    const borderHex = mixHex(nextBrand.secondary, "#ffffff", 0.82);
    const mutedHex = mixHex(nextBrand.secondary, "#ffffff", 0.92);
    const foregroundHex =
      getContrastTextColor(nextBrand.secondary) === "#ffffff"
        ? mixHex(nextBrand.secondary, "#0f172a", 0.16)
        : "#0f172a";
    const mutedForegroundHex = mixHex(foregroundHex, "#94a3b8", 0.3);

    root.style.setProperty("--brand-primary", nextBrand.primary);
    root.style.setProperty("--brand-secondary", nextBrand.secondary);
    root.style.setProperty("--brand-accent", nextBrand.accent);
    root.style.setProperty("--brand-panel", nextBrand.secondary);
    root.style.setProperty(
      "--brand-panel-foreground",
      getContrastTextColor(nextBrand.secondary),
    );
    root.style.setProperty(
      "--brand-panel-muted",
      mixHex(getContrastTextColor(nextBrand.secondary), nextBrand.secondary, 0.55),
    );
    root.style.setProperty("--background", hexToHsl(backgroundHex));
    root.style.setProperty("--foreground", hexToHsl(foregroundHex));
    root.style.setProperty("--card", hexToHsl(cardHex));
    root.style.setProperty("--card-foreground", hexToHsl(foregroundHex));
    root.style.setProperty("--popover", hexToHsl(cardHex));
    root.style.setProperty("--popover-foreground", hexToHsl(foregroundHex));
    root.style.setProperty("--primary", hexToHsl(nextBrand.primary));
    root.style.setProperty(
      "--primary-foreground",
      hexToHsl(getContrastTextColor(nextBrand.primary)),
    );
    root.style.setProperty("--secondary", hexToHsl(nextBrand.secondary));
    root.style.setProperty(
      "--secondary-foreground",
      hexToHsl(getContrastTextColor(nextBrand.secondary)),
    );
    root.style.setProperty("--muted", hexToHsl(mutedHex));
    root.style.setProperty("--muted-foreground", hexToHsl(mutedForegroundHex));
    root.style.setProperty("--accent", hexToHsl(nextBrand.accent));
    root.style.setProperty(
      "--accent-foreground",
      hexToHsl(getContrastTextColor(nextBrand.accent)),
    );
    root.style.setProperty("--border", hexToHsl(borderHex));
    root.style.setProperty("--input", hexToHsl(mixHex(nextBrand.secondary, "#ffffff", 0.9)));
    root.style.setProperty("--ring", hexToHsl(nextBrand.primary));
    root.style.setProperty("--sidebar-background", hexToHsl(nextBrand.secondary));
    root.style.setProperty(
      "--sidebar-foreground",
      hexToHsl(getContrastTextColor(nextBrand.secondary)),
    );
    root.style.setProperty("--sidebar-primary", hexToHsl(nextBrand.primary));
    root.style.setProperty(
      "--sidebar-primary-foreground",
      hexToHsl(getContrastTextColor(nextBrand.primary)),
    );
    root.style.setProperty("--sidebar-accent", hexToHsl(nextBrand.accent));
    root.style.setProperty(
      "--sidebar-accent-foreground",
      hexToHsl(getContrastTextColor(nextBrand.accent)),
    );
    root.style.setProperty(
      "--sidebar-border",
      hexToHsl(mixHex(nextBrand.secondary, "#ffffff", 0.8)),
    );
    root.style.setProperty("--sidebar-ring", hexToHsl(nextBrand.primary));
    root.style.setProperty("--site-font-family", nextBrand.fontFamily);
    root.style.setProperty("--site-heading-font-family", nextBrand.fontFamily);
    syncFontAssets("site-brand", nextBrand);

    document.title = `${nextBrand.name} Control`;
    ensureFavicon(nextBrand.faviconImage || nextBrand.logoImage || "/favicon.ico");
  }, [brand]);

  const persistBrand = async (value: SiteBrand) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/site-config/brand", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizeBrand(value)),
      });
      if (!response.ok) {
        throw new Error("Failed to persist site brand");
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistBrand(brand).catch(() => undefined);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [brand, isReady]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      brand,
      updateBrand: (updates) =>
        setBrand((current) => normalizeBrand({ ...current, ...updates })),
      resetBrand: () => setBrand(DEFAULT_BRAND),
      saveBrand: async () => {
        await persistBrand(brand);
      },
      isSaving,
    }),
    [brand, isSaving],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}
