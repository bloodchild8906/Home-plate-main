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
export type Role = "admin" | "manager" | "staff" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
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
}

export interface Menu {
  id: string;
  name: string;
  location: string;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

// ============ Members ============
export interface Member {
  id: string;
  email: string;
  name: string;
  phone?: string;
  loyaltyPoints: number;
  tier: string;
  joinDate: string;
  lastVisit?: string;
}

// ============ Branding/Whitelabeling ============
export interface BrandingConfig {
  id: string;
  brandName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  favicon?: string;
  customDomain?: string;
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

export interface AnalyticsSummary {
  metrics: MetricCard[];
  revenueData: ChartDataPoint[];
  memberGrowthData: ChartDataPoint[];
  topItemsData: ChartDataPoint[];
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
export interface BuilderExportBlock {
  id: string;
  type: string;
  name: string;
  text?: string;
  helper?: string;
  items?: string[];
  points?: number;
}

export interface BuilderExportPage {
  id: string;
  name: string;
  blocks: BuilderExportBlock[];
}

export interface BuilderExportBrand {
  appName: string;
  logo: string;
  primary: string;
  accent: string;
  surface: string;
  domain: string;
}

export interface BuilderExportApp {
  id: string;
  name: string;
  brand: BuilderExportBrand;
  pages: BuilderExportPage[];
}

export interface BuilderMauiExportRequest {
  app: BuilderExportApp;
}

export interface BuilderMauiExportResponse {
  projectName: string;
  outputPath: string;
}
