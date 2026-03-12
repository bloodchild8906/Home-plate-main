import type {
  AccessRole,
  AnalyticsSummary,
  ApiResponse,
  AuthToken,
  BuilderPersistedApp,
  BuilderServerApiEndpoint,
  DashboardPreferencesConfig,
  DemoResponse,
  Member,
  Menu,
  RewardProgram,
  Role,
  SiteBrandConfig,
  User,
} from "@shared/api";
import { DEFAULT_ACCESS_ROLES } from "@shared/access-control";
import {
  createDefaultLoginBuilderConfig,
  normalizeLoginBuilderConfig,
} from "@/lib/login-builder";

const STORAGE_PREFIX = "homeplate:pages:";
const SESSION_KEY = `${STORAGE_PREFIX}session-user-id`;
const MENUS_KEY = `${STORAGE_PREFIX}menus`;
const REWARDS_KEY = `${STORAGE_PREFIX}rewards`;
const MEMBERS_KEY = `${STORAGE_PREFIX}members`;
const SITE_BRAND_KEY = `${STORAGE_PREFIX}site-brand`;
const BUILDER_APPS_KEY = `${STORAGE_PREFIX}builder-apps`;
const ACCESS_ROLES_KEY = `${STORAGE_PREFIX}access-roles`;
const ACCOUNTS_KEY = `${STORAGE_PREFIX}accounts`;

type DemoAccount = {
  password: string;
  user: User;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    password: "admin123!",
    user: {
      id: "user-admin",
      username: "admin",
      name: "Michael Brown",
      email: "michael@homeplate.app",
      role: "admin",
      roleName: "Administrator",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "admin")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-03T09:00:00.000Z",
    },
  },
  {
    password: "design123!",
    user: {
      id: "user-designer",
      username: "designer",
      name: "Ava Patel",
      email: "ava@homeplate.app",
      role: "designer",
      roleName: "App Designer",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "designer")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-04T09:00:00.000Z",
    },
  },
  {
    password: "store123!",
    user: {
      id: "user-operator",
      username: "operator",
      name: "Jordan Kim",
      email: "jordan@homeplate.app",
      role: "operator",
      roleName: "Store Operator",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "operator")?.permissions ?? [],
      status: "Pending",
      createdAt: "2025-01-05T09:00:00.000Z",
    },
  },
  {
    password: "insight123!",
    user: {
      id: "user-analyst",
      username: "analyst",
      name: "Nina Cole",
      email: "nina@homeplate.app",
      role: "analyst",
      roleName: "Analyst",
      permissions: DEFAULT_ACCESS_ROLES.find((role) => role.id === "analyst")?.permissions ?? [],
      status: "Active",
      createdAt: "2025-01-06T09:00:00.000Z",
    },
  },
];

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
  loginBuilder: createDefaultLoginBuilderConfig(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SEEDED_MEMBERS: Member[] = [
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
    notes: "Prefers in-app specials and weekend offers.",
    tags: ["vip", "weekday"],
    marketingOptIn: true,
    totalSpend: 1840,
    visits: 32,
    passwordSet: true,
    companionAccessCode: "HP-JD-1024",
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
    notes: "Needs onboarding follow-up for companion app.",
    tags: ["new-app"],
    marketingOptIn: false,
    totalSpend: 620,
    visits: 11,
    passwordSet: true,
    companionAccessCode: "HP-JS-8842",
  },
];

function endpoint(
  id: string,
  category: string,
  name: string,
  description: string,
  method: BuilderServerApiEndpoint["method"],
  path: string,
  requiresAuth: boolean,
  allowedRoles: Role[],
  params: BuilderServerApiEndpoint["params"],
  successMessage?: string,
) {
  return {
    id,
    category,
    name,
    description,
    method,
    path,
    requiresAuth,
    allowedRoles,
    params,
    successMessage,
  } satisfies BuilderServerApiEndpoint;
}

function param(
  name: string,
  label: string,
  location: BuilderServerApiEndpoint["params"][number]["location"],
  required: boolean,
  valueType: BuilderServerApiEndpoint["params"][number]["valueType"],
  description: string,
) {
  return {
    name,
    label,
    location,
    required,
    valueType,
    description,
  } satisfies BuilderServerApiEndpoint["params"][number];
}

