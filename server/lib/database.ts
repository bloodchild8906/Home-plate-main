import { mkdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  type BrandingConfig,
  type BuilderPersistedApp,
  type DashboardPreferencesConfig,
  type Member,
  type Menu,
  type Role,
  type RewardProgram,
  type SiteBrandConfig,
  type User,
  type UserStatus,
} from "@shared/api";

type MenuRow = {
  id: string;
  name: string;
  location: string;
  items_json: string;
  created_at: string;
  updated_at: string;
};

type RewardRow = {
  id: string;
  name: string;
  points_per_dollar: number;
  tiers_json: string;
  redemptions_json: string;
  created_at: string;
  updated_at: string;
};

type MemberRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  loyalty_points: number;
  tier: string;
  join_date: string;
  last_visit: string | null;
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
  password_hash: string;
  created_at: string;
};

type SessionRow = {
  token_hash: string;
  user_id: string;
  expires_at: string;
};

const DATABASE_PATH = resolve(process.cwd(), "data", "homeplate.sqlite");

const DEFAULT_SITE_BRAND: SiteBrandConfig = {
  name: "HomePlate",
  tagline: "Restaurant app platform",
  logo: "HP",
  logoImage: "",
  faviconImage: "",
  primary: "#ea580c",
  secondary: "#0f172a",
  accent: "#f59e0b",
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
      },
      {
        id: "item-2",
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with house-made dressing",
        price: 9.99,
        category: "Salads",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
        description: "Get 10% discount + free item",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEEDED_MEMBERS: Member[] = [
  {
    id: "member-1",
    email: "john@example.com",
    name: "John Doe",
    phone: "555-1234",
    loyaltyPoints: 2500,
    tier: "Gold",
    joinDate: "2023-01-15",
    lastVisit: "2024-03-08",
  },
  {
    id: "member-2",
    email: "jane@example.com",
    name: "Jane Smith",
    phone: "555-5678",
    loyaltyPoints: 1200,
    tier: "Silver",
    joinDate: "2023-06-20",
    lastVisit: "2024-03-05",
  },
];

const SEEDED_BRANDING_CONFIGS: BrandingConfig[] = [
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

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

const SEEDED_USERS: Array<{
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  password: string;
  createdAt: string;
}> = [
  {
    id: "user-admin",
    username: "admin",
    email: "michael@homeplate.app",
    name: "Michael Brown",
    role: "admin",
    status: "Active",
    password: "admin123!",
    createdAt: "2025-01-03T09:00:00.000Z",
  },
  {
    id: "user-designer",
    username: "designer",
    email: "ava@homeplate.app",
    name: "Ava Patel",
    role: "designer",
    status: "Active",
    password: "design123!",
    createdAt: "2025-01-04T09:00:00.000Z",
  },
  {
    id: "user-operator",
    username: "operator",
    email: "jordan@homeplate.app",
    name: "Jordan Kim",
    role: "operator",
    status: "Pending",
    password: "store123!",
    createdAt: "2025-01-05T09:00:00.000Z",
  },
  {
    id: "user-analyst",
    username: "analyst",
    email: "nina@homeplate.app",
    name: "Nina Cole",
    role: "analyst",
    status: "Active",
    password: "insight123!",
    createdAt: "2025-01-06T09:00:00.000Z",
  },
];

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const database = new DatabaseSync(DATABASE_PATH);
database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS config_store (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reward_programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points_per_dollar REAL NOT NULL,
    tiers_json TEXT NOT NULL,
    redemptions_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    loyalty_points INTEGER NOT NULL,
    tier TEXT NOT NULL,
    join_date TEXT NOT NULL,
    last_visit TEXT
  );
  CREATE TABLE IF NOT EXISTS branding_configs (
    id TEXT PRIMARY KEY,
    brand_name TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    secondary_color TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    logo TEXT,
    favicon TEXT,
    custom_domain TEXT,
    font_family TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function upsertConfig<T>(key: string, value: T) {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO config_store (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(value), now);

  return value;
}

function getConfig<T>(key: string, fallback: T): T {
  const row = database
    .prepare("SELECT value_json FROM config_store WHERE key = ?")
    .get(key) as { value_json: string } | undefined;

  return row ? parseJson<T>(row.value_json, fallback) : fallback;
}

function getOptionalConfig<T>(key: string) {
  const row = database
    .prepare("SELECT value_json FROM config_store WHERE key = ?")
    .get(key) as { value_json: string } | undefined;

  return row ? parseJson<T | null>(row.value_json, null) : null;
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

function seedIfEmpty(tableName: string, action: () => void) {
  const row = database
    .prepare(`SELECT COUNT(*) as total FROM ${tableName}`)
    .get() as { total: number };

  if (row.total === 0) {
    action();
  }
}

function mapMenuRow(row: MenuRow): Menu {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    items: parseJson(row.items_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRewardRow(row: RewardRow): RewardProgram {
  return {
    id: row.id,
    name: row.name,
    pointsPerDollar: row.points_per_dollar,
    tiers: parseJson(row.tiers_json, []),
    redemptions: parseJson(row.redemptions_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMemberRow(row: MemberRow): Member {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    loyaltyPoints: row.loyalty_points,
    tier: row.tier,
    joinDate: row.join_date,
    lastVisit: row.last_visit ?? undefined,
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

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function initializeDatabase() {
  seedIfEmpty("menus", () => {
    for (const menu of SEEDED_MENUS) saveMenu(menu);
  });
  seedIfEmpty("reward_programs", () => {
    for (const reward of SEEDED_REWARDS) saveRewardProgram(reward);
  });
  seedIfEmpty("members", () => {
    for (const member of SEEDED_MEMBERS) saveMember(member);
  });
  seedIfEmpty("branding_configs", () => {
    for (const config of SEEDED_BRANDING_CONFIGS) saveBrandingConfig(config);
  });
  seedIfEmpty("users", () => {
    for (const user of SEEDED_USERS) {
      saveUser({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      }, user.password);
    }
  });

  if (!getOptionalConfig<SiteBrandConfig>("site_brand")) {
    upsertConfig("site_brand", DEFAULT_SITE_BRAND);
  }
}

export function listMenus() {
  return (database
    .prepare("SELECT * FROM menus ORDER BY updated_at DESC")
    .all() as MenuRow[]).map(mapMenuRow);
}

export function getMenu(id: string) {
  const row = database.prepare("SELECT * FROM menus WHERE id = ?").get(id) as MenuRow | undefined;
  return row ? mapMenuRow(row) : null;
}

export function saveMenu(menu: Menu) {
  database
    .prepare(
      `INSERT INTO menus (id, name, location, items_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, location = excluded.location, items_json = excluded.items_json, created_at = excluded.created_at, updated_at = excluded.updated_at`,
    )
    .run(menu.id, menu.name, menu.location, JSON.stringify(menu.items ?? []), menu.createdAt, menu.updatedAt);
  return menu;
}

export function deleteMenuRecord(id: string) {
  const existing = getMenu(id);
  if (!existing) return null;
  database.prepare("DELETE FROM menus WHERE id = ?").run(id);
  return existing;
}

export function listRewardPrograms() {
  return (database
    .prepare("SELECT * FROM reward_programs ORDER BY updated_at DESC")
    .all() as RewardRow[]).map(mapRewardRow);
}

export function getRewardProgram(id: string) {
  const row = database
    .prepare("SELECT * FROM reward_programs WHERE id = ?")
    .get(id) as RewardRow | undefined;
  return row ? mapRewardRow(row) : null;
}

export function saveRewardProgram(program: RewardProgram) {
  database
    .prepare(
      `INSERT INTO reward_programs (id, name, points_per_dollar, tiers_json, redemptions_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, points_per_dollar = excluded.points_per_dollar, tiers_json = excluded.tiers_json, redemptions_json = excluded.redemptions_json, created_at = excluded.created_at, updated_at = excluded.updated_at`,
    )
    .run(
      program.id,
      program.name,
      program.pointsPerDollar,
      JSON.stringify(program.tiers ?? []),
      JSON.stringify(program.redemptions ?? []),
      program.createdAt,
      program.updatedAt,
    );
  return program;
}

export function deleteRewardProgramRecord(id: string) {
  const existing = getRewardProgram(id);
  if (!existing) return null;
  database.prepare("DELETE FROM reward_programs WHERE id = ?").run(id);
  return existing;
}

export function listMembers() {
  return (database
    .prepare("SELECT * FROM members ORDER BY name COLLATE NOCASE ASC")
    .all() as MemberRow[]).map(mapMemberRow);
}

export function getMembersPage(page: number, limit: number) {
  const total = (database.prepare("SELECT COUNT(*) as total FROM members").get() as { total: number }).total;
  const offset = Math.max(0, (page - 1) * limit);
  const rows = database
    .prepare("SELECT * FROM members ORDER BY name COLLATE NOCASE ASC LIMIT ? OFFSET ?")
    .all(limit, offset) as MemberRow[];

  return { data: rows.map(mapMemberRow), total, page, limit };
}

export function getMember(id: string) {
  const row = database.prepare("SELECT * FROM members WHERE id = ?").get(id) as MemberRow | undefined;
  return row ? mapMemberRow(row) : null;
}

export function saveMember(member: Member) {
  database
    .prepare(
      `INSERT INTO members (id, email, name, phone, loyalty_points, tier, join_date, last_visit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, phone = excluded.phone, loyalty_points = excluded.loyalty_points, tier = excluded.tier, join_date = excluded.join_date, last_visit = excluded.last_visit`,
    )
    .run(
      member.id,
      member.email,
      member.name,
      member.phone ?? null,
      member.loyaltyPoints,
      member.tier,
      member.joinDate,
      member.lastVisit ?? null,
    );
  return member;
}

export function deleteMemberRecord(id: string) {
  const existing = getMember(id);
  if (!existing) return null;
  database.prepare("DELETE FROM members WHERE id = ?").run(id);
  return existing;
}

export function listBrandingConfigs() {
  return (database
    .prepare("SELECT * FROM branding_configs ORDER BY brand_name COLLATE NOCASE ASC")
    .all() as BrandingRow[]).map(mapBrandingRow);
}

export function getBrandingConfig(id: string) {
  const row = database
    .prepare("SELECT * FROM branding_configs WHERE id = ?")
    .get(id) as BrandingRow | undefined;
  return row ? mapBrandingRow(row) : null;
}

export function saveBrandingConfig(config: BrandingConfig) {
  database
    .prepare(
      `INSERT INTO branding_configs (id, brand_name, primary_color, secondary_color, accent_color, logo, favicon, custom_domain, font_family)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET brand_name = excluded.brand_name, primary_color = excluded.primary_color, secondary_color = excluded.secondary_color, accent_color = excluded.accent_color, logo = excluded.logo, favicon = excluded.favicon, custom_domain = excluded.custom_domain, font_family = excluded.font_family`,
    )
    .run(
      config.id,
      config.brandName,
      config.primaryColor,
      config.secondaryColor,
      config.accentColor,
      config.logo ?? null,
      config.favicon ?? null,
      config.customDomain ?? null,
      config.fontFamily,
    );
  return config;
}

export function deleteBrandingConfigRecord(id: string) {
  const existing = getBrandingConfig(id);
  if (!existing) return null;
  database.prepare("DELETE FROM branding_configs WHERE id = ?").run(id);
  return existing;
}

export function listUsers() {
  return (database
    .prepare("SELECT * FROM users ORDER BY created_at ASC")
    .all() as UserRow[]).map(mapUserRow);
}

export function getUserById(id: string) {
  const row = database.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? mapUserRow(row) : null;
}

function getUserRowByLogin(login: string) {
  return database
    .prepare(
      "SELECT * FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)",
    )
    .get(login, login) as UserRow | undefined;
}

export function saveUser(user: User, password?: string) {
  const existing = database
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as { password_hash: string } | undefined;
  const passwordHash = password
    ? hashPassword(password)
    : existing?.password_hash ?? hashPassword(randomBytes(12).toString("hex"));

  database
    .prepare(
      `INSERT INTO users (id, username, email, name, role, status, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username = excluded.username, email = excluded.email, name = excluded.name, role = excluded.role, status = excluded.status, password_hash = excluded.password_hash, created_at = excluded.created_at`,
    )
    .run(
      user.id,
      user.username,
      user.email,
      user.name,
      user.role,
      user.status,
      passwordHash,
      user.createdAt,
    );

  return user;
}

export function authenticateUser(login: string, password: string) {
  const row = getUserRowByLogin(login.trim());
  if (!row) {
    return null;
  }

  return verifyPassword(password, row.password_hash) ? mapUserRow(row) : null;
}

export function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  database
    .prepare(
      `INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(hashToken(token), userId, expiresAt, now);

  return {
    token,
    expiresAt,
  };
}

export function getUserBySessionToken(token: string) {
  const row = database
    .prepare(
      `SELECT u.*
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as UserRow | undefined;

  const session = database
    .prepare("SELECT expires_at FROM auth_sessions WHERE token_hash = ?")
    .get(hashToken(token)) as SessionRow | undefined;

  if (!row || !session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    database.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }

  return mapUserRow(row);
}

export function deleteAuthSession(token: string) {
  database.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashToken(token));
}

export function getSiteBrandConfig() {
  return getConfig("site_brand", DEFAULT_SITE_BRAND);
}

export function setSiteBrandConfig(config: SiteBrandConfig) {
  return upsertConfig("site_brand", config);
}

export function getBuilderAppsConfig() {
  return getOptionalConfig<BuilderPersistedApp[]>("builder_apps");
}

export function setBuilderAppsConfig(apps: BuilderPersistedApp[]) {
  return upsertConfig("builder_apps", apps);
}

export function getDashboardPreferences(userKey: string) {
  return getOptionalConfig<DashboardPreferencesConfig>(`dashboard:${userKey}`);
}

export function setDashboardPreferences(userKey: string, config: DashboardPreferencesConfig) {
  return upsertConfig(`dashboard:${userKey}`, config);
}
