import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { ApiResponse, BuilderPersistedApp } from "@shared/api";
import { getInitials, slugify } from "@/lib/asset-utils";
import { normalizeHex } from "@/lib/color-utils";
import { useAuth } from "@/lib/auth";

export type BuilderBlockType =
  | "heading"
  | "text"
  | "button"
  | "html"
  | "quicklinks"
  | "receiptscan"
  | "qrcode"
  | "rewardcatalog"
  | "wallet"
  | "profile"
  | "auth";

export type BuilderLayoutDisplay = "block" | "flex" | "grid";

export type BuilderLayoutDirection = "row" | "column";

export type BuilderLayoutJustify =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type BuilderLayoutAlign = "stretch" | "flex-start" | "center" | "flex-end";

export type BuilderBlockLayout = {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  radius: number;
  display: BuilderLayoutDisplay;
  direction: BuilderLayoutDirection;
  justify: BuilderLayoutJustify;
  align: BuilderLayoutAlign;
  gap: number;
  columns: number;
};

export type BuilderBlockAttributes = {
  elementId: string;
  className: string;
  style: string;
};

export type BuilderBlockActionKind = "none" | "navigate" | "api";

export type BuilderBlockApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type BuilderApiFunctionSourceField =
  | "text"
  | "helper"
  | "points"
  | "items"
  | "htmlTag";

export type BuilderApiFunctionPropertyBinding = {
  id: string;
  key: string;
  sourceType: "block" | "static";
  sourceBlockId: string;
  sourceField: BuilderApiFunctionSourceField;
  staticValue: string;
};

export type BuilderApiFunction = {
  id: string;
  name: string;
  endpoint: string;
  method: BuilderBlockApiMethod;
  headers: string;
  successMessage: string;
  properties: BuilderApiFunctionPropertyBinding[];
};

export type BuilderBlockEventBinding = {
  kind: BuilderBlockActionKind;
  targetPageId: string;
  functionId: string;
  successMessage: string;
};

export type BuilderBlockEvents = {
  tap: BuilderBlockEventBinding;
};

export type BuilderBlock = {
  id: string;
  type: BuilderBlockType;
  name: string;
  text?: string;
  helper?: string;
  items?: string[];
  points?: number;
  htmlTag?: string;
  htmlAttributes?: string;
  layout: BuilderBlockLayout;
  attributes: BuilderBlockAttributes;
  events: BuilderBlockEvents;
};

export type BuilderPage = {
  id: string;
  name: string;
  blocks: BuilderBlock[];
};

export type BuilderBrand = {
  appName: string;
  logo: string;
  logoImage?: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  textColor: string;
  cardBackground: string;
  fontFamily: string;
  backgroundImage?: string;
  heroImage?: string;
  customCss: string;
  customCssFileName: string;
  domain: string;
};

export type BuilderAppModel = {
  id: string;
  name: string;
  published: boolean;
  live: boolean;
  updatedAt: string;
  brand: BuilderBrand;
  apiFunctions: BuilderApiFunction[];
  pages: BuilderPage[];
};

export type BuilderAppTemplateId =
  | "blank"
  | "loyalty"
  | "ordering"
  | "vip"
  | "coffee";

export type BuilderAppTemplate = {
  id: BuilderAppTemplateId;
  label: string;
  category: string;
  description: string;
  preview: string[];
  pageCount: number;
};

type CreateAppOptions = {
  name: string;
  templateId: BuilderAppTemplateId;
};

type BuilderStoreValue = {
  apps: BuilderAppModel[];
  createApp: (options: CreateAppOptions) => string;
  deleteApp: (appId: string) => void;
  duplicateApp: (appId: string) => string | null;
  updateApp: (appId: string, updater: (app: BuilderAppModel) => BuilderAppModel) => void;
};

type TemplateDefinition = BuilderAppTemplate & {
  brand: Partial<
    Omit<
      BuilderBrand,
      "appName" | "logo" | "logoImage" | "backgroundImage" | "heroImage" | "domain"
    >
  >;
  createPages: () => BuilderPage[];
};