const STATIC_BUILDER_API_CATALOG: BuilderServerApiEndpoint[] = [
  endpoint("auth-login", "Auth", "Sign in", "Create a local demo session.", "POST", "/api/auth/login", false, [], [
    param("username", "Username", "body", true, "string", "Workspace username."),
    param("password", "Password", "body", true, "string", "Workspace password."),
  ], "Signed in successfully"),
  endpoint("auth-me", "Auth", "Current session", "Return the active local demo session.", "GET", "/api/auth/me", false, [], [], "Loaded current session"),
  endpoint("auth-logout", "Auth", "Sign out", "Clear the active local demo session.", "POST", "/api/auth/logout", false, [], [], "Signed out successfully"),
  endpoint("ping", "Utility", "Ping", "Basic health check endpoint.", "GET", "/api/ping", false, [], [], "Ping completed"),
  endpoint("demo", "Utility", "Demo response", "Simple demo endpoint used for static builds.", "GET", "/api/demo", false, [], [], "Demo response loaded"),
  endpoint("menus-list", "Menus", "List menus", "Return all menus available to the current operator or admin.", "GET", "/api/menus", true, ["admin", "operator"], [], "Menus loaded"),
  endpoint("menus-create", "Menus", "Create menu", "Create a new menu record.", "POST", "/api/menus", true, ["admin", "operator"], [
    param("name", "Name", "body", true, "string", "Menu name."),
    param("location", "Location", "body", true, "string", "Store or venue location."),
    param("items", "Items", "body", false, "array", "Array of menu items."),
  ], "Menu created"),
  endpoint("menus-update", "Menus", "Update menu", "Update an existing menu record.", "PUT", "/api/menus/:id", true, ["admin", "operator"], [
    param("id", "Menu ID", "path", true, "string", "Menu identifier."),
  ], "Menu updated"),
  endpoint("menus-delete", "Menus", "Delete menu", "Delete an existing menu record.", "DELETE", "/api/menus/:id", true, ["admin"], [
    param("id", "Menu ID", "path", true, "string", "Menu identifier."),
  ], "Menu deleted"),
  endpoint("rewards-list", "Rewards", "List rewards", "Return all reward programs.", "GET", "/api/rewards", true, ["admin", "operator"], [], "Reward programs loaded"),
  endpoint("rewards-create", "Rewards", "Create reward program", "Create a new loyalty reward program.", "POST", "/api/rewards", true, ["admin", "operator"], [
    param("name", "Name", "body", true, "string", "Reward program name."),
    param("pointsPerDollar", "Points per dollar", "body", true, "number", "Earn rate."),
    param("tiers", "Tiers", "body", false, "array", "Tier definitions."),
    param("redemptions", "Redemptions", "body", false, "array", "Redemption options."),
  ], "Reward program created"),
  endpoint("rewards-update", "Rewards", "Update reward program", "Update an existing loyalty reward program.", "PUT", "/api/rewards/:id", true, ["admin", "operator"], [
    param("id", "Program ID", "path", true, "string", "Reward program identifier."),
  ], "Reward program updated"),
  endpoint("rewards-delete", "Rewards", "Delete reward program", "Delete a reward program by id.", "DELETE", "/api/rewards/:id", true, ["admin", "operator"], [
    param("id", "Program ID", "path", true, "string", "Reward program identifier."),
  ], "Reward program deleted"),
  endpoint("members-list", "Members", "List members", "Return a paginated list of members.", "GET", "/api/members", true, ["admin", "operator"], [
    param("page", "Page", "query", false, "number", "Page number."),
    param("limit", "Limit", "query", false, "number", "Items per page."),
  ], "Members loaded"),
  endpoint("members-create", "Members", "Create member", "Create a new loyalty member record.", "POST", "/api/members", true, ["admin", "operator"], [
    param("email", "Email", "body", true, "string", "Member email address."),
    param("name", "Name", "body", true, "string", "Member full name."),
    param("phone", "Phone", "body", false, "string", "Member phone number."),
  ], "Member created"),
  endpoint("members-update", "Members", "Update member", "Update a member record by id.", "PUT", "/api/members/:id", true, ["admin", "operator"], [
    param("id", "Member ID", "path", true, "string", "Member identifier."),
  ], "Member updated"),
  endpoint("members-delete", "Members", "Delete member", "Delete a member by id.", "DELETE", "/api/members/:id", true, ["admin"], [
    param("id", "Member ID", "path", true, "string", "Member identifier."),
  ], "Member deleted"),
  endpoint("members-add-points", "Members", "Add member points", "Increment a member points balance.", "POST", "/api/members/:id/points", true, ["admin", "operator"], [
    param("id", "Member ID", "path", true, "string", "Member identifier."),
    param("points", "Points", "body", true, "number", "Points to add."),
  ], "Member points updated"),
  endpoint("users-list", "Users", "List users", "Return all internal workspace users.", "GET", "/api/users", true, ["admin"], [], "Users loaded"),
  endpoint("site-brand-get", "Site Config", "Get site brand", "Return the current site-wide brand settings.", "GET", "/api/site-config/brand", false, [], [], "Site brand loaded"),
  endpoint("site-brand-update", "Site Config", "Update site brand", "Persist the site-wide brand settings.", "PUT", "/api/site-config/brand", true, ["admin", "designer"], [], "Site brand updated"),
  endpoint("dashboard-get", "Site Config", "Get dashboard preferences", "Return dashboard preferences for the signed-in user.", "GET", "/api/site-config/dashboard/:userKey", true, ["admin", "designer", "operator", "analyst"], [
    param("userKey", "User key", "path", true, "string", "Dashboard preference key."),
  ], "Dashboard preferences loaded"),
  endpoint("dashboard-update", "Site Config", "Update dashboard preferences", "Persist dashboard preferences for the signed-in user.", "PUT", "/api/site-config/dashboard/:userKey", true, ["admin", "designer", "operator", "analyst"], [
    param("userKey", "User key", "path", true, "string", "Dashboard preference key."),
  ], "Dashboard preferences updated"),
  endpoint("analytics-summary", "Analytics", "Analytics summary", "Return dashboard analytics summary cards and charts.", "GET", "/api/analytics/summary", true, ["admin", "analyst"], [], "Analytics loaded"),
  endpoint("builder-apps-get", "Builder", "Get builder apps", "Load persisted mobile builder apps for the current workspace.", "GET", "/api/builder/apps", true, ["admin", "designer"], [], "Builder apps loaded"),
  endpoint("builder-apps-update", "Builder", "Update builder apps", "Persist mobile builder apps for the current workspace.", "PUT", "/api/builder/apps", true, ["admin", "designer"], [], "Builder apps saved"),
  endpoint("builder-api-catalog", "Builder", "List builder endpoints", "Return the endpoint catalog available in the mobile app designer.", "GET", "/api/builder/api-endpoints", true, ["admin", "designer"], [], "Builder endpoints loaded"),
];

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const next = cloneValue(fallback);
      window.localStorage.setItem(key, JSON.stringify(next));
      return next;
    }

    return JSON.parse(raw) as T;
  } catch {
    return cloneValue(fallback);
  }
}

