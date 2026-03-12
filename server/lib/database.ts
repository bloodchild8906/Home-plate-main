import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  type AccessModuleRequirement,
  type AccessRole,
  type BrandingConfig,
  type BuilderPersistedApp,
  type DashboardPreferencesConfig,
  type LoginBuilderConfig,
  type Member,
  type MemberTagDefinition,
  type Menu,
  type PermissionId,
  type RewardProgram,
  type Role,
  type SiteBrandConfig,
  type User,
  type UserStatus,
} from "@shared/api";
import {
  DEFAULT_ACCESS_ROLES,
  DEFAULT_MODULE_REQUIREMENTS,
} from "@shared/access-control";
import { assertSupabaseConfigured, supabaseRequest } from "./supabase";

type ConfigRow = {
  key: string;
  value_json: unknown;
  updated_at: string;
};

type MenuRow = {
  id: string;
  name: string;
  location: string;
  items_json: unknown;
  specials_json: unknown;
  created_at: string;
  updated_at: string;
};

type RewardProgramRow = {
  id: string;
  name: string;
  points_per_dollar: number | string;
  tiers_json: unknown;
  redemptions_json: unknown;
  point_generators_json: unknown;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  username: string;
  email: string;
  name: string;
  status: Member["status"];
  phone: string | null;
  loyalty_points: number | string;
  tier: string;
  join_date: string;
  last_visit: string | null;
  favorite_location: string | null;
  address: string | null;
  date_of_birth: string | null;
  notes: string | null;
  tags_json: unknown;
  marketing_opt_in: boolean | null;
  total_spend: number | string | null;
  visits: number | string | null;
  avatar: string | null;
  password_hash: string | null;
  password_updated_at: string | null;
  companion_access_code: string | null;
  created_at: string;
  updated_at: string;
};

type BrandingRow = {
  id: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo: string | null;
  favicon: string | null;
  custom_domain: string | null;
  font_family: BrandingConfig["fontFamily"];
};