const BLOCK_TYPES: BuilderBlockType[] = [
  "heading",
  "text",
  "button",
  "html",
  "quicklinks",
  "receiptscan",
  "qrcode",
  "rewardcatalog",
  "wallet",
  "profile",
  "auth",
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultLayout(): BuilderBlockLayout {
  return {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 12,
    marginLeft: 0,
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    radius: 20,
    display: "block",
    direction: "column",
    justify: "flex-start",
    align: "stretch",
    gap: 12,
    columns: 2,
  };
}

function createDefaultAttributes(): BuilderBlockAttributes {
  return {
    elementId: "",
    className: "",
    style: "",
  };
}

function createDefaultEventBinding(): BuilderBlockEventBinding {
  return {
    kind: "none",
    targetPageId: "",
    functionId: "",
    successMessage: "",
  };
}

function createDefaultApiFunctionPropertyBinding(): BuilderApiFunctionPropertyBinding {
  return {
    id: uid("prop"),
    key: "value",
    sourceType: "block",
    sourceBlockId: "",
    sourceField: "text",
    staticValue: "",
  };
}

function createDefaultApiFunction(index = 0): BuilderApiFunction {
  return {
    id: uid("fn"),
    name: `Function ${index + 1}`,
    endpoint: "/api/ping",
    method: "GET",
    headers: "",
    successMessage: "",
    properties: [createDefaultApiFunctionPropertyBinding()],
  };
}

export function createApiFunctionPropertyBinding(
  overrides: Partial<BuilderApiFunctionPropertyBinding> = {},
) {
  return normalizeApiFunctionPropertyBinding(overrides);
}

export function createApiFunction(index = 0, overrides: Partial<BuilderApiFunction> = {}) {
  return normalizeApiFunction({ ...createDefaultApiFunction(index), ...overrides }, index);
}

function isLayoutDisplay(value: string): value is BuilderLayoutDisplay {
  return ["block", "flex", "grid"].includes(value);
}

function isLayoutDirection(value: string): value is BuilderLayoutDirection {
  return ["row", "column"].includes(value);
}

function isLayoutJustify(value: string): value is BuilderLayoutJustify {
  return [
    "flex-start",
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly",
  ].includes(value);
}

function isLayoutAlign(value: string): value is BuilderLayoutAlign {
  return ["stretch", "flex-start", "center", "flex-end"].includes(value);
}

function normalizeLayout(value?: Partial<BuilderBlockLayout>) {
  return {
    ...createDefaultLayout(),
    ...value,
    marginTop: Number(value?.marginTop ?? 0),
    marginRight: Number(value?.marginRight ?? 0),
    marginBottom: Number(value?.marginBottom ?? 12),
    marginLeft: Number(value?.marginLeft ?? 0),
    paddingTop: Number(value?.paddingTop ?? 16),
    paddingRight: Number(value?.paddingRight ?? 16),
    paddingBottom: Number(value?.paddingBottom ?? 16),
    paddingLeft: Number(value?.paddingLeft ?? 16),
    radius: Number(value?.radius ?? 20),
    display: isLayoutDisplay(String(value?.display ?? ""))
      ? (String(value?.display) as BuilderLayoutDisplay)
      : "block",
    direction: isLayoutDirection(String(value?.direction ?? ""))
      ? (String(value?.direction) as BuilderLayoutDirection)
      : "column",
    justify: isLayoutJustify(String(value?.justify ?? ""))
      ? (String(value?.justify) as BuilderLayoutJustify)
      : "flex-start",
    align: isLayoutAlign(String(value?.align ?? ""))
      ? (String(value?.align) as BuilderLayoutAlign)
      : "stretch",
    gap: Math.max(0, Number(value?.gap ?? 12)),
    columns: Math.max(1, Number(value?.columns ?? 2)),
  } satisfies BuilderBlockLayout;
}

function normalizeAttributes(value?: Partial<BuilderBlockAttributes>) {
  return {
    ...createDefaultAttributes(),
    elementId: value?.elementId?.trim() ?? "",
    className: value?.className?.trim() ?? "",
    style: value?.style?.trim() ?? "",
  } satisfies BuilderBlockAttributes;
}

function isApiMethod(value: string): value is BuilderBlockApiMethod {
  return ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(value);
}

function isApiFunctionSourceField(value: string): value is BuilderApiFunctionSourceField {
  return ["text", "helper", "points", "items", "htmlTag"].includes(value);
}

function normalizeApiFunctionPropertyBinding(
  value?: Partial<BuilderApiFunctionPropertyBinding>,
) {
  return {
    ...createDefaultApiFunctionPropertyBinding(),
    id: value?.id ?? uid("prop"),
    key: value?.key?.trim() || "value",
    sourceType: value?.sourceType === "static" ? "static" : "block",
    sourceBlockId: value?.sourceBlockId?.trim() ?? "",
    sourceField: isApiFunctionSourceField(String(value?.sourceField ?? ""))
      ? (String(value?.sourceField) as BuilderApiFunctionSourceField)
      : "text",
    staticValue: value?.staticValue ?? "",
  } satisfies BuilderApiFunctionPropertyBinding;
}

function normalizeApiFunction(value: Partial<BuilderApiFunction> | undefined, index: number) {
  return {
    ...createDefaultApiFunction(index),
    ...value,
    id: value?.id ?? uid("fn"),
    name: value?.name?.trim() || `Function ${index + 1}`,
    endpoint: value?.endpoint?.trim() || "/api/ping",
    method: isApiMethod(String(value?.method ?? ""))
      ? (String(value?.method) as BuilderBlockApiMethod)
      : "GET",
    headers: value?.headers ?? "",
    successMessage: value?.successMessage?.trim() ?? "",
    properties: Array.isArray(value?.properties) && value.properties.length > 0
      ? value.properties.map((property, propertyIndex) =>
          normalizeApiFunctionPropertyBinding({
            ...property,
            key: property?.key?.trim() || `value${propertyIndex + 1}`,
          }),
        )
      : [createDefaultApiFunctionPropertyBinding()],
  } satisfies BuilderApiFunction;
}

function normalizeApiFunctions(value?: Partial<BuilderApiFunction>[]) {
  return Array.isArray(value)
    ? value.map((item, index) => normalizeApiFunction(item, index))
    : [];
}

function normalizeEventBinding(value?: Partial<BuilderBlockEventBinding>) {
  return {
    ...createDefaultEventBinding(),
    kind:
      value?.kind === "navigate" || value?.kind === "api" || value?.kind === "none"
        ? value.kind
        : "none",
    targetPageId: value?.targetPageId?.trim() ?? "",
    functionId: value?.functionId?.trim() ?? "",
    successMessage: value?.successMessage?.trim() ?? "",
  } satisfies BuilderBlockEventBinding;
}

function normalizeEvents(value?: Partial<BuilderBlockEvents>) {
  return {
    tap: normalizeEventBinding(value?.tap),
  } satisfies BuilderBlockEvents;
}

function page(name: string, blocks: BuilderBlock[]) {
  return { id: uid("p"), name, blocks };
}

function isBlockType(value: string): value is BuilderBlockType {
  return BLOCK_TYPES.includes(value as BuilderBlockType);
}

export function createBlock(
  type: BuilderBlockType,
  overrides: Partial<BuilderBlock> = {},
): BuilderBlock {
  const base: Record<BuilderBlockType, Omit<BuilderBlock, "id" | "layout" | "attributes" | "events">> = {
    heading: { type, name: "Heading", text: "New section" },
    text: {
      type,
      name: "Text",
      text: "Supporting copy for this screen.",
    },
    button: { type, name: "Button", text: "Primary action" },
    html: {
      type,
      name: "HTML Element",
      text: "Custom element content",
      htmlTag: "section",
      htmlAttributes: "{\n  \"title\": \"Custom section\"\n}",
    },
    quicklinks: {
      type,
      name: "Quick Links",
      items: ["Menu", "Earn", "Redeem", "Profile"],
    },
    receiptscan: {
      type,
      name: "Receipt Scan",
      text: "Scan receipt to earn points",
      helper: "OCR a printed receipt and add points instantly.",
      points: 180,
    },
    qrcode: {
      type,
      name: "QR Scan",
      text: "Scan venue QR",
      helper: "Check in, earn, or redeem with a table QR code.",
      points: 75,
    },
    rewardcatalog: {
      type,
      name: "Redeem Catalog",
      text: "Spend points on rewards",
      items: ["250 pts Coffee", "500 pts 10% Off", "800 pts VIP Access"],
    },
    wallet: {
      type,
      name: "Payments",
      text: "Saved payment methods",
      items: ["Visa **** 4242", "Apple Pay", "Corporate Card"],
    },
    profile: {
      type,
      name: "Profile",
      text: "Member profile",
      items: ["Gold tier", "2,450 points", "3 cards on file"],
    },
    auth: {
      type,
      name: "Auth Screen",
      text: "Welcome back",
      helper: "Sign in to sync payments, points, and rewards.",
    },
  };

  return {
    id: overrides.id ?? uid("b"),
    ...base[type],
    ...overrides,
    layout: normalizeLayout(overrides.layout),
    attributes: normalizeAttributes(overrides.attributes),
    events: normalizeEvents(overrides.events),
  };
}

function createBlankPages() {
  return [
    page("Home", [
      createBlock("heading", { text: "Build your first mobile flow" }),
      createBlock("text", {
        text: "Start with a blank shell, then add blocks from the toolbar.",
      }),
      createBlock("button", { text: "Create first action" }),
    ]),
  ];
}

export function createDefaultPages() {
  return [
    page("Earn", [
      createBlock("heading", { text: "Earn rewards faster" }),
      createBlock("quicklinks", {
        items: ["Scan Receipt", "Menu", "Offers", "Profile"],
      }),
      createBlock("receiptscan"),
      createBlock("qrcode"),
    ]),
    page("Redeem", [
      createBlock("heading", { text: "Redeem your points" }),
      createBlock("rewardcatalog"),
      createBlock("button", { text: "View all rewards" }),
    ]),
    page("Payments", [
      createBlock("heading", { text: "Saved wallets" }),
      createBlock("wallet"),
    ]),
    page("Profile", [
      createBlock("profile"),
      createBlock("button", { text: "Manage account" }),
    ]),
    page("Auth", [createBlock("auth")]),
  ];
}

function createOrderingPages() {
  return [
    page("Home", [
      createBlock("heading", { text: "Order ahead in a few taps" }),
      createBlock("quicklinks", {
        items: ["Bowls", "Burgers", "Combos", "Desserts"],
      }),
      createBlock("text", {
        text: "Highlight pickup timing, hero offers, or delivery availability.",
      }),
      createBlock("button", { text: "Start order" }),
    ]),
    page("Menu", [
      createBlock("heading", { text: "Browse categories" }),
      createBlock("quicklinks", {
        items: ["Popular", "Breakfast", "Lunch", "Drinks"],
      }),
      createBlock("button", { text: "Open full menu" }),
    ]),
    page("Checkout", [
      createBlock("heading", { text: "Fast checkout" }),
      createBlock("wallet", {
        text: "Checkout methods",
        items: ["Visa **** 4242", "Apple Pay", "Gift Balance"],
      }),
      createBlock("button", { text: "Pay now" }),
    ]),
    page("Account", [
      createBlock("profile", {
        text: "Customer account",
        items: ["Saved addresses", "Order history", "Favorites"],
      }),
      createBlock("auth", {
        text: "Keep orders synced",
        helper: "Sign in to track orders, re-order favorites, and save payments.",
      }),
    ]),
  ];
}

function createVipPages() {
  return [
    page("Concierge", [
      createBlock("heading", { text: "VIP concierge access" }),
      createBlock("quicklinks", {
        items: ["Reserve", "Events", "Perks", "Support"],
      }),
      createBlock("qrcode", {
        text: "Scan for lounge access",
        helper: "Present your member code to unlock premium spaces and events.",
        points: 40,
      }),
    ]),
    page("Perks", [
      createBlock("heading", { text: "Exclusive member perks" }),
      createBlock("rewardcatalog", {
        text: "Reserve premium perks",
        items: ["Priority seating", "Chef table invite", "Birthday tasting"],
      }),
      createBlock("button", { text: "Claim perk" }),
    ]),
    page("Profile", [
      createBlock("profile", {
        text: "VIP profile",
        items: ["Platinum tier", "Dedicated host", "2 active reservations"],
      }),
    ]),
    page("Access", [
      createBlock("auth", {
        text: "Sign in to your membership",
        helper: "Secure your passes, reservations, and premium payment methods.",
      }),
    ]),
  ];
}

function createCoffeePages() {
  return [
    page("Home", [
      createBlock("heading", { text: "Your daily coffee companion" }),
      createBlock("quicklinks", {
        items: ["Reorder", "Rewards", "Scan", "Wallet"],
      }),
      createBlock("receiptscan", {
        text: "Scan in-store receipt",
        helper: "Turn each drink into loyalty points, even if staff forgets to scan.",
        points: 55,
      }),
      createBlock("button", { text: "Reorder latte" }),
    ]),
    page("Rewards", [
      createBlock("heading", { text: "Brew rewards" }),
      createBlock("rewardcatalog", {
        text: "Coffee rewards",
        items: ["120 pts Free espresso", "240 pts Pastry combo", "480 pts Merch drop"],
      }),
    ]),
    page("Pay", [
      createBlock("wallet", {
        text: "Fast pay options",
        items: ["Store balance", "Visa **** 4242", "Apple Pay"],
      }),
      createBlock("button", { text: "Top up balance" }),
    ]),
    page("Account", [
      createBlock("profile", {
        text: "Coffee account",
        items: ["Bean Club", "1,180 points", "Favorite: Oat Latte"],
      }),
      createBlock("auth", {
        text: "Stay signed in",
        helper: "Keep your balance, favorites, and reward progress synced everywhere.",
      }),
    ]),
  ];
}

const TEMPLATE_DEFINITIONS: Record<BuilderAppTemplateId, TemplateDefinition> = {
  blank: {
    id: "blank",
    label: "Blank",
    category: "Starter",
    description: "One clean home screen so you can build the full navigation and content model from scratch.",
    preview: ["Home", "Flexible blocks", "Custom flow"],
    pageCount: 1,
    brand: {
      primary: "#2563eb",
      secondary: "#0f172a",
      accent: "#38bdf8",
      surface: "#eff6ff",
    },
    createPages: createBlankPages,
  },
  loyalty: {
    id: "loyalty",
    label: "Loyalty Rewards",
    category: "Rewards",
    description: "Earn, redeem, wallet, profile, and auth pages ready for loyalty-led restaurant apps.",
    preview: ["Earn", "Redeem", "Wallet"],
    pageCount: 5,
    brand: {
      primary: "#ea580c",
      secondary: "#7c2d12",
      accent: "#f59e0b",
      surface: "#fff7ed",
    },
    createPages: createDefaultPages,
  },
  ordering: {
    id: "ordering",
    label: "Ordering",
    category: "Commerce",
    description: "A quick-start layout for browse, checkout, saved payment methods, and account flows.",
    preview: ["Home", "Menu", "Checkout"],
    pageCount: 4,
    brand: {
      primary: "#0f766e",
      secondary: "#134e4a",
      accent: "#38bdf8",
      surface: "#f0fdfa",
    },
    createPages: createOrderingPages,
  },
  vip: {
    id: "vip",
    label: "VIP Membership",
    category: "Experience",
    description: "Premium reservations, member perks, concierge, and gated access patterns for high-touch brands.",
    preview: ["Concierge", "Perks", "Access"],
    pageCount: 4,
    brand: {
      primary: "#7c3aed",
      secondary: "#2e1065",
      accent: "#f472b6",
      surface: "#faf5ff",
    },
    createPages: createVipPages,
  },
  coffee: {
    id: "coffee",
    label: "Coffee Rewards",
    category: "Retail",
    description: "Optimized for reorder, receipt scanning, stored value, and small-format daily reward habits.",
    preview: ["Reorder", "Scan", "Wallet"],
    pageCount: 4,
    brand: {
      primary: "#b45309",
      secondary: "#422006",
      accent: "#fbbf24",
      surface: "#fffbeb",
    },
    createPages: createCoffeePages,
  },
};

export const APP_TEMPLATES: BuilderAppTemplate[] = Object.values(TEMPLATE_DEFINITIONS).map(
  ({ createPages: _createPages, brand: _brand, ...template }) => template,
);

function normalizeBrand(value: Partial<BuilderBrand> | undefined, appName: string) {
  return {
    appName,
    logo: (value?.logo?.trim() || getInitials(appName)).toUpperCase().slice(0, 3),
    logoImage: value?.logoImage ?? "",
    primary: normalizeHex(value?.primary ?? "#ea580c"),
    secondary: normalizeHex(value?.secondary ?? "#0f172a"),
    accent: normalizeHex(value?.accent ?? "#f59e0b"),
    surface: normalizeHex(value?.surface ?? "#fff7ed"),
    textColor: normalizeHex(value?.textColor ?? "#0f172a", "#0f172a"),
    cardBackground: normalizeHex(value?.cardBackground ?? "#ffffff", "#ffffff"),
    fontFamily: value?.fontFamily?.trim() || "ui-sans-serif, system-ui, sans-serif",
    backgroundImage: value?.backgroundImage ?? "",
    heroImage: value?.heroImage ?? "",
    customCss: value?.customCss ?? "",
    customCssFileName: value?.customCssFileName?.trim() ?? "",
    domain: value?.domain?.trim() || `${slugify(appName)}.brand.app`,
  } satisfies BuilderBrand;
}

function normalizeBlock(block: Partial<BuilderBlock>, index: number) {
  const type = isBlockType(String(block.type ?? "")) ? block.type : "text";
  const fallback = createBlock(type);

  return {
    ...fallback,
    ...block,
    id: block.id ?? `b-${index}`,
    type,
    name: block.name ?? fallback.name,
    text: block.text ?? fallback.text,
    helper: block.helper ?? fallback.helper,
    items: Array.isArray(block.items) ? block.items : fallback.items,
    points: typeof block.points === "number" ? block.points : fallback.points,
    htmlTag: block.htmlTag?.trim() || fallback.htmlTag,
    htmlAttributes: block.htmlAttributes ?? fallback.htmlAttributes,
    layout: normalizeLayout(block.layout),
    attributes: normalizeAttributes(block.attributes),
    events: normalizeEvents(block.events),
  } satisfies BuilderBlock;
}

function normalizePage(pageData: Partial<BuilderPage>, index: number) {
  return {
    id: pageData.id ?? `p-${index}`,
    name: pageData.name?.trim() || `Page ${index + 1}`,
    blocks: Array.isArray(pageData.blocks) && pageData.blocks.length > 0
      ? pageData.blocks.map((block, blockIndex) => normalizeBlock(block, blockIndex))
      : [createBlock("heading"), createBlock("text")],
  } satisfies BuilderPage;
}

function normalizeApp(app: Partial<BuilderAppModel>, index: number) {
  const appName = app.name?.trim() || app.brand?.appName?.trim() || `New App ${index + 1}`;

  return {
    id: app.id ?? `a-${index}`,
    name: appName,
    published: Boolean(app.published),
    live: Boolean(app.live),
    updatedAt: app.updatedAt ?? new Date().toISOString(),
    brand: normalizeBrand(app.brand, appName),
    apiFunctions: normalizeApiFunctions(app.apiFunctions),
    pages: Array.isArray(app.pages) && app.pages.length > 0
      ? app.pages.map((pageData, pageIndex) => normalizePage(pageData, pageIndex))
      : createBlankPages(),
  } satisfies BuilderAppModel;
}

function createAppFromTemplate(
  templateId: BuilderAppTemplateId,
  name: string,
  index: number,
  overrides?: Partial<Omit<BuilderAppModel, "brand" | "pages">> & {
    brand?: Partial<BuilderBrand>;
    pages?: BuilderPage[];
  },
): BuilderAppModel {
  const template = TEMPLATE_DEFINITIONS[templateId] ?? TEMPLATE_DEFINITIONS.blank;
  const appName = name.trim() || `New App ${index + 1}`;
  const pages = overrides?.pages ?? template.createPages();

  return {
    id: overrides?.id ?? uid("a"),
    name: appName,
    published: overrides?.published ?? false,
    live: overrides?.live ?? false,
    updatedAt: overrides?.updatedAt ?? new Date().toISOString(),
    brand: normalizeBrand(
      {
        ...template.brand,
        ...overrides?.brand,
        appName,
        logo: overrides?.brand?.logo ?? getInitials(appName),
        domain: overrides?.brand?.domain ?? `${slugify(appName)}.brand.app`,
      },
      appName,
    ),
    apiFunctions: normalizeApiFunctions(overrides?.apiFunctions),
    pages: pages.map((pageData, pageIndex) => normalizePage(pageData, pageIndex)),
  };
}

function createDefaultApps(): BuilderAppModel[] {
  return [
    createAppFromTemplate("loyalty", "HomePlate Rewards", 0, {
      published: true,
      live: true,
      brand: {
        domain: "rewards.homeplate.app",
      },
    }),
    createAppFromTemplate("ordering", "Bistro Circle", 1, {
      brand: {
        domain: "circle.bistro.app",
      },
    }),
  ];
}

function clonePage(pageData: BuilderPage) {
  return {
    ...pageData,
    id: uid("p"),
    blocks: pageData.blocks.map((block) => ({
      ...block,
      id: uid("b"),
      layout: normalizeLayout(block.layout),
      attributes: normalizeAttributes(block.attributes),
      events: normalizeEvents(block.events),
    })),
  };
}

const BuilderStoreContext = createContext<BuilderStoreValue | undefined>(undefined);

export function BuilderStoreProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isReady: isAuthReady } = useAuth();
  const [apps, setApps] = useState<BuilderAppModel[]>(createDefaultApps);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setApps(createDefaultApps());
      setIsReady(false);
      return;
    }

    let cancelled = false;

    const loadApps = async () => {
      try {
        const response = await fetch("/api/builder/apps");
        if (!response.ok) {
          throw new Error("Failed to load builder apps");
        }

        const payload =
          (await response.json()) as ApiResponse<BuilderPersistedApp[] | null>;
        if (!cancelled && payload.success && Array.isArray(payload.data)) {
          setApps(
            payload.data.map((app, index) =>
              normalizeApp(app as unknown as Partial<BuilderAppModel>, index),
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setApps(createDefaultApps());
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void loadApps();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAuthReady]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetch("/api/builder/apps", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apps }),
      }).catch(() => undefined);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [apps, isAuthenticated, isReady]);

  const value = useMemo<BuilderStoreValue>(
    () => ({
      apps,
      createApp: ({ name, templateId }) => {
        const next = createAppFromTemplate(templateId, name, apps.length);
        setApps((current) => [...current, next]);
        return next.id;
      },
      deleteApp: (appId) => {
        setApps((current) => current.filter((app) => app.id !== appId));
      },
      duplicateApp: (appId) => {
        const source = apps.find((app) => app.id === appId);
        if (!source) return null;

        const copy = normalizeApp(
          {
            ...source,
            id: uid("a"),
            name: `${source.name} Copy`,
            published: false,
            live: false,
            updatedAt: new Date().toISOString(),
            brand: {
              ...source.brand,
              appName: `${source.brand.appName} Copy`,
              domain: `${slugify(source.name)}-copy.brand.app`,
            },
            apiFunctions: source.apiFunctions.map((fn, index) =>
              normalizeApiFunction(
                {
                  ...fn,
                  id: uid("fn"),
                  name: `${fn.name} Copy`,
                  properties: fn.properties.map((property) => ({
                    ...property,
                    id: uid("prop"),
                  })),
                },
                index,
              ),
            ),
            pages: source.pages.map(clonePage),
          },
          apps.length,
        );

        setApps((current) => [...current, copy]);
        return copy.id;
      },
      updateApp: (appId, updater) => {
        setApps((current) =>
          current.map((app) =>
            app.id === appId
              ? normalizeApp(
                  { ...updater(app), updatedAt: new Date().toISOString() },
                  current.findIndex((entry) => entry.id === appId),
                )
              : app,
          ),
        );
      },
    }),
    [apps],
  );

  return <BuilderStoreContext.Provider value={value}>{children}</BuilderStoreContext.Provider>;
}

export function useBuilderStore() {
  const context = useContext(BuilderStoreContext);
  if (!context) {
    throw new Error("useBuilderStore must be used within BuilderStoreProvider");
  }
  return context;
}