function readOptionalValue<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStoredValue<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function getMenus() {
  return readStoredValue(MENUS_KEY, SEEDED_MENUS);
}

function setMenus(value: Menu[]) {
  return writeStoredValue(MENUS_KEY, value);
}

function getRewards() {
  return readStoredValue(REWARDS_KEY, SEEDED_REWARDS);
}

function setRewards(value: RewardProgram[]) {
  return writeStoredValue(REWARDS_KEY, value);
}

function getMembers() {
  return readStoredValue(MEMBERS_KEY, SEEDED_MEMBERS);
}

function setMembers(value: Member[]) {
  return writeStoredValue(MEMBERS_KEY, value);
}

function normalizeSiteBrand(value?: Partial<SiteBrandConfig>): SiteBrandConfig {
  const spinnerStyle =
    value?.splashSpinnerStyle === "dots" ||
    value?.splashSpinnerStyle === "pulse" ||
    value?.splashSpinnerStyle === "ring" ||
    value?.splashSpinnerStyle === "bars" ||
    value?.splashSpinnerStyle === "dual-ring" ||
    value?.splashSpinnerStyle === "orbit"
      ? value.splashSpinnerStyle
      : DEFAULT_SITE_BRAND.splashSpinnerStyle;

  return {
    ...DEFAULT_SITE_BRAND,
    ...value,
    splashSpinnerStyle: spinnerStyle,
    loginBuilder: normalizeLoginBuilderConfig(value?.loginBuilder),
  };
}

function getSiteBrand() {
  return normalizeSiteBrand(readStoredValue(SITE_BRAND_KEY, DEFAULT_SITE_BRAND));
}

function setSiteBrand(value: SiteBrandConfig) {
  return writeStoredValue(SITE_BRAND_KEY, normalizeSiteBrand(value));
}

function getBuilderApps() {
  return readOptionalValue<BuilderPersistedApp[]>(BUILDER_APPS_KEY);
}

function setBuilderApps(value: BuilderPersistedApp[]) {
  return writeStoredValue(BUILDER_APPS_KEY, value);
}

function getAccessRoles() {
  return readStoredValue(ACCESS_ROLES_KEY, DEFAULT_ACCESS_ROLES);
}

function setAccessRoles(value: AccessRole[]) {
  return writeStoredValue(ACCESS_ROLES_KEY, value);
}

