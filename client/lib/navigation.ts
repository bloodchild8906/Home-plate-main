import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Gift,
  LockKeyhole,
  Palette,
  SquareMenu,
  Smartphone,
  UserCog,
  Users,
} from "lucide-react";
import type { UserRole } from "./auth";

export interface AppRouteMeta {
  path: string;
  title: string;
  description: string;
  shortDescription: string;
  category: "Design" | "Operations" | "Growth" | "Admin";
  icon: LucideIcon;
  allowedRoles: UserRole[];
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
    stat: "12 live screens",
  },
  {
    path: "/menu-management",
    title: "Menu Management",
    description: "Maintain locations, pricing, seasonal menus, and item presentation.",
    shortDescription: "Control catalogs and launch menu updates fast.",
    category: "Operations",
    icon: SquareMenu,
    allowedRoles: ["admin", "operator"],
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
    stat: "4 active roles",
  },
];

export function getRouteMeta(path: string) {
  return APP_ROUTES.find((route) => route.path === path);
}
