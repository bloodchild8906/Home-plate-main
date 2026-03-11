export const DEFAULT_PLATFORM_THEME_PRESET_ID = "ember-control";
export const DEFAULT_APP_THEME_PRESET_ID = "sunset-mobile";
export const DEFAULT_FONT_PRESET_ID = "manrope";
export const UPLOADED_FONT_PRESET_ID = "uploaded";

export type SiteThemePalette = {
  primary: string;
  secondary: string;
  accent: string;
};

export type AppThemePalette = SiteThemePalette & {
  surface: string;
  textColor: string;
  cardBackground: string;
};

export type ThemePreset<TTheme> = {
  id: string;
  label: string;
  description: string;
  swatches: string[];
  theme: TTheme;
};

export type FontOption = {
  id: string;
  label: string;
  description: string;
  family: string;
  importUrl?: string;
};

function createThemePreset<TTheme extends Record<string, string>>(
  id: string,
  label: string,
  description: string,
  theme: TTheme,
) {
  return {
    id,
    label,
    description,
    swatches: Object.values(theme).slice(0, 4),
    theme,
  } satisfies ThemePreset<TTheme>;
}

export const PLATFORM_THEME_PRESETS: ThemePreset<SiteThemePalette>[] = [
  createThemePreset("ember-control", "Ember Control", "Warm operational orange with a graphite shell.", {
    primary: "#ea580c",
    secondary: "#0f172a",
    accent: "#f59e0b",
  }),
  createThemePreset("ocean-grid", "Ocean Grid", "Clean teal and indigo for analytics-heavy workspaces.", {
    primary: "#0f766e",
    secondary: "#164e63",
    accent: "#38bdf8",
  }),
  createThemePreset("forest-ops", "Forest Ops", "Deep green chrome with bright lime highlights.", {
    primary: "#15803d",
    secondary: "#1c1917",
    accent: "#84cc16",
  }),
  createThemePreset("royal-service", "Royal Service", "High-contrast violet with gold accents.", {
    primary: "#7c3aed",
    secondary: "#1e1b4b",
    accent: "#fbbf24",
  }),
  createThemePreset("rose-ledger", "Rose Ledger", "Soft blush surfaces balanced by strong slate.", {
    primary: "#e11d48",
    secondary: "#334155",
    accent: "#fb7185",
  }),
  createThemePreset("midnight-wave", "Midnight Wave", "Dark navy with electric cyan for bold shells.", {
    primary: "#2563eb",
    secondary: "#020617",
    accent: "#22d3ee",
  }),
];

