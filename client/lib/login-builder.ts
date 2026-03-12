import type { LoginBuilderBlockId, LoginBuilderConfig } from "@shared/api";

export const LOGIN_BUILDER_LIBRARY: Array<{
  id: LoginBuilderBlockId;
  label: string;
  description: string;
  recommendedColumn: "left" | "right";
  required?: boolean;
}> = [
  {
    id: "badge",
    label: "Security Badge",
    description: "Top label showing secure access context.",
    recommendedColumn: "left",
  },
  {
    id: "brand",
    label: "Brand Mark",
    description: "Logo mark and identity anchor.",
    recommendedColumn: "left",
  },
  {
    id: "headline",
    label: "Hero Heading",
    description: "Large login page headline text.",
    recommendedColumn: "left",
  },
  {
    id: "description",
    label: "Hero Description",
    description: "Supporting copy under the heading.",
    recommendedColumn: "left",
  },
  {
    id: "featureTiles",
    label: "Feature Tiles",
    description: "Security and capability cards.",
    recommendedColumn: "left",
  },
  {
    id: "loginTitle",
    label: "Form Title",
    description: "Authentication panel heading.",
    recommendedColumn: "right",
  },
  {
    id: "loginHint",
    label: "Form Hint",
    description: "Supporting text above credentials.",
    recommendedColumn: "right",
  },
  {
    id: "loginForm",
    label: "Login Form",
    description: "Username/password and submit action.",
    recommendedColumn: "right",
    required: true,
  },
  {
    id: "demoAccounts",
    label: "Demo Accounts",
    description: "Role-based preset credentials.",
    recommendedColumn: "right",
  },
  {
    id: "footer",
    label: "Footer Link",
    description: "Redirect path and quick link.",
    recommendedColumn: "right",
  },
];

const VALID_BLOCK_IDS = new Set<LoginBuilderBlockId>(
  LOGIN_BUILDER_LIBRARY.map((entry) => entry.id),
);

const REQUIRED_BLOCK_IDS = new Set<LoginBuilderBlockId>(
  LOGIN_BUILDER_LIBRARY.filter((entry) => entry.required).map((entry) => entry.id),
);

function uniqueBlocks(
  input: unknown,
  fallback: LoginBuilderBlockId[],
  disallow: Set<LoginBuilderBlockId>,
) {
  const result: LoginBuilderBlockId[] = [];
  const source = Array.isArray(input) ? input : fallback;

  for (const value of source) {
    if (!VALID_BLOCK_IDS.has(value as LoginBuilderBlockId)) {
      continue;
    }

    const block = value as LoginBuilderBlockId;
    if (disallow.has(block) || result.includes(block)) {
      continue;
    }

    result.push(block);
  }

  return result;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function createDefaultLoginBuilderConfig(): LoginBuilderConfig {
  return {
    layout: "split",
    heroWidth: 58,
    cardRadius: 32,
    heroPanelOpacity: 8,
    authPanelOpacity: 70,
    featureColumns: 3,
    leftBlocks: ["badge", "brand", "headline", "description", "featureTiles"],
    rightBlocks: ["loginTitle", "loginHint", "loginForm", "demoAccounts", "footer"],
  };
}

export function normalizeLoginBuilderConfig(
  value?: Partial<LoginBuilderConfig> | null,
): LoginBuilderConfig {
  const defaults = createDefaultLoginBuilderConfig();
  const left = uniqueBlocks(value?.leftBlocks, defaults.leftBlocks, new Set());
  const leftSet = new Set(left);
  const right = uniqueBlocks(value?.rightBlocks, defaults.rightBlocks, leftSet);

  for (const required of REQUIRED_BLOCK_IDS) {
    if (!left.includes(required) && !right.includes(required)) {
      right.unshift(required);
    }
  }

  const featureColumns = clamp(value?.featureColumns, 1, 3, defaults.featureColumns) as
    | 1
    | 2
    | 3;

  return {
    layout: value?.layout === "stacked" ? "stacked" : "split",
    heroWidth: clamp(value?.heroWidth, 35, 70, defaults.heroWidth),
    cardRadius: clamp(value?.cardRadius, 16, 44, defaults.cardRadius),
    heroPanelOpacity: clamp(value?.heroPanelOpacity, 4, 24, defaults.heroPanelOpacity),
    authPanelOpacity: clamp(value?.authPanelOpacity, 45, 90, defaults.authPanelOpacity),
    featureColumns,
    leftBlocks: left.length ? left : defaults.leftBlocks,
    rightBlocks: right.length ? right : defaults.rightBlocks,
  };
}
