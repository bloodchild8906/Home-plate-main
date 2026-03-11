export function normalizeHex(value: string, fallback = "#ea580c") {
  const normalized = value.trim().replace("#", "");
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : fallback;
}

function hexToRgb(value: string) {
  const hex = normalizeHex(value).replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

export function hexToHsl(value: string) {
  const { r, g, b } = hexToRgb(value);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  hue /= 6;

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

export function mixHex(source: string, target: string, amount: number) {
  const weight = Math.max(0, Math.min(1, amount));
  const left = hexToRgb(source);
  const right = hexToRgb(target);

  const r = Math.round(left.r * (1 - weight) + right.r * weight);
  const g = Math.round(left.g * (1 - weight) + right.g * weight);
  const b = Math.round(left.b * (1 - weight) + right.b * weight);

  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function isLightColor(value: string) {
  const { r, g, b } = hexToRgb(value);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance >= 0.62;
}

export function getContrastTextColor(
  value: string,
  dark = "#0f172a",
  light = "#ffffff",
) {
  return isLightColor(value) ? dark : light;
}