export const APP_THEME_PRESETS: ThemePreset<AppThemePalette>[] = [
  createThemePreset("sunset-mobile", "Sunset Mobile", "Restaurant-native orange with warm surfaces and bright loyalty accents.", {
    primary: "#ea580c",
    secondary: "#7c2d12",
    accent: "#f59e0b",
    surface: "#fff7ed",
    textColor: "#0f172a",
    cardBackground: "#ffffff",
  }),
  createThemePreset("coastal-pay", "Coastal Pay", "Teal commerce palette with cool cards and strong contrast.", {
    primary: "#0f766e",
    secondary: "#134e4a",
    accent: "#38bdf8",
    surface: "#ecfeff",
    textColor: "#0f172a",
    cardBackground: "#ffffff",
  }),
  createThemePreset("violet-club", "Violet Club", "Premium member styling with rich purple depth.", {
    primary: "#7c3aed",
    secondary: "#2e1065",
    accent: "#f472b6",
    surface: "#f5f3ff",
    textColor: "#1f1147",
    cardBackground: "#ffffff",
  }),
  createThemePreset("citrus-reorder", "Citrus Reorder", "Fast daily-order visual language with coffee and honey tones.", {
    primary: "#b45309",
    secondary: "#422006",
    accent: "#fbbf24",
    surface: "#fefce8",
    textColor: "#1c1917",
    cardBackground: "#fffef7",
  }),
  createThemePreset("midnight-card", "Midnight Card", "Dark checkout-style chrome with cyan glow accents.", {
    primary: "#2563eb",
    secondary: "#0f172a",
    accent: "#22d3ee",
    surface: "#e2e8f0",
    textColor: "#0f172a",
    cardBackground: "#ffffff",
  }),
  createThemePreset("blush-market", "Blush Market", "Friendly storefront pink paired with balanced neutrals.", {
    primary: "#db2777",
    secondary: "#3f3f46",
    accent: "#fb7185",
    surface: "#fff1f2",
    textColor: "#27272a",
    cardBackground: "#ffffff",
  }),
];

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "system-sans",
    label: "System Sans",
    description: "Fast default UI stack with no external font dependency.",
    family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    id: "manrope",
    label: "Manrope",
    description: "Balanced geometric sans used by the current platform shell.",
    family: '"Manrope", "Inter", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "inter",
    label: "Inter",
    description: "Dense, readable product sans for data-heavy interfaces.",
    family: '"Inter", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "plus-jakarta",
    label: "Plus Jakarta Sans",
    description: "Modern sans with a friendly, editorial curve.",
    family: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "outfit",
    label: "Outfit",
    description: "Rounder display-friendly sans for polished app shells.",
    family: '"Outfit", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    description: "Compact sans with good rhythm for dashboards and forms.",
    family: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap",
  },
  {
    id: "sora",
    label: "Sora",
    description: "Sharp, futuristic sans for more branded mobile experiences.",
    family: '"Sora", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "urbanist",
    label: "Urbanist",
    description: "Softer geometric sans with wide display support.",
    family: '"Urbanist", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "work-sans",
    label: "Work Sans",
    description: "Neutral sans suited to admin tools and dense tables.",
    family: '"Work Sans", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    description: "Expressive grotesk for bold, modern headings and shells.",
    family: '"Space Grotesk", "Manrope", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap",
  },
  {
    id: "nunito-sans",
    label: "Nunito Sans",
    description: "Rounded sans for warmer consumer-facing apps.",
    family: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap",
  },
  {
    id: "archivo",
    label: "Archivo",
    description: "Industrial sans with sturdy numerals for operations views.",
    family: '"Archivo", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "rubik",
    label: "Rubik",
    description: "Soft square sans that works well for app navigation.",
    family: '"Rubik", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "figtree",
    label: "Figtree",
    description: "Efficient UI sans with clear small-size rendering.",
    family: '"Figtree", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    description: "Technical sans with a disciplined product feel.",
    family: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    importUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "lora",
    label: "Lora",
    description: "Readable serif for premium and editorial brand directions.",
    family: '"Lora", Georgia, serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    description: "Traditional serif with strong readability for content apps.",
    family: '"Merriweather", Georgia, serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    description: "Elegant high-contrast serif for premium marketing looks.",
    family: '"Playfair Display", Georgia, serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap",
  },
  {
    id: "fraunces",
    label: "Fraunces",
    description: "Distinctive display serif for highly branded experiences.",
    family: '"Fraunces", Georgia, serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    description: "Classic serif with a more formal product tone.",
    family: '"Libre Baskerville", Georgia, serif',
    importUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
  },
];

export function findPlatformThemePreset(id?: string) {
  return PLATFORM_THEME_PRESETS.find((preset) => preset.id === id) ?? PLATFORM_THEME_PRESETS[0];
}

export function findAppThemePreset(id?: string) {
  return APP_THEME_PRESETS.find((preset) => preset.id === id) ?? APP_THEME_PRESETS[0];
}

export function findFontOption(id?: string) {
  return (
    FONT_OPTIONS.find((font) => font.id === id) ??
    FONT_OPTIONS.find((font) => font.id === DEFAULT_FONT_PRESET_ID) ??
    FONT_OPTIONS[0]
  );
}
