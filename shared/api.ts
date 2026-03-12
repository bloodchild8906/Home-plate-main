/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ============ RBAC ============
export type Role = string;

export type PermissionId =
  | "dashboard.view"
  | "builder.manage"
  | "menus.manage"
  | "menus.specials.manage"
  | "rewards.manage"
  | "rewards.codes.generate"
  | "members.manage"
  | "members.credentials.manage"
  | "analytics.view"
  | "branding.manage"
  | "users.manage"
  | "access.manage";

export interface PermissionDefinition {
  id: PermissionId;
  label: string;
  description: string;
  category: "Workspace" | "Operations" | "Growth" | "Identity" | "Admin";
}

export interface AccessRole {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: PermissionId[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRoleInput {
  name: string;
  description: string;
  color: string;
  permissions: PermissionId[];
}

export interface AccessModuleRequirement {
  path: string;
  title: string;
  description: string;
  requiredPermissions: PermissionId[];
  requirementNotes: string;
  updatedAt: string;
}

export type UserStatus = "Active" | "Pending" | "Suspended";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  roleName: string;
  roleColor?: string;
  permissions: PermissionId[];
  status: UserStatus;
  phone?: string;
  title?: string;
  department?: string;
  notes?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserUpsertInput {
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
  password?: string;
}

export interface AuthToken {
  token: string;
  user: User;
}

// ============ Menu Management ============
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  featured?: boolean;
  available?: boolean;
  specialPrice?: number;
  specialLabel?: string;
}

export type MenuSpecialChannel = "qr" | "text_code" | "scan_card";

export interface MenuSpecial {
  id: string;
  title: string;
  description: string;
  itemId?: string;
  bannerText: string;
  promoCode: string;
  specialPrice?: number;
  startDate: string;
  endDate: string;
  active: boolean;
  channels: MenuSpecialChannel[];
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
  specials: MenuSpecial[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuUpsertInput {
  name: string;
  location: string;
  items?: MenuItem[];
  specials?: MenuSpecial[];
}

// ============ Rewards ============
export interface RewardTier {
  id: string;
  name: string;
  pointsRequired: number;
  description: string;
  discount?: number;
  freeItem?: string;
}

export interface RewardRedemptionOption {
  id: string;
  title: string;
  pointsCost: number;
  rewardType: "discount" | "free_item" | "perk";
  value: string;
  description: string;
}

export interface RewardProgram {
  id: string;
  name: string;
  pointsPerDollar: number;
  tiers: RewardTier[];
  redemptions: RewardRedemptionOption[];
  pointGenerators: RewardPointGenerator[];
  createdAt: string;
  updatedAt: string;
}

export type RewardPointGeneratorKind = "qr" | "text_code" | "scan_card";

export interface RewardPointGenerator {
  id: string;
  name: string;
  kind: RewardPointGeneratorKind;
  points: number;
  code: string;
  payload: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
  redemptionCount: number;
}

export interface RewardPointGeneratorInput {
  name: string;
  kind: RewardPointGeneratorKind;
  points: number;
  description: string;
  expiresAt?: string;
}

// ============ Members ============
export type MemberStatus = "Active" | "Pending" | "Suspended";

export interface Member {
  id: string;
  username: string;
  email: string;
  name: string;
  status: MemberStatus;
  phone?: string;
  loyaltyPoints: number;
  tier: string;
  joinDate: string;
  lastVisit?: string;
  favoriteLocation?: string;
  address?: string;
  dateOfBirth?: string;
  notes?: string;
  tags: string[];
  marketingOptIn: boolean;
  totalSpend: number;
  visits: number;
  avatar?: string;
  passwordSet: boolean;
  passwordUpdatedAt?: string;
  companionAccessCode?: string;
}

export interface MemberTagDefinition {
  id: string;
  label: string;
  color: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberUpsertInput {
  username: string;
  email: string;
  name: string;
  status: MemberStatus;
  phone?: string;
  loyaltyPoints?: number;
  tier?: string;
  joinDate?: string;
  lastVisit?: string;
  favoriteLocation?: string;
  address?: string;
  dateOfBirth?: string;
  notes?: string;
  tags?: string[];
  marketingOptIn?: boolean;
  totalSpend?: number;
  visits?: number;
  avatar?: string;
  password?: string;
  companionAccessCode?: string;
}

// ============ Branding/Whitelabeling ============
export interface BrandingConfig {
  id: string;
  brandName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  favicon?: string;
  customDomain?: string;
  fontFamily: "inter" | "poppins" | "playfair";
}

export type LoginBuilderBlockId =
  | "badge"
  | "brand"
  | "headline"
  | "description"
  | "featureTiles"
  | "loginTitle"
  | "loginHint"
  | "loginForm"
  | "registerForm"
  | "demoAccounts"
  | "footer";

export interface LoginBuilderConfig {
  layout: "split" | "stacked";
  heroWidth: number;
  cardRadius: number;
  heroPanelOpacity: number;
  authPanelOpacity: number;
  featureColumns: 1 | 2 | 3;
  leftBlocks: LoginBuilderBlockId[];
  rightBlocks: LoginBuilderBlockId[];
}

export interface SiteBrandConfig {
  name: string;
  tagline: string;
  logo: string;
  logoImage?: string;
  faviconImage?: string;
  primary: string;
  secondary: string;
  accent: string;
  splashTitle: string;
  splashSubtitle: string;
  splashBackgroundColor: string;
  splashSpinnerStyle: "ring" | "dots" | "pulse" | "bars" | "dual-ring" | "orbit";
  splashSpinnerColor: string;
  splashSpinnerAccent: string;
  loginBuilder: LoginBuilderConfig;
  registerBuilder: LoginBuilderConfig;
  themePresetId: string;
  fontPresetId: string;
  fontFamily: string;
  customFontName?: string;
  customFontSource?: string;
  customFontFormat?: string;
  domain: string;
}

export type DashboardWidgetId =
  | "focus"
  | "overview"
  | "quickActions"
  | "categoryBreakdown"
  | "accessRadar"
  | "activity"
  | "notes"
  | "moduleBoard";

export type DashboardDensity = "comfortable" | "compact";

export interface DashboardPreferencesConfig {
  density: DashboardDensity;
  focusModulePath: string;
  showLockedModules: boolean;
  moduleColumns: 2 | 3 | 4;
  widgetOrder: DashboardWidgetId[];
  hiddenWidgets: DashboardWidgetId[];
}

// ============ Analytics ============
export interface MetricCard {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  category: "points" | "members" | "rewards" | "menus" | "security";
}

export interface AnalyticsSummary {
  metrics: MetricCard[];
  revenueData: ChartDataPoint[];
  memberGrowthData: ChartDataPoint[];
  topItemsData: ChartDataPoint[];
  channelMixData: ChartDataPoint[];
  tierDistributionData: ChartDataPoint[];
  locationPerformanceData: ChartDataPoint[];
  activityFeed: ActivityFeedItem[];
}

// ============ API Responses ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============ Builder Export ============
export type BuilderExportLayoutDisplay = "block" | "flex" | "grid";

export type BuilderExportLayoutDirection = "row" | "column";

export type BuilderExportLayoutJustify =
  | "flex-start"
  | "center"
  | "flex-end"
  | "space-between"
  | "space-around"
  | "space-evenly";

export type BuilderExportLayoutAlign = "stretch" | "flex-start" | "center" | "flex-end";

export interface BuilderExportBlockLayout {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  radius: number;
  display: BuilderExportLayoutDisplay;
  direction: BuilderExportLayoutDirection;
  justify: BuilderExportLayoutJustify;
  align: BuilderExportLayoutAlign;
  gap: number;
  columns: number;
}

export interface BuilderExportBlockAttributes {
  elementId: string;
  className: string;
  style: string;
}

export type BuilderExportBlockActionKind = "none" | "navigate" | "api";

export type BuilderExportBlockApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type BuilderApiParameterLocation = "path" | "query" | "body";

export type BuilderApiParameterValueType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object";

export interface BuilderServerApiParameter {
  name: string;
  label: string;
  location: BuilderApiParameterLocation;
  required: boolean;
  valueType: BuilderApiParameterValueType;
  description: string;
}

export interface BuilderServerApiEndpoint {
  id: string;
  category: string;
  name: string;
  description: string;
  method: BuilderExportBlockApiMethod;
  path: string;
  requiresAuth: boolean;
  allowedRoles: Role[];
  params: BuilderServerApiParameter[];
  successMessage?: string;
}

export type BuilderExportApiFunctionSourceField =
  | "text"
  | "helper"
  | "points"
  | "items"
  | "htmlTag";

export interface BuilderExportApiFunctionPropertyBinding {
  id: string;
  key: string;
  location: BuilderApiParameterLocation;
  required: boolean;
  sourceType: "block" | "static";
  sourceBlockId: string;
  sourceField: BuilderExportApiFunctionSourceField;
  staticValue: string;
}

export interface BuilderExportApiFunction {
  id: string;
  name: string;
  endpointId: string;
  endpoint: string;
  method: BuilderExportBlockApiMethod;
  requiresAuth: boolean;
  authBlockId: string;
  headers: string;
  successMessage: string;
  properties: BuilderExportApiFunctionPropertyBinding[];
}

export interface BuilderExportBlockEventBinding {
  kind: BuilderExportBlockActionKind;
  targetPageId: string;
  functionId: string;
  successMessage: string;
}

export interface BuilderExportBlockEvents {
  tap: BuilderExportBlockEventBinding;
}

export type BuilderExportBlockDataSourceType = "none" | "api";

export type BuilderExportBlockDataBindingMode = "single" | "repeat";

export interface BuilderExportBlockDataBinding {
  sourceType: BuilderExportBlockDataSourceType;
  functionId: string;
  responsePath: string;
  mode: BuilderExportBlockDataBindingMode;
  itemAlias: string;
  itemTemplate: string;
  emptyState: string;
}

export interface BuilderExportBlock {
  id: string;
  type: string;
  name: string;
  text?: string;
  helper?: string;
  items?: string[];
  points?: number;
  htmlTag?: string;
  htmlAttributes?: string;
  htmlContent?: string;
  layout: BuilderExportBlockLayout;
  attributes: BuilderExportBlockAttributes;
  events: BuilderExportBlockEvents;
  dataBinding: BuilderExportBlockDataBinding;
}

export interface BuilderExportPage {
  id: string;
  name: string;
  blocks: BuilderExportBlock[];
}

export interface BuilderExportBrand {
  appName: string;
  logo: string;
  logoImage?: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  textColor: string;
  cardBackground: string;
  themePresetId: string;
  fontPresetId: string;
  fontFamily: string;
  customFontName?: string;
  customFontSource?: string;
  customFontFormat?: string;
  backgroundImage?: string;
  heroImage?: string;
  customCss: string;
  customCssFileName: string;
  domain: string;
}

export interface BuilderExportApp {
  id: string;
  name: string;
  brand: BuilderExportBrand;
  apiFunctions: BuilderExportApiFunction[];
  pages: BuilderExportPage[];
}

export interface BuilderPersistedApp extends BuilderExportApp {
  published: boolean;
  live: boolean;
  updatedAt: string;
}

export interface BuilderMauiExportRequest {
  app: BuilderExportApp;
}

export interface BuilderMauiExportResponse {
  projectName: string;
  outputPath: string;
  template: "maui-blazor";
}
