import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  GitBranchPlus,
  Gift,
  LockKeyhole,
  Palette,
  SquareMenu,
  Smartphone,
  UserCog,
  Users,
} from "lucide-react";
import { PERMISSIONS } from "@shared/access-control";
import type { PermissionId } from "@shared/api";
import type { UserRole } from "./auth";

export interface AppRouteMeta {
  path: string;
  title: string;
  description: string;
  shortDescription: string;
  category: "Design" | "Operations" | "Growth" | "Admin";
  icon: LucideIcon;
  allowedRoles: UserRole[];
  requiredPermissions: PermissionId[];
  stat: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  designer: "App Designer",
  operator: "Store Operator",
  analyst: "Analyst",
};

export const APP_ROUTES: AppRouteMeta[] = [
  {
    path: "/builder",
    title: "App Designer",
    description: "Build mobile experiences with reusable blocks, navigation, and commerce flows.",
    shortDescription: "Compose mobile screens with reusable design blocks.",
    category: "Design",
    icon: Smartphone,
    allowedRoles: ["admin", "designer"],
    requiredPermissions: [PERMISSIONS.builderManage],
    stat: "12 live screens",
  },
  {
    path: "/block-builder",
    title: "Block Builder",
    description: "Compose reusable content blocks with properties, styles, and metadata presets.",
    shortDescription: "Build and edit reusable block blueprints.",
    category: "Design",
    icon: Boxes,
    allowedRoles: ["admin", "designer"],
    requiredPermissions: [PERMISSIONS.builderManage],
    stat: "Reusable block sets",
  },
  {
    path: "/function-builder",
    title: "Function Builder",
    description: "Design a node-graph effect pipeline and generate executable CommonJS chains.",
    shortDescription: "Chain effects in a visual node graph.",
    category: "Design",
    icon: GitBranchPlus,
    allowedRoles: ["admin", "designer"],
    requiredPermissions: [PERMISSIONS.builderManage],
    stat: "Visual effect graph",
  },
  {
    path: "/menu-management",
    title: "Menu Management",
    description: "Maintain locations, pricing, seasonal menus, and item presentation.",
    shortDescription: "Control catalogs and launch menu updates fast.",
    category: "Operations",
    icon: SquareMenu,
    allowedRoles: ["admin", "operator"],
    requiredPermissions: [PERMISSIONS.menusManage],
    stat: "8 synced menus",
  },
  {
    path: "/rewards",
    title: "Rewards",
    description: "Shape loyalty programs, tier benefits, and redemption logic.",
    shortDescription: "Tune loyalty mechanics and customer incentives.",
    category: "Growth",
    icon: Gift,
    allowedRoles: ["admin", "operator"],
    requiredPermissions: [PERMISSIONS.rewardsManage],
    stat: "3 active programs",
  },
  {
    path: "/members",
    title: "Members",
    description: "Track customer profiles, points, and engagement history.",
    shortDescription: "Manage customer records and loyalty balances.",
    category: "Growth",
    icon: Users,
    allowedRoles: ["admin", "operator"],
    requiredPermissions: [PERMISSIONS.membersManage],
    stat: "2.8k members",
  },
  {
    path: "/analytics",
    title: "Analytics",
    description: "Review performance trends across revenue, acquisition, and retention.",
    shortDescription: "Inspect demand, growth, and campaign performance.",
    category: "Growth",
    icon: BarChart3,
    allowedRoles: ["admin", "analyst"],
    requiredPermissions: [PERMISSIONS.analyticsView],
    stat: "18% growth",
  },
  {
    path: "/whitelabeling",
    title: "Whitelabeling",
    description: "Adapt themes, assets, and brand systems for each restaurant group.",
    shortDescription: "Adjust branding, typography, and multi-brand assets.",
    category: "Design",
    icon: Palette,
    allowedRoles: ["admin", "designer"],
    requiredPermissions: [PERMISSIONS.brandingManage],
    stat: "4 brand kits",
  },
  {
    path: "/manage-users",
    title: "Manage Users",
    description: "Administer internal users, roles, and workspace access.",
    shortDescription: "Create users, assign roles, and review status.",
    category: "Admin",
    icon: UserCog,
    allowedRoles: ["admin"],
    requiredPermissions: [PERMISSIONS.usersManage],
    stat: "6 team seats",
  },
  {
    path: "/access-control",
    title: "Access Control",
    description: "Govern who can access each module and which roles can ship changes.",
    shortDescription: "Review route permissions and operational guardrails.",
    category: "Admin",
    icon: LockKeyhole,
    allowedRoles: ["admin"],
    requiredPermissions: [PERMISSIONS.accessManage],
    stat: "4 active roles",
  },
];

export function getRouteMeta(path: string) {
  return APP_ROUTES.find((route) => route.path === path);
}