function decorateUser(user: User): User {
  const role = getAccessRoles().find((entry) => entry.id === user.role);
  return {
    ...user,
    roleName: role?.name ?? user.roleName ?? user.role,
    permissions: role?.permissions ?? user.permissions ?? [],
    roleColor: role?.color ?? user.roleColor,
  };
}

function getAccounts() {
  return readStoredValue(ACCOUNTS_KEY, DEMO_ACCOUNTS).map((account) => ({
    ...account,
    user: decorateUser(account.user),
  }));
}

function setAccounts(value: DemoAccount[]) {
  return writeStoredValue(ACCOUNTS_KEY, value);
}

function getUsers() {
  return getAccounts().map((account) => decorateUser(account.user));
}

function setUsers(value: User[]) {
  const accounts = getAccounts();
  const nextAccounts = value.map((user) => {
    const existing = accounts.find((account) => account.user.id === user.id);
    return {
      password: existing?.password ?? "changeme123!",
      user: decorateUser(user),
    };
  });

  return setAccounts(nextAccounts);
}

function dashboardKey(userKey: string) {
  return `${STORAGE_PREFIX}dashboard:${userKey}`;
}

function getDashboardConfig(userKey: string) {
  return readOptionalValue<DashboardPreferencesConfig>(dashboardKey(userKey));
}

function setDashboardConfig(userKey: string, value: DashboardPreferencesConfig) {
  return writeStoredValue(dashboardKey(userKey), value);
}

function getSessionUser() {
  const userId = window.localStorage.getItem(SESSION_KEY);
  return getAccounts().find((account) => account.user.id === userId)?.user ?? null;
}