type UserRow = {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  phone: string | null;
  title: string | null;
  department: string | null;
  notes: string | null;
  avatar: string | null;
  password_hash: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type SessionRow = {
  token_hash: string;
  user_id: string;
  expires_at: string;
  created_at: string;
};

type SeedUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  title?: string;
  department?: string;
  notes?: string;
  avatar?: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

const CONFIG_KEYS = {
  accessRoles: "access_roles",
  siteBrand: "site_brand",
  builderApps: "builder_apps",
  memberTags: "member_tags",
  moduleRequirements: "module_requirements",
} as const;

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const NOW = "2026-03-12T00:00:00.000Z";
const DEFAULT_LOGIN_BUILDER: LoginBuilderConfig = {
  layout: "split",
  heroWidth: 58,
  cardRadius: 32,
  heroPanelOpacity: 8,
  authPanelOpacity: 70,
  featureColumns: 3,
  leftBlocks: ["badge", "brand", "headline", "description", "featureTiles"],
  rightBlocks: ["loginTitle", "loginHint", "loginForm", "demoAccounts", "footer"],
};

const DEFAULT_REGISTER_BUILDER: LoginBuilderConfig = {
  layout: "split",
  heroWidth: 58,
  cardRadius: 32,
  heroPanelOpacity: 8,
  authPanelOpacity: 70,
  featureColumns: 2,
  leftBlocks: ["badge", "brand", "headline", "description", "featureTiles"],
  rightBlocks: ["loginTitle", "loginHint", "registerForm", "footer"],
};

const DEFAULT_SITE_BRAND: SiteBrandConfig = {
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
  loginBuilder: { ...DEFAULT_LOGIN_BUILDER },
  registerBuilder: { ...DEFAULT_REGISTER_BUILDER },
  themePresetId: "ember-control",
  fontPresetId: "manrope",
  fontFamily: '"Manrope", "Inter", ui-sans-serif, system-ui, sans-serif',
  customFontName: "",
  customFontSource: "",
  customFontFormat: "",
  domain: "homeplate.app",
};

const SEEDED_MENUS: Menu[] = [
  {
    id: "menu-1",
    name: "Main Restaurant",
    location: "Downtown",
    items: [
      {
        id: "item-1",
        name: "Signature Burger",
        description: "Premium beef burger with special sauce",
        price: 14.99,
        category: "Burgers",
        featured: true,
        available: true,
        specialLabel: "Best seller",
      },
      {
        id: "item-2",
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with house-made dressing",
        price: 9.99,
        category: "Salads",
        available: true,
      },
    ],
    specials: [
      {
        id: "special-1",
        title: "Lunch Rush Combo",
        description: "Signature Burger plus fries with a same-day promo price.",
        itemId: "item-1",
        bannerText: "Lunch rush",
        promoCode: "LUNCH25",
        specialPrice: 12.99,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        active: true,
        channels: ["qr", "text_code"],
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEEDED_REWARDS: RewardProgram[] = [
  {
    id: "program-1",
    name: "Standard Loyalty",
    pointsPerDollar: 1,
    tiers: [
      {
        id: "tier-1",
        name: "Bronze",
        pointsRequired: 0,
        description: "Entry level membership",
      },
      {
        id: "tier-2",
        name: "Silver",
        pointsRequired: 500,
        description: "Get 5% discount",
        discount: 5,
      },
      {
        id: "tier-3",
        name: "Gold",
        pointsRequired: 1000,
        description: "Get 10% discount plus a free item",
        discount: 10,
        freeItem: "Appetizer",
      },
    ],
    redemptions: [
      {
        id: "redeem-1",
        title: "Free Cappuccino",
        pointsCost: 250,
        rewardType: "free_item",
        value: "Cappuccino",
        description: "Redeem points for any regular cappuccino.",
      },
      {
        id: "redeem-2",
        title: "10% Off Meal",
        pointsCost: 500,
        rewardType: "discount",
        value: "10%",
        description: "Apply a one-time 10% discount to an in-store order.",
      },
      {
        id: "redeem-3",
        title: "Priority Booking",
        pointsCost: 800,
        rewardType: "perk",
        value: "VIP booking",
        description: "Unlock priority reservation windows for peak seating.",
      },
    ],
    pointGenerators: [
      {
        id: "generator-1",
        name: "In-store welcome scan",
        kind: "qr",
        points: 50,
        code: "WELCOME50",
        payload: "homeplate://points/program-1/WELCOME50",
        description: "Companion app QR used at the register for first-purchase welcome points.",
        createdAt: "2026-03-11T09:00:00.000Z",
        expiresAt: "2026-04-11T23:59:59.000Z",
        redemptionCount: 14,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEEDED_MEMBERS: Array<Member & { password?: string }> = [
  {
    id: "member-1",
    username: "john.doe",
    email: "john@example.com",
    name: "John Doe",
    status: "Active",
    phone: "555-1234",
    loyaltyPoints: 2500,
    tier: "Gold",
    joinDate: "2023-01-15",
    lastVisit: "2024-03-08",
    favoriteLocation: "Downtown",
    address: "18 Market Street",
    dateOfBirth: "1990-07-11",
    notes: "Prefers in-app specials and weekend offers.",
    tags: ["vip", "weekday"],
    marketingOptIn: true,
    totalSpend: 1840,
    visits: 32,
    avatar: "",
    passwordSet: true,
    passwordUpdatedAt: "2026-03-10T14:20:00.000Z",
    companionAccessCode: "HP-JD-1024",
    password: "welcome123!",
  },
  {
    id: "member-2",
    username: "jane.smith",
    email: "jane@example.com",
    name: "Jane Smith",
    status: "Pending",
    phone: "555-5678",
    loyaltyPoints: 1200,
    tier: "Silver",
    joinDate: "2023-06-20",
    lastVisit: "2024-03-05",
    favoriteLocation: "Waterfront",
    address: "4 Beach Road",
    dateOfBirth: "1994-11-05",
    notes: "Needs onboarding follow-up for companion app.",
    tags: ["new-app"],
    marketingOptIn: false,
    totalSpend: 620,
    visits: 11,
    avatar: "",
    passwordSet: true,
    passwordUpdatedAt: "2026-03-08T10:00:00.000Z",
    companionAccessCode: "HP-JS-8842",
    password: "welcome123!",
  },
];

const SEEDED_BRANDING_CONFIGS: BrandingConfig[] = [
  {
    id: "brand-1",
    brandName: "HomePlate Main",
    primaryColor: "#dc2626",
    secondaryColor: "#7c2d12",
    accentColor: "#f59e0b",
    fontFamily: "inter",
    customDomain: "homeplate.app",
    logo: "https://via.placeholder.com/200",
    favicon: "https://via.placeholder.com/32",
  },
  {
    id: "brand-2",
    brandName: "Harbor Dining",
    primaryColor: "#0f766e",
    secondaryColor: "#164e63",
    accentColor: "#f97316",
    fontFamily: "playfair",
    customDomain: "harbor.homeplate.app",
  },
];

const SEEDED_USERS: SeedUser[] = [
  {
    id: "user-admin",
    username: "admin",
    email: "michael@homeplate.app",
    name: "Michael Brown",
    role: "admin",
    status: "Active",
    phone: "555-1000",
    title: "Platform Administrator",
    department: "Leadership",
    notes: "Owns workspace configuration and security policy.",
    password: "admin123!",
    createdAt: "2025-01-03T09:00:00.000Z",
    updatedAt: NOW,
    lastLoginAt: "2026-03-11T08:45:00.000Z",
  },
  {
    id: "user-designer",
    username: "designer",
    email: "ava@homeplate.app",
    name: "Ava Patel",
    role: "designer",
    status: "Active",
    phone: "555-1100",
    title: "Experience Designer",
    department: "Product",
    notes: "Owns app builder and whitelabel output.",
    password: "design123!",
    createdAt: "2025-01-04T09:00:00.000Z",
    updatedAt: NOW,
    lastLoginAt: "2026-03-11T07:30:00.000Z",
  },
  {
    id: "user-operator",
    username: "operator",
    email: "jordan@homeplate.app",
    name: "Jordan Kim",
    role: "operator",
    status: "Pending",
    phone: "555-1200",
    title: "Store Operator",
    department: "Operations",
    notes: "Runs menu, members, and rewards operations.",
    password: "store123!",
    createdAt: "2025-01-05T09:00:00.000Z",
    updatedAt: NOW,
  },
  {
    id: "user-analyst",
    username: "analyst",
    email: "nina@homeplate.app",
    name: "Nina Cole",
    role: "analyst",
    status: "Active",
    phone: "555-1300",
    title: "Growth Analyst",
    department: "Insights",
    notes: "Tracks revenue, loyalty, and campaign analytics.",
    password: "insight123!",
    createdAt: "2025-01-06T09:00:00.000Z",
    updatedAt: NOW,
    lastLoginAt: "2026-03-11T06:50:00.000Z",
  },
];

let initializationPromise: Promise<void> | null = null;
function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

function readJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  );
}

const TAG_COLOR_PALETTE = [
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#0f766e",
  "#dc2626",
  "#0ea5e9",
  "#16a34a",
];

function normalizeTagColor(color: string, fallbackIndex = 0) {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }

  return TAG_COLOR_PALETTE[fallbackIndex % TAG_COLOR_PALETTE.length];
}

function normalizeMemberTagDefinition(
  entry: Partial<MemberTagDefinition> | string,
  index = 0,
): MemberTagDefinition {
  const now = new Date().toISOString();
  const label = typeof entry === "string" ? entry : String(entry.label ?? "").trim();
  const slug = slugify(label || (typeof entry === "string" ? entry : entry.id ?? ""));

  return {
    id: (typeof entry === "string" ? "" : entry.id ?? "").trim() || slug || `tag-${Date.now()}-${index}`,
    label: label || slug.replace(/-/g, " ") || `Tag ${index + 1}`,
    color: normalizeTagColor(typeof entry === "string" ? "" : String(entry.color ?? ""), index),
    description: typeof entry === "string" ? "" : String(entry.description ?? "").trim(),
    createdAt: typeof entry === "string"
      ? now
      : String(entry.createdAt ?? "").trim() || now,
    updatedAt: now,
  };
}

function buildDefaultMemberTags(): MemberTagDefinition[] {
  return normalizeTags(SEEDED_MEMBERS.flatMap((member) => member.tags ?? []))
    .map((label, index) => normalizeMemberTagDefinition(label, index))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function normalizeModuleRequirements(
  requirements: Partial<AccessModuleRequirement>[] | null | undefined,
): AccessModuleRequirement[] {
  const now = new Date().toISOString();
  const defaultsByPath = new Map(
    DEFAULT_MODULE_REQUIREMENTS.map((requirement) => [requirement.path, requirement]),
  );
  const inputMap = new Map<string, Partial<AccessModuleRequirement>>();
  for (const item of Array.isArray(requirements) ? requirements : []) {
    const path = String(item.path ?? "").trim();
    if (!path) {
      continue;
    }

    inputMap.set(path, item);
  }
  const mergedInput = DEFAULT_MODULE_REQUIREMENTS.map((item) => inputMap.get(item.path) ?? item);
  for (const [path, item] of inputMap.entries()) {
    if (!defaultsByPath.has(path)) {
      mergedInput.push(item);
    }
  }
  const input = mergedInput.length > 0 ? mergedInput : DEFAULT_MODULE_REQUIREMENTS;
  const normalized = input
    .map((item) => {
      const fallback = defaultsByPath.get(String(item.path ?? "")) ?? DEFAULT_MODULE_REQUIREMENTS[0];
      const requiredPermissions = Array.isArray(item.requiredPermissions)
        ? [...new Set(item.requiredPermissions)].filter(Boolean) as PermissionId[]
        : fallback.requiredPermissions;

      return {
        path: String(item.path ?? fallback.path).trim() || fallback.path,
        title: String(item.title ?? fallback.title).trim() || fallback.title,
        description: String(item.description ?? fallback.description).trim() || fallback.description,
        requiredPermissions,
        requirementNotes: String(item.requirementNotes ?? fallback.requirementNotes ?? "").trim(),
        updatedAt: String(item.updatedAt ?? "").trim() || now,
      } satisfies AccessModuleRequirement;
    })
    .filter((item) => item.path);

  const seen = new Set<string>();
  return normalized.filter((item) => {
    if (seen.has(item.path)) {
      return false;
    }

    seen.add(item.path);
    return true;
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string, salt?: string) {
  const resolvedSalt = salt ?? randomBytes(16).toString("hex");
  const derived = scryptSync(password, resolvedSalt, 64).toString("hex");
  return `${resolvedSalt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, storedDerived] = storedHash.split(":");
  if (!salt || !storedDerived) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedDerived, "hex");
  return stored.length === candidate.length && timingSafeEqual(stored, candidate);
}

async function selectRows<T>(
  table: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  return supabaseRequest<T[]>(`${table}${buildQuery({ select: "*", ...params })}`);
}

async function selectOne<T>(
  table: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const rows = await selectRows<T>(table, { ...params, limit: 1 });
  return rows[0] ?? null;
}

async function upsertOne<T>(
  table: string,
  row: Record<string, unknown>,
  conflictKey = "id",
) {
  const rows = await supabaseRequest<T[]>(
    `${table}${buildQuery({ on_conflict: conflictKey })}`,
    {
      method: "POST",
      body: JSON.stringify([row]),
      prefer: ["resolution=merge-duplicates", "return=representation"],
    },
  );

  return rows[0] ?? null;
}

async function insertOne<T>(table: string, row: Record<string, unknown>) {
  const rows = await supabaseRequest<T[]>(table, {
    method: "POST",
    body: JSON.stringify([row]),
    prefer: ["return=representation"],
  });

  return rows[0] ?? null;
}

async function patchRows<T>(
  table: string,
  filters: Record<string, string | number | boolean | undefined>,
  patch: Record<string, unknown>,
) {
  return supabaseRequest<T[]>(`${table}${buildQuery(filters)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    prefer: ["return=representation"],
  });
}

async function deleteRows<T>(
  table: string,
  filters: Record<string, string | number | boolean | undefined>,
) {
  return supabaseRequest<T[]>(`${table}${buildQuery(filters)}`, {
    method: "DELETE",
    prefer: ["return=representation"],
  });
}

function cloneDefaultRoles() {
  return DEFAULT_ACCESS_ROLES.map((role) => ({
    ...role,
    permissions: [...role.permissions],
  }));
}

function mapMenuRow(row: MenuRow): Menu {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    items: readJson(row.items_json, []),
    specials: readJson(row.specials_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRewardProgramRow(row: RewardProgramRow): RewardProgram {
  return {
    id: row.id,
    name: row.name,
    pointsPerDollar: toNumber(row.points_per_dollar),
    tiers: readJson(row.tiers_json, []),
    redemptions: readJson(row.redemptions_json, []),
    pointGenerators: readJson(row.point_generators_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    status: row.status,
    phone: row.phone ?? undefined,
    loyaltyPoints: toNumber(row.loyalty_points),
    tier: row.tier,
    joinDate: row.join_date,
    lastVisit: row.last_visit ?? undefined,
    favoriteLocation: row.favorite_location ?? undefined,
    address: row.address ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    notes: row.notes ?? undefined,
    tags: normalizeTags(readJson(row.tags_json, [])),
    marketingOptIn: Boolean(row.marketing_opt_in),
    totalSpend: toNumber(row.total_spend),
    visits: toNumber(row.visits),
    avatar: row.avatar ?? undefined,
    passwordSet: Boolean(row.password_hash),
    passwordUpdatedAt: row.password_updated_at ?? undefined,
    companionAccessCode: row.companion_access_code ?? undefined,
  };
}

function mapBrandingRow(row: BrandingRow): BrandingConfig {
  return {
    id: row.id,
    brandName: row.brand_name,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    logo: row.logo ?? undefined,
    favicon: row.favicon ?? undefined,
    customDomain: row.custom_domain ?? undefined,
    fontFamily: row.font_family,
  };
}

function decorateUser(row: UserRow, roles: AccessRole[]): User {
  const role = roles.find((entry) => entry.id === row.role);

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    roleName: role?.name ?? row.role,
    roleColor: role?.color,
    permissions: role?.permissions ?? [],
    status: row.status,
    phone: row.phone ?? undefined,
    title: row.title ?? undefined,
    department: row.department ?? undefined,
    notes: row.notes ?? undefined,
    avatar: row.avatar ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

async function readOptionalConfigRaw<T>(key: string) {
  const row = await selectOne<ConfigRow>("config_store", {
    key: `eq.${key}`,
  });

  return row ? readJson<T | null>(row.value_json, null) : null;
}

async function readConfigRaw<T>(key: string, fallback: T) {
  const value = await readOptionalConfigRaw<T>(key);
  return value ?? fallback;
}

async function writeConfigRaw<T>(key: string, value: T) {
  const row = await upsertOne<ConfigRow>(
    "config_store",
    {
      key,
      value_json: value,
      updated_at: new Date().toISOString(),
    },
    "key",
  );

  return row ? readJson<T>(row.value_json, value) : value;
}

async function listMenuRowsRaw() {
  return selectRows<MenuRow>("menus", {
    order: "updated_at.desc",
  });
}

async function getMenuRowRaw(id: string) {
  return selectOne<MenuRow>("menus", {
    id: `eq.${id}`,
  });
}

async function saveMenuRaw(menu: Menu) {
  const now = new Date().toISOString();
  const payload = {
    id: menu.id,
    name: menu.name,
    location: menu.location,
    items_json: menu.items ?? [],
    specials_json: menu.specials ?? [],
    created_at: menu.createdAt || now,
    updated_at: menu.updatedAt || now,
  };

  const row = await upsertOne<MenuRow>("menus", payload);
  return row ? mapMenuRow(row) : mapMenuRow(payload as MenuRow);
}

async function deleteMenuRaw(id: string) {
  const rows = await deleteRows<MenuRow>("menus", {
    id: `eq.${id}`,
  });

  return rows[0] ? mapMenuRow(rows[0]) : null;
}

async function listRewardProgramRowsRaw() {
  return selectRows<RewardProgramRow>("reward_programs", {
    order: "updated_at.desc",
  });
}

async function getRewardProgramRowRaw(id: string) {
  return selectOne<RewardProgramRow>("reward_programs", {
    id: `eq.${id}`,
  });
}

async function saveRewardProgramRaw(program: RewardProgram) {
  const now = new Date().toISOString();
  const payload = {
    id: program.id,
    name: program.name,
    points_per_dollar: program.pointsPerDollar,
    tiers_json: program.tiers ?? [],
    redemptions_json: program.redemptions ?? [],
    point_generators_json: program.pointGenerators ?? [],
    created_at: program.createdAt || now,
    updated_at: program.updatedAt || now,
  };

  const row = await upsertOne<RewardProgramRow>("reward_programs", payload);
  return row ? mapRewardProgramRow(row) : mapRewardProgramRow(payload as RewardProgramRow);
}

async function deleteRewardProgramRaw(id: string) {
  const rows = await deleteRows<RewardProgramRow>("reward_programs", {
    id: `eq.${id}`,
  });

  return rows[0] ? mapRewardProgramRow(rows[0]) : null;
}

async function listMemberRowsRaw() {
  return selectRows<MemberRow>("members", {
    order: "name.asc",
  });
}

async function getMemberRowRaw(id: string) {
  return selectOne<MemberRow>("members", {
    id: `eq.${id}`,
  });
}

async function saveMemberRaw(
  member: Omit<Member, "passwordSet"> & { passwordUpdatedAt?: string },
  password?: string,
) {
  const existing = await getMemberRowRaw(member.id);
  const allMembers = await listMemberRowsRaw();
  const duplicateMember = allMembers.find((entry) => {
    if (entry.id === member.id) {
      return false;
    }

    return (
      normalizeLogin(entry.username) === normalizeLogin(member.username) ||
      normalizeLogin(entry.email) === normalizeLogin(member.email)
    );
  });

  if (duplicateMember) {
    throw new Error("Member username or email already exists.");
  }

  const now = new Date().toISOString();
  const nextPasswordHash =
    typeof password === "string"
      ? hashPassword(password)
      : (existing?.password_hash ?? null);

  const payload = {
    id: member.id,
    username: member.username.trim(),
    email: member.email.trim(),
    name: member.name.trim(),
    status: member.status,
    phone: member.phone?.trim() || null,
    loyalty_points: toNumber(member.loyaltyPoints),
    tier: member.tier.trim() || "Bronze",
    join_date: member.joinDate,
    last_visit: member.lastVisit?.trim() || null,
    favorite_location: member.favoriteLocation?.trim() || null,
    address: member.address?.trim() || null,
    date_of_birth: member.dateOfBirth?.trim() || null,
    notes: member.notes?.trim() || null,
    tags_json: normalizeTags(member.tags ?? []),
    marketing_opt_in: Boolean(member.marketingOptIn),
    total_spend: toNumber(member.totalSpend),
    visits: toNumber(member.visits),
    avatar: member.avatar?.trim() || null,
    password_hash: nextPasswordHash,
    password_updated_at:
      typeof password === "string"
        ? now
        : (member.passwordUpdatedAt ?? existing?.password_updated_at ?? null),
    companion_access_code: member.companionAccessCode?.trim() || null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  const row = await upsertOne<MemberRow>("members", payload);
  return row ? mapMemberRow(row) : mapMemberRow(payload as MemberRow);
}

async function deleteMemberRaw(id: string) {
  const rows = await deleteRows<MemberRow>("members", {
    id: `eq.${id}`,
  });

  return rows[0] ? mapMemberRow(rows[0]) : null;
}

async function listBrandingRowsRaw() {
  return selectRows<BrandingRow>("branding_configs", {
    order: "brand_name.asc",
  });
}

async function getBrandingRowRaw(id: string) {
  return selectOne<BrandingRow>("branding_configs", {
    id: `eq.${id}`,
  });
}

async function saveBrandingRaw(config: BrandingConfig) {
  const payload = {
    id: config.id,
    brand_name: config.brandName,
    primary_color: config.primaryColor,
    secondary_color: config.secondaryColor,
    accent_color: config.accentColor,
    logo: config.logo?.trim() || null,
    favicon: config.favicon?.trim() || null,
    custom_domain: config.customDomain?.trim() || null,
    font_family: config.fontFamily,
  };

  const row = await upsertOne<BrandingRow>("branding_configs", payload);
  return row ? mapBrandingRow(row) : mapBrandingRow(payload as BrandingRow);
}

async function deleteBrandingRaw(id: string) {
  const rows = await deleteRows<BrandingRow>("branding_configs", {
    id: `eq.${id}`,
  });

  return rows[0] ? mapBrandingRow(rows[0]) : null;
}

async function listUserRowsRaw() {
  return selectRows<UserRow>("users", {
    order: "created_at.asc",
  });
}

async function getUserRowByIdRaw(id: string) {
  return selectOne<UserRow>("users", {
    id: `eq.${id}`,
  });
}

async function ensureRoleExistsRaw(roleId: string) {
  const roles = await listAccessRolesRaw();
  if (!roles.some((role) => role.id === roleId)) {
    throw new Error("Selected role does not exist.");
  }
}

async function saveUserRaw(user: User, password?: string) {
  const existing = await getUserRowByIdRaw(user.id);
  const allUsers = await listUserRowsRaw();
  const duplicateUser = allUsers.find((entry) => {
    if (entry.id === user.id) {
      return false;
    }

    return (
      normalizeLogin(entry.username) === normalizeLogin(user.username) ||
      normalizeLogin(entry.email) === normalizeLogin(user.email)
    );
  });

  if (duplicateUser) {
    throw new Error("User username or email already exists.");
  }

  await ensureRoleExistsRaw(user.role);

  const now = new Date().toISOString();
  const payload = {
    id: user.id,
    username: user.username.trim(),
    email: user.email.trim(),
    name: user.name.trim(),
    role: user.role,
    status: user.status,
    phone: user.phone?.trim() || null,
    title: user.title?.trim() || null,
    department: user.department?.trim() || null,
    notes: user.notes?.trim() || null,
    avatar: user.avatar?.trim() || null,
    password_hash:
      typeof password === "string"
        ? hashPassword(password)
        : (existing?.password_hash ?? hashPassword(randomBytes(12).toString("hex"))),
    last_login_at: user.lastLoginAt ?? existing?.last_login_at ?? null,
    created_at: user.createdAt || existing?.created_at || now,
    updated_at: user.updatedAt || now,
  };

  const row = await upsertOne<UserRow>("users", payload);
  const roles = await listAccessRolesRaw();
  return row ? decorateUser(row, roles) : decorateUser(payload as UserRow, roles);
}

async function deleteUserRaw(id: string) {
  const roles = await listAccessRolesRaw();
  const deletedUsers = await deleteRows<UserRow>("users", {
    id: `eq.${id}`,
  });

  await deleteRows<SessionRow>("auth_sessions", {
    user_id: `eq.${id}`,
  });

  return deletedUsers[0] ? decorateUser(deletedUsers[0], roles) : null;
}

async function getSessionRowRaw(token: string) {
  return selectOne<SessionRow>("auth_sessions", {
    token_hash: `eq.${hashToken(token)}`,
  });
}

async function deleteSessionRowsByHashRaw(tokenHash: string) {
  await deleteRows<SessionRow>("auth_sessions", {
    token_hash: `eq.${tokenHash}`,
  });
}

async function listAccessRolesRaw() {
  const roles = await readConfigRaw<AccessRole[]>(CONFIG_KEYS.accessRoles, []);

  return [...roles].sort((left, right) => {
    if (left.isSystem !== right.isSystem) {
      return left.isSystem ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

async function writeAccessRolesRaw(roles: AccessRole[]) {
  return writeConfigRaw(CONFIG_KEYS.accessRoles, roles);
}

async function listMemberTagsRaw() {
  const tags = await readConfigRaw<MemberTagDefinition[]>(CONFIG_KEYS.memberTags, []);
  return tags
    .map((tag, index) => normalizeMemberTagDefinition(tag, index))
    .sort((left, right) => left.label.localeCompare(right.label));
}

async function writeMemberTagsRaw(tags: MemberTagDefinition[]) {
  const nextTags = tags
    .map((tag, index) => normalizeMemberTagDefinition(tag, index))
    .sort((left, right) => left.label.localeCompare(right.label));
  return writeConfigRaw(CONFIG_KEYS.memberTags, nextTags);
}

async function listModuleRequirementsRaw() {
  const requirements = await readConfigRaw<AccessModuleRequirement[]>(
    CONFIG_KEYS.moduleRequirements,
    DEFAULT_MODULE_REQUIREMENTS,
  );
  return normalizeModuleRequirements(requirements);
}

async function writeModuleRequirementsRaw(requirements: AccessModuleRequirement[]) {
  return writeConfigRaw(CONFIG_KEYS.moduleRequirements, normalizeModuleRequirements(requirements));
}

async function seedDefaults() {
  const roles = await readOptionalConfigRaw<AccessRole[]>(CONFIG_KEYS.accessRoles);
  if (!roles || roles.length === 0) {
    await writeAccessRolesRaw(cloneDefaultRoles());
  }

  const siteBrand = await readOptionalConfigRaw<SiteBrandConfig>(CONFIG_KEYS.siteBrand);
  if (!siteBrand) {
    await writeConfigRaw(CONFIG_KEYS.siteBrand, DEFAULT_SITE_BRAND);
  }

  const memberTags = await readOptionalConfigRaw<MemberTagDefinition[]>(CONFIG_KEYS.memberTags);
  if (!memberTags || memberTags.length === 0) {
    await writeMemberTagsRaw(buildDefaultMemberTags());
  }

  const moduleRequirements = await readOptionalConfigRaw<AccessModuleRequirement[]>(
    CONFIG_KEYS.moduleRequirements,
  );
  if (!moduleRequirements || moduleRequirements.length === 0) {
    await writeModuleRequirementsRaw(DEFAULT_MODULE_REQUIREMENTS);
  }

  if ((await listMenuRowsRaw()).length === 0) {
    for (const menu of SEEDED_MENUS) {
      await saveMenuRaw(menu);
    }
  }

  if ((await listRewardProgramRowsRaw()).length === 0) {
    for (const program of SEEDED_REWARDS) {
      await saveRewardProgramRaw(program);
    }
  }

  if ((await listMemberRowsRaw()).length === 0) {
    for (const member of SEEDED_MEMBERS) {
      const { password, passwordSet: _passwordSet, ...nextMember } = member;
      await saveMemberRaw(nextMember, password);
    }
  }

  if ((await listBrandingRowsRaw()).length === 0) {
    for (const config of SEEDED_BRANDING_CONFIGS) {
      await saveBrandingRaw(config);
    }
  }

  if ((await listUserRowsRaw()).length === 0) {
    for (const seededUser of SEEDED_USERS) {
      await saveUserRaw(
        {
          id: seededUser.id,
          username: seededUser.username,
          email: seededUser.email,
          name: seededUser.name,
          role: seededUser.role,
          roleName: "",
          permissions: [],
          status: seededUser.status,
          phone: seededUser.phone,
          title: seededUser.title,
          department: seededUser.department,
          notes: seededUser.notes,
          avatar: seededUser.avatar,
          lastLoginAt: seededUser.lastLoginAt,
          createdAt: seededUser.createdAt,
          updatedAt: seededUser.updatedAt,
        },
        seededUser.password,
      );
    }
  }
}
export function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      assertSupabaseConfigured();
      await seedDefaults();
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

export async function listAccessRoles() {
  await initializeDatabase();
  return listAccessRolesRaw();
}

export async function getAccessRole(id: string) {
  await initializeDatabase();
  const roles = await listAccessRolesRaw();
  return roles.find((role) => role.id === id) ?? null;
}

export async function saveAccessRole(role: AccessRole) {
  await initializeDatabase();
  const roles = await listAccessRolesRaw();
  const nextId = role.id || slugify(role.name) || `role-${Date.now()}`;
  const nextRole: AccessRole = {
    ...role,
    id: nextId,
    name: role.name.trim(),
    description: role.description.trim(),
    color: role.color.trim() || "#2563eb",
    permissions: [...new Set(role.permissions)] as PermissionId[],
    updatedAt: role.updatedAt || new Date().toISOString(),
  };

  const duplicate = roles.find((entry) => {
    if (entry.id === nextRole.id) {
      return false;
    }

    return slugify(entry.name) === slugify(nextRole.name);
  });

  if (duplicate) {
    throw new Error("A role with that name already exists.");
  }

  const nextRoles = roles.some((entry) => entry.id === nextRole.id)
    ? roles.map((entry) => (entry.id === nextRole.id ? nextRole : entry))
    : [...roles, nextRole];

  await writeAccessRolesRaw(nextRoles);
  return nextRole;
}

export async function deleteAccessRole(id: string) {
  await initializeDatabase();
  const roles = await listAccessRolesRaw();
  const target = roles.find((role) => role.id === id);

  if (!target) {
    return null;
  }

  if (target.isSystem) {
    throw new Error("System roles cannot be deleted.");
  }

  const users = await listUsers();
  if (users.some((user) => user.role === id)) {
    throw new Error("Reassign users before deleting this role.");
  }

  const nextRoles = roles.filter((role) => role.id !== id);
  await writeAccessRolesRaw(nextRoles);
  return target;
}

export async function listMenus() {
  await initializeDatabase();
  const rows = await listMenuRowsRaw();
  return rows.map(mapMenuRow);
}

export async function getMenu(id: string) {
  await initializeDatabase();
  const row = await getMenuRowRaw(id);
  return row ? mapMenuRow(row) : null;
}

export async function saveMenu(menu: Menu) {
  await initializeDatabase();
  return saveMenuRaw(menu);
}

export async function deleteMenuRecord(id: string) {
  await initializeDatabase();
  return deleteMenuRaw(id);
}

export async function listRewardPrograms() {
  await initializeDatabase();
  const rows = await listRewardProgramRowsRaw();
  return rows.map(mapRewardProgramRow);
}

export async function getRewardProgram(id: string) {
  await initializeDatabase();
  const row = await getRewardProgramRowRaw(id);
  return row ? mapRewardProgramRow(row) : null;
}

export async function saveRewardProgram(program: RewardProgram) {
  await initializeDatabase();
  return saveRewardProgramRaw(program);
}

export async function deleteRewardProgramRecord(id: string) {
  await initializeDatabase();
  return deleteRewardProgramRaw(id);
}

export async function listMembers() {
  await initializeDatabase();
  const rows = await listMemberRowsRaw();
  return rows.map(mapMemberRow);
}

export async function getMembersPage(page: number, limit: number) {
  await initializeDatabase();
  const members = await listMembers();
  const total = members.length;
  const offset = Math.max(0, (page - 1) * limit);
  return {
    data: members.slice(offset, offset + limit),
    total,
    page,
    limit,
  };
}

export async function getMember(id: string) {
  await initializeDatabase();
  const row = await getMemberRowRaw(id);
  return row ? mapMemberRow(row) : null;
}

export async function saveMember(
  member: Omit<Member, "passwordSet"> & { passwordUpdatedAt?: string },
  password?: string,
) {
  await initializeDatabase();
  return saveMemberRaw(member, password);
}

export async function deleteMemberRecord(id: string) {
  await initializeDatabase();
  return deleteMemberRaw(id);
}

export async function listMemberTags() {
  await initializeDatabase();
  return listMemberTagsRaw();
}

export async function setMemberTags(tags: MemberTagDefinition[]) {
  await initializeDatabase();
  return writeMemberTagsRaw(tags);
}

export async function listBrandingConfigs() {
  await initializeDatabase();
  const rows = await listBrandingRowsRaw();
  return rows.map(mapBrandingRow);
}

export async function getBrandingConfig(id: string) {
  await initializeDatabase();
  const row = await getBrandingRowRaw(id);
  return row ? mapBrandingRow(row) : null;
}

export async function saveBrandingConfig(config: BrandingConfig) {
  await initializeDatabase();
  return saveBrandingRaw(config);
}

export async function deleteBrandingConfigRecord(id: string) {
  await initializeDatabase();
  return deleteBrandingRaw(id);
}

export async function listUsers() {
  await initializeDatabase();
  const [rows, roles] = await Promise.all([listUserRowsRaw(), listAccessRolesRaw()]);
  return rows.map((row) => decorateUser(row, roles));
}

export async function getUserById(id: string) {
  await initializeDatabase();
  const [row, roles] = await Promise.all([getUserRowByIdRaw(id), listAccessRolesRaw()]);
  return row ? decorateUser(row, roles) : null;
}

export async function saveUser(user: User, password?: string) {
  await initializeDatabase();
  return saveUserRaw(user, password);
}

export async function authenticateUser(login: string, password: string) {
  await initializeDatabase();
  const normalizedLogin = normalizeLogin(login);
  const rows = await listUserRowsRaw();
  const row = rows.find((entry) => {
    return (
      normalizeLogin(entry.username) === normalizedLogin ||
      normalizeLogin(entry.email) === normalizedLogin
    );
  });

  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  const lastLoginAt = new Date().toISOString();
  const updatedRows = await patchRows<UserRow>(
    "users",
    { id: `eq.${row.id}` },
    {
      last_login_at: lastLoginAt,
      updated_at: lastLoginAt,
    },
  );
  const nextRow = updatedRows[0] ?? { ...row, last_login_at: lastLoginAt, updated_at: lastLoginAt };
  const roles = await listAccessRolesRaw();
  return decorateUser(nextRow, roles);
}

export async function deleteUserRecord(id: string) {
  await initializeDatabase();
  return deleteUserRaw(id);
}

export async function createAuthSession(userId: string) {
  await initializeDatabase();
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await insertOne<SessionRow>("auth_sessions", {
    token_hash: hashToken(token),
    user_id: userId,
    expires_at: expiresAt,
    created_at: now,
  });

  return {
    token,
    expiresAt,
  };
}

export async function getUserBySessionToken(token: string) {
  await initializeDatabase();
  const session = await getSessionRowRaw(token);

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await deleteSessionRowsByHashRaw(session.token_hash);
    return null;
  }

  const [userRow, roles] = await Promise.all([
    getUserRowByIdRaw(session.user_id),
    listAccessRolesRaw(),
  ]);

  return userRow ? decorateUser(userRow, roles) : null;
}

export async function deleteAuthSession(token: string) {
  await initializeDatabase();
  await deleteSessionRowsByHashRaw(hashToken(token));
}

export async function getPermissionsForRole(roleId: string) {
  await initializeDatabase();
  const role = await getAccessRole(roleId);
  return role?.permissions ?? [];
}

export async function getModuleRequirementsConfig() {
  await initializeDatabase();
  return listModuleRequirementsRaw();
}

export async function setModuleRequirementsConfig(requirements: AccessModuleRequirement[]) {
  await initializeDatabase();
  return writeModuleRequirementsRaw(requirements);
}

export async function getSiteBrandConfig() {
  await initializeDatabase();
  return readConfigRaw(CONFIG_KEYS.siteBrand, DEFAULT_SITE_BRAND);
}

export async function setSiteBrandConfig(config: SiteBrandConfig) {
  await initializeDatabase();
  return writeConfigRaw(CONFIG_KEYS.siteBrand, config);
}

export async function getBuilderAppsConfig() {
  await initializeDatabase();
  return readOptionalConfigRaw<BuilderPersistedApp[]>(CONFIG_KEYS.builderApps);
}

export async function setBuilderAppsConfig(apps: BuilderPersistedApp[]) {
  await initializeDatabase();
  return writeConfigRaw(CONFIG_KEYS.builderApps, apps);
}

export async function getDashboardPreferences(userKey: string) {
  await initializeDatabase();
  return readOptionalConfigRaw<DashboardPreferencesConfig>(`dashboard:${userKey}`);
}

export async function setDashboardPreferences(
  userKey: string,
  config: DashboardPreferencesConfig,
) {
  await initializeDatabase();
  return writeConfigRaw(`dashboard:${userKey}`, config);
}
