import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type SiteBrand = {
  name: string;
  tagline: string;
  logo: string;
  primary: string;
  secondary: string;
  accent: string;
  domain: string;
};

const STORAGE_KEY = "homeplate_site_brand";

const DEFAULT_BRAND: SiteBrand = {
  name: "HomePlate",
  tagline: "Restaurant app platform",
  logo: "HP",
  primary: "#ea580c",
  secondary: "#0f172a",
  accent: "#f59e0b",
  domain: "homeplate.app",
};

type BrandingContextValue = {
  brand: SiteBrand;
  updateBrand: (updates: Partial<SiteBrand>) => void;
  resetBrand: () => void;
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

function hexToHsl(value: string) {
  const normalized = value.replace("#", "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const safeHex = /^[0-9a-fA-F]{6}$/.test(hex) ? hex : "ea580c";
  const r = parseInt(safeHex.slice(0, 2), 16) / 255;
  const g = parseInt(safeHex.slice(2, 4), 16) / 255;
  const b = parseInt(safeHex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  hue /= 6;

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function BrandingProvider({ children }: PropsWithChildren) {
  const [brand, setBrand] = useState<SiteBrand>(DEFAULT_BRAND);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setBrand(JSON.parse(raw) as SiteBrand);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
    const root = document.documentElement;
    const primary = hexToHsl(brand.primary);
    const secondary = hexToHsl(brand.secondary);
    const accent = hexToHsl(brand.accent);
    root.style.setProperty("--brand-primary", brand.primary);
    root.style.setProperty("--brand-secondary", brand.secondary);
    root.style.setProperty("--brand-accent", brand.accent);
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--secondary", secondary);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-background", secondary);
    root.style.setProperty("--sidebar-accent", accent);
    document.title = `${brand.name} Control`;
  }, [brand]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      brand,
      updateBrand: (updates) => setBrand((current) => ({ ...current, ...updates })),
      resetBrand: () => setBrand(DEFAULT_BRAND),
    }),
    [brand],
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
