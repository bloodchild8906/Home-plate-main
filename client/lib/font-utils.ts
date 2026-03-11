import { readFileAsDataUrl } from "@/lib/asset-utils";
import {
  DEFAULT_FONT_PRESET_ID,
  findFontOption,
  UPLOADED_FONT_PRESET_ID,
} from "@/lib/theme-presets";

type FontSelection = {
  fontPresetId?: string;
  fontFamily?: string;
  customFontName?: string;
  customFontSource?: string;
  customFontFormat?: string;
};

function escapeCssString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function upsertHeadLink(id: string, href?: string) {
  if (typeof document === "undefined") {
    return;
  }

  const selector = `link[data-homeplate-font-link="${id}"]`;
  const existing = document.head.querySelector<HTMLLinkElement>(selector);

  if (!href) {
    existing?.remove();
    return;
  }

  const link = existing ?? document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.homeplateFontLink = id;

  if (!existing) {
    document.head.appendChild(link);
  }
}

function upsertHeadStyle(id: string, css?: string) {
  if (typeof document === "undefined") {
    return;
  }

  const selector = `style[data-homeplate-font-style="${id}"]`;
  const existing = document.head.querySelector<HTMLStyleElement>(selector);

  if (!css?.trim()) {
    existing?.remove();
    return;
  }

  const styleTag = existing ?? document.createElement("style");
  styleTag.dataset.homeplateFontStyle = id;
  styleTag.textContent = css;

  if (!existing) {
    document.head.appendChild(styleTag);
  }
}

export function deriveFontName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function inferFontFormat(file: File | string) {
  const fileName = typeof file === "string" ? file : file.name;
  const normalized = fileName.trim().toLowerCase();

  if (normalized.endsWith(".woff2")) {
    return "woff2";
  }

  if (normalized.endsWith(".woff")) {
    return "woff";
  }

  if (normalized.endsWith(".ttf")) {
    return "truetype";
  }

  if (normalized.endsWith(".otf")) {
    return "opentype";
  }

  return "";
}

export function buildUploadedFontFamily(fontName: string) {
  const cleaned = fontName.trim().replace(/\s+/g, " ") || "Uploaded Font";
  return `"${cleaned.replace(/"/g, "")}", ui-sans-serif, system-ui, sans-serif`;
}

export function readFontFileAsDataUrl(file: File) {
  return readFileAsDataUrl(file);
}

export function resolveFontFamily(selection: FontSelection) {
  const manualFamily = selection.fontFamily?.trim();
  if (manualFamily) {
    return manualFamily;
  }

  if (selection.customFontSource && selection.customFontName) {
    return buildUploadedFontFamily(selection.customFontName);
  }

  const preset = findFontOption(selection.fontPresetId || DEFAULT_FONT_PRESET_ID);
  return preset.family;
}

export function syncFontAssets(scopeId: string, selection: FontSelection) {
  const preset =
    selection.fontPresetId && selection.fontPresetId !== UPLOADED_FONT_PRESET_ID
      ? findFontOption(selection.fontPresetId)
      : undefined;

  upsertHeadLink(scopeId, preset?.importUrl);

  const css =
    selection.customFontSource && selection.customFontName
      ? `@font-face {
  font-family: "${escapeCssString(selection.customFontName)}";
  src: url("${escapeCssString(selection.customFontSource)}")${
          selection.customFontFormat
            ? ` format("${escapeCssString(selection.customFontFormat)}")`
            : ""
        };
  font-display: swap;
}`
      : "";

  upsertHeadStyle(scopeId, css);
}