function setSessionUser(userId: string | null) {
  if (!userId) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, userId);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10_000)}`;
}

function jsonResponse<T>(payload: T, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function apiSuccess<T>(data: T, status = 200) {
  return jsonResponse<ApiResponse<T>>({ success: true, data }, status);
}

function apiError(status: number, error: string) {
  return jsonResponse<ApiResponse<never>>({ success: false, error }, status);
}

function requireSignedIn(user: User | null) {
  return user ? null : apiError(401, "Authentication required");
}

function requireRole(user: User | null, allowedRoles: Role[]) {
  if (!user) {
    return apiError(401, "Authentication required");
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return apiError(403, "You do not have access to this resource");
  }

  return null;
}

function parsePath(pathname: string) {
  return pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
}

function parseBody(bodyText: string) {
  if (!bodyText.trim()) {
    return {};
  }

  try {
    return JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function normalizeRequest(input: RequestInfo | URL, init?: RequestInit) {
  const request =
    input instanceof Request
      ? input
      : new Request(
          typeof input === "string" || input instanceof URL ? input : String(input),
          init,
        );

  let bodyText = "";
  if (typeof init?.body === "string") {
    bodyText = init.body;
  } else if (request.method !== "GET" && request.method !== "HEAD") {
    bodyText = await request.clone().text();
  }

  const url = new URL(request.url, window.location.origin);
  const method = (init?.method ?? request.method ?? "GET").toUpperCase();

  return { url, method, body: parseBody(bodyText) };
}

function buildAnalyticsSummary(): AnalyticsSummary {
  const menus = getMenus();
  const members = getMembers();
  const rewards = getRewards();
  const menuItems = menus.flatMap((menu) => menu.items);
  const specials = menus.flatMap((menu) => menu.specials);
  const pointGenerators = rewards.flatMap((program) => program.pointGenerators ?? []);
  const totalRevenue = menuItems.reduce((sum, item) => sum + item.price * 32, 0);
  const totalRedemptions = rewards.reduce((count, program) => count + program.redemptions.length, 0);
  const averageTransaction =
    menuItems.length > 0
      ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length
      : 0;
  const tierCounts = members.reduce<Record<string, number>>((summary, member) => {
    summary[member.tier] = (summary[member.tier] ?? 0) + 1;
    return summary;
  }, {});
  const locationSpend = members.reduce<Record<string, number>>((summary, member) => {
    const location = member.favoriteLocation || "Unassigned";
    summary[location] = (summary[location] ?? 0) + (member.totalSpend ?? 0);
    return summary;
  }, {});

  return {
    metrics: [
      {
        label: "Revenue Projection",
        value: `$${totalRevenue.toFixed(2)}`,
        change: 7.8,
        trend: "up",
      },
      {
        label: "Member Lifetime Spend",
        value: `$${members.reduce((sum, member) => sum + (member.totalSpend ?? 0), 0).toFixed(0)}`,
        change: 5.4,
        trend: "up",
      },
      {
        label: "Open Point Codes",
        value: String(pointGenerators.length),
        change: 1.2,
        trend: "up",
      },
      {
        label: "Avg. Transaction",
        value: `$${averageTransaction.toFixed(2)}`,
        change: 0.8,
        trend: "neutral",
      },
    ],
    revenueData: menus.slice(0, 7).map((menu, index) => ({
      name: menu.name.slice(0, 10) || `Menu ${index + 1}`,
      value: Math.round(menu.items.reduce((sum, item) => sum + item.price * 18, 0)),
    })),
    memberGrowthData: [
      { name: "Jan", value: Math.max(10, Math.round(members.length * 0.25)) },
      { name: "Feb", value: Math.max(20, Math.round(members.length * 0.5)) },
      { name: "Mar", value: Math.max(30, Math.round(members.length * 0.75)) },
      { name: "Apr", value: Math.max(40, members.length) },
    ],
    topItemsData: menuItems.slice(0, 5).map((item) => ({
      name: item.name,
      value: Math.round(item.price * 30),
    })),
    channelMixData: [
      { name: "QR", value: pointGenerators.filter((generator) => generator.kind === "qr").length || 1 },
      { name: "Text", value: pointGenerators.filter((generator) => generator.kind === "text_code").length || 1 },
      { name: "Scan Card", value: pointGenerators.filter((generator) => generator.kind === "scan_card").length || 1 },
      { name: "Specials", value: specials.length || 1 },
    ],
    tierDistributionData: Object.entries(tierCounts).map(([name, value]) => ({ name, value })),
    locationPerformanceData: Object.entries(locationSpend).map(([name, value]) => ({ name, value: Math.round(value) })),
    activityFeed: [
      {
        id: "static-points",
        title: "Point generators are available",
        detail: `${pointGenerators.length} generators can be used from the static demo.`,
        time: "Updated now",
        category: "points",
      },
      {
        id: "static-rewards",
        title: "Reward redemptions are configured",
        detail: `${totalRedemptions} redemption options are active across ${rewards.length} programs.`,
        time: "Today",
        category: "rewards",
      },
      {
        id: "static-members",
        title: "Member profiles include companion app fields",
        detail: `${members.length} member records are available in the static workspace.`,
        time: "Today",
        category: "members",
      },
      {
        id: "static-menus",
        title: "Menus include specials",
        detail: `${specials.length} special campaigns are attached to the static demo menus.`,
        time: "Today",
        category: "menus",
      },
      {
        id: "static-access",
        title: "Access roles are editable",
        detail: `${getAccessRoles().length} roles are available in the static demo.`,
        time: "Today",
        category: "security",
      },
    ],
  };
}

async function handleMockRequest(input: RequestInfo | URL, init?: RequestInit) {
  const { url, method, body } = await normalizeRequest(input, init);
  const path = url.pathname;
  const segments = parsePath(path);
  const user = getSessionUser();

  if (path === "/api/ping" && method === "GET") {
    return jsonResponse({ message: "ping" }, 200);
  }

  if (path === "/api/demo" && method === "GET") {
    return jsonResponse<DemoResponse>({ message: "Hello from static demo server" }, 200);
  }

  if (path === "/api/auth/me" && method === "GET") {
    return apiSuccess<User | null>(user);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const account = getAccounts().find(
      (entry) => entry.user.username === username && entry.password === password,
    );

    if (!account) {
      return apiError(401, "Invalid credentials");
    }

    setSessionUser(account.user.id);
    const token = `static-${account.user.id}-${Date.now()}`;
    return apiSuccess<AuthToken>({ token, user: decorateUser(account.user) });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    setSessionUser(null);
    return apiSuccess<null>(null);
  }

  if (path === "/api/menus" && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    return authError ?? apiSuccess(getMenus());
  }

  if (path === "/api/menus" && method === "POST") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const newMenu: Menu = {
      id: createId("menu"),
      name: String(body.name ?? "").trim(),
      location: String(body.location ?? "").trim(),
      items: Array.isArray(body.items) ? (body.items as Menu["items"]) : [],
      specials: Array.isArray(body.specials) ? (body.specials as Menu["specials"]) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMenus([...getMenus(), newMenu]);
    return apiSuccess(newMenu, 201);
  }

  if (segments[0] === "api" && segments[1] === "menus" && segments[2] && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const menu = getMenus().find((entry) => entry.id === segments[2]);
    return menu ? apiSuccess(menu) : apiError(404, "Menu not found");
  }

  if (segments[0] === "api" && segments[1] === "menus" && segments[2] && method === "PUT") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const menus = getMenus();
    const current = menus.find((entry) => entry.id === segments[2]);
    if (!current) return apiError(404, "Menu not found");

    const nextMenu: Menu = {
      ...current,
      ...body,
      id: current.id,
      items: Array.isArray(body.items) ? (body.items as Menu["items"]) : current.items,
      specials: Array.isArray(body.specials) ? (body.specials as Menu["specials"]) : current.specials,
      updatedAt: new Date().toISOString(),
    };

    setMenus(menus.map((entry) => (entry.id === current.id ? nextMenu : entry)));
    return apiSuccess(nextMenu);
  }

  if (segments[0] === "api" && segments[1] === "menus" && segments[2] && method === "DELETE") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const menus = getMenus();
    const existing = menus.find((entry) => entry.id === segments[2]);
    if (!existing) return apiError(404, "Menu not found");
    setMenus(menus.filter((entry) => entry.id !== segments[2]));
    return apiSuccess(existing);
  }

  if (path === "/api/rewards" && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    return authError ?? apiSuccess(getRewards());
  }

  if (path === "/api/rewards" && method === "POST") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const program: RewardProgram = {
      id: createId("program"),
      name: String(body.name ?? "").trim(),
      pointsPerDollar: Number(body.pointsPerDollar ?? 0),
      tiers: Array.isArray(body.tiers) ? (body.tiers as RewardProgram["tiers"]) : [],
      redemptions: Array.isArray(body.redemptions)
        ? (body.redemptions as RewardProgram["redemptions"])
        : [],
      pointGenerators: Array.isArray(body.pointGenerators)
        ? (body.pointGenerators as RewardProgram["pointGenerators"])
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRewards([...getRewards(), program]);
    return apiSuccess(program, 201);
  }

  if (segments[0] === "api" && segments[1] === "rewards" && segments[2] && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const program = getRewards().find((entry) => entry.id === segments[2]);
    return program ? apiSuccess(program) : apiError(404, "Reward program not found");
  }

  if (segments[0] === "api" && segments[1] === "rewards" && segments[2] && method === "PUT") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const programs = getRewards();
    const current = programs.find((entry) => entry.id === segments[2]);
    if (!current) return apiError(404, "Reward program not found");

    const nextProgram: RewardProgram = {
      ...current,
      ...body,
      id: current.id,
      pointsPerDollar: Number(body.pointsPerDollar ?? current.pointsPerDollar),
      tiers: Array.isArray(body.tiers) ? (body.tiers as RewardProgram["tiers"]) : current.tiers,
      redemptions: Array.isArray(body.redemptions)
        ? (body.redemptions as RewardProgram["redemptions"])
        : current.redemptions,
      pointGenerators: Array.isArray(body.pointGenerators)
        ? (body.pointGenerators as RewardProgram["pointGenerators"])
        : current.pointGenerators,
      updatedAt: new Date().toISOString(),
    };

    setRewards(programs.map((entry) => (entry.id === current.id ? nextProgram : entry)));
    return apiSuccess(nextProgram);
  }

  if (segments[0] === "api" && segments[1] === "rewards" && segments[2] && method === "DELETE") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const programs = getRewards();
    const existing = programs.find((entry) => entry.id === segments[2]);
    if (!existing) return apiError(404, "Reward program not found");
    setRewards(programs.filter((entry) => entry.id !== segments[2]));
    return apiSuccess(existing);
  }

  if (segments[0] === "api" && segments[1] === "rewards" && segments[2] && segments[3] === "point-generators" && method === "POST") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const programs = getRewards();
    const current = programs.find((entry) => entry.id === segments[2]);
    if (!current) return apiError(404, "Reward program not found");

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const generator = {
      id: createId("generator"),
      name: String(body.name ?? "").trim() || "Generated points",
      kind: String(body.kind ?? "qr") as RewardProgram["pointGenerators"][number]["kind"],
      points: Number(body.points ?? 0),
      code,
      payload: `homeplate://points/${current.id}/${code}`,
      description: String(body.description ?? "").trim() || "Static demo point generator.",
      expiresAt: String(body.expiresAt ?? "").trim() || undefined,
      createdAt: new Date().toISOString(),
      redemptionCount: 0,
    };

    const nextProgram: RewardProgram = {
      ...current,
      pointGenerators: [generator, ...(current.pointGenerators ?? [])],
      updatedAt: new Date().toISOString(),
    };

    setRewards(programs.map((entry) => (entry.id === current.id ? nextProgram : entry)));
    return apiSuccess(generator, 201);
  }

  if (path === "/api/members" && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 10) || 10);
    const members = getMembers();
    const start = (page - 1) * limit;
    return apiSuccess({
      data: members.slice(start, start + limit),
      total: members.length,
      page,
      limit,
    });
  }

  if (path === "/api/members" && method === "POST") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const member: Member = {
      id: createId("member"),
      username: String(body.username ?? "").trim(),
      email: String(body.email ?? "").trim(),
      name: String(body.name ?? "").trim(),
      status: "Active",
      phone: String(body.phone ?? "").trim() || undefined,
      loyaltyPoints: 0,
      tier: "Bronze",
      joinDate: new Date().toISOString().split("T")[0],
      tags: [],
      marketingOptIn: false,
      totalSpend: 0,
      visits: 0,
      passwordSet: Boolean(String(body.password ?? "").trim()),
      companionAccessCode: String(body.companionAccessCode ?? "").trim() || undefined,
    };

    setMembers([...getMembers(), member]);
    return apiSuccess(member, 201);
  }

  if (segments[0] === "api" && segments[1] === "members" && segments[2] && !segments[3] && method === "GET") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const member = getMembers().find((entry) => entry.id === segments[2]);
    return member ? apiSuccess(member) : apiError(404, "Member not found");
  }

  if (segments[0] === "api" && segments[1] === "members" && segments[2] && !segments[3] && method === "PUT") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const members = getMembers();
    const current = members.find((entry) => entry.id === segments[2]);
    if (!current) return apiError(404, "Member not found");

    const nextMember: Member = {
      ...current,
      ...body,
      id: current.id,
      loyaltyPoints: Number(body.loyaltyPoints ?? current.loyaltyPoints),
    };

    setMembers(members.map((entry) => (entry.id === current.id ? nextMember : entry)));
    return apiSuccess(nextMember);
  }

  if (segments[0] === "api" && segments[1] === "members" && segments[2] && !segments[3] && method === "DELETE") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const members = getMembers();
    const existing = members.find((entry) => entry.id === segments[2]);
    if (!existing) return apiError(404, "Member not found");
    setMembers(members.filter((entry) => entry.id !== segments[2]));
    return apiSuccess(existing);
  }

  if (segments[0] === "api" && segments[1] === "members" && segments[2] && segments[3] === "points" && method === "POST") {
    const authError = requireRole(user, ["admin", "operator"]);
    if (authError) return authError;

    const members = getMembers();
    const current = members.find((entry) => entry.id === segments[2]);
    if (!current) return apiError(404, "Member not found");

    const nextMember: Member = {
      ...current,
      loyaltyPoints: current.loyaltyPoints + Number(body.points ?? 0),
    };

    setMembers(members.map((entry) => (entry.id === current.id ? nextMember : entry)));
    return apiSuccess(nextMember);
  }

  if (path === "/api/users" && method === "GET") {
    const authError = requireRole(user, ["admin"]);
    return authError ?? apiSuccess(getUsers());
  }

  if (path === "/api/users" && method === "POST") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const accounts = getAccounts();
    const newUser: User = decorateUser({
      id: createId("user"),
      username: String(body.username ?? "").trim(),
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim(),
      role: String(body.role ?? "operator").trim(),
      roleName: "",
      permissions: [],
      status: String(body.status ?? "Pending") as User["status"],
      phone: String(body.phone ?? "").trim() || undefined,
      title: String(body.title ?? "").trim() || undefined,
      department: String(body.department ?? "").trim() || undefined,
      notes: String(body.notes ?? "").trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setAccounts([
      ...accounts,
      {
        password: String(body.password ?? "").trim() || "changeme123!",
        user: newUser,
      },
    ]);

    return apiSuccess(newUser, 201);
  }

  if (segments[0] === "api" && segments[1] === "users" && segments[2] && method === "GET") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const found = getUsers().find((entry) => entry.id === segments[2]);
    return found ? apiSuccess(found) : apiError(404, "User not found");
  }

  if (segments[0] === "api" && segments[1] === "users" && segments[2] && method === "PUT") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const accounts = getAccounts();
    const current = accounts.find((entry) => entry.user.id === segments[2]);
    if (!current) return apiError(404, "User not found");

    const nextUser = decorateUser({
      ...current.user,
      ...body,
      id: current.user.id,
      updatedAt: new Date().toISOString(),
    });

    setAccounts(accounts.map((entry) => (
      entry.user.id === current.user.id
        ? {
            password: String(body.password ?? "").trim() || entry.password,
            user: nextUser,
          }
        : entry
    )));

    return apiSuccess(nextUser);
  }

  if (segments[0] === "api" && segments[1] === "users" && segments[2] && method === "DELETE") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const accounts = getAccounts();
    const current = accounts.find((entry) => entry.user.id === segments[2]);
    if (!current) return apiError(404, "User not found");

    setAccounts(accounts.filter((entry) => entry.user.id !== current.user.id));
    return apiSuccess(current.user);
  }

  if (path === "/api/access-control/roles" && method === "GET") {
    const authError = requireRole(user, ["admin"]);
    return authError ?? apiSuccess(getAccessRoles());
  }

  if (path === "/api/access-control/roles" && method === "POST") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const role: AccessRole = {
      id: String(body.name ?? createId("role")).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: String(body.name ?? "").trim(),
      description: String(body.description ?? "").trim(),
      color: String(body.color ?? "#2563eb").trim(),
      permissions: Array.isArray(body.permissions) ? (body.permissions as AccessRole["permissions"]) : [],
      isSystem: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAccessRoles([...getAccessRoles(), role]);
    return apiSuccess(role, 201);
  }

  if (segments[0] === "api" && segments[1] === "access-control" && segments[2] === "roles" && segments[3] && method === "PUT") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const roles = getAccessRoles();
    const current = roles.find((entry) => entry.id === segments[3]);
    if (!current) return apiError(404, "Role not found");
    if (current.isSystem) return apiError(400, "System roles are read-only");

    const nextRole: AccessRole = {
      ...current,
      ...body,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    setAccessRoles(roles.map((entry) => (entry.id === current.id ? nextRole : entry)));
    return apiSuccess(nextRole);
  }

  if (segments[0] === "api" && segments[1] === "access-control" && segments[2] === "roles" && segments[3] && method === "DELETE") {
    const authError = requireRole(user, ["admin"]);
    if (authError) return authError;

    const roles = getAccessRoles();
    const current = roles.find((entry) => entry.id === segments[3]);
    if (!current) return apiError(404, "Role not found");
    if (current.isSystem) return apiError(400, "System roles are read-only");

    setAccessRoles(roles.filter((entry) => entry.id !== current.id));
    return apiSuccess(current);
  }

  if (path === "/api/site-config/brand" && method === "GET") {
    return apiSuccess(getSiteBrand());
  }

  if (path === "/api/site-config/brand" && method === "PUT") {
    const authError = requireRole(user, ["admin", "designer"]);
    if (authError) return authError;

    return apiSuccess(setSiteBrand(body as unknown as SiteBrandConfig));
  }

  if (
    segments[0] === "api" &&
    segments[1] === "site-config" &&
    segments[2] === "dashboard" &&
    segments[3] &&
    method === "GET"
  ) {
    const authError = requireSignedIn(user);
    if (authError) return authError;
    return apiSuccess(getDashboardConfig(segments[3]));
  }

  if (
    segments[0] === "api" &&
    segments[1] === "site-config" &&
    segments[2] === "dashboard" &&
    segments[3] &&
    method === "PUT"
  ) {
    const authError = requireSignedIn(user);
    if (authError) return authError;
    return apiSuccess(
      setDashboardConfig(segments[3], body as unknown as DashboardPreferencesConfig),
    );
  }

  if (path === "/api/analytics/summary" && method === "GET") {
    const authError = requireRole(user, ["admin", "analyst"]);
    return authError ?? apiSuccess(buildAnalyticsSummary());
  }

  if (path === "/api/builder/apps" && method === "GET") {
    const authError = requireRole(user, ["admin", "designer"]);
    return authError ?? apiSuccess(getBuilderApps());
  }

  if (path === "/api/builder/apps" && method === "PUT") {
    const authError = requireRole(user, ["admin", "designer"]);
    if (authError) return authError;

    const apps = Array.isArray(body.apps) ? (body.apps as BuilderPersistedApp[]) : [];
    return apiSuccess(setBuilderApps(apps));
  }

  if (path === "/api/builder/api-endpoints" && method === "GET") {
    const authError = requireRole(user, ["admin", "designer"]);
    return authError ?? apiSuccess(STATIC_BUILDER_API_CATALOG);
  }

  if (path === "/api/builder/export-maui" && method === "POST") {
    const authError = requireRole(user, ["admin", "designer"]);
    if (authError) return authError;
    return apiError(501, "MAUI export is not available in the GitHub Pages static build");
  }

  return apiError(404, `No static API route matched ${method} ${path}`);
}

export function installStaticDemoApi() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const url = new URL(href, window.location.origin);
    const isLocalApiRequest =
      url.origin === window.location.origin && url.pathname.startsWith("/api/");

    if (!isLocalApiRequest) {
      return originalFetch(input, init);
    }

    return handleMockRequest(input, init);
  }) as typeof window.fetch;
}
