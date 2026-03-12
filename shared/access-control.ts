import type {
  AccessModuleRequirement,
  AccessRole,
  PermissionDefinition,
} from "./api";

export const PERMISSIONS = {
  dashboardView: "dashboard.view",
  builderManage: "builder.manage",
  menusManage: "menus.manage",
  menuSpecialsManage: "menus.specials.manage",
  rewardsManage: "rewards.manage",
  rewardCodesGenerate: "rewards.codes.generate",
  membersManage: "members.manage",
  memberCredentialsManage: "members.credentials.manage",
  analyticsView: "analytics.view",
  brandingManage: "branding.manage",
  usersManage: "users.manage",
  accessManage: "access.manage",
} as const;

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    id: PERMISSIONS.dashboardView,
    label: "Dashboard",
    description: "Open the command center and dashboard widgets.",
    category: "Workspace",
  },
  {
    id: PERMISSIONS.builderManage,
    label: "App Builder",
    description: "Design, publish, and export mobile apps.",
    category: "Workspace",
  },
  {
    id: PERMISSIONS.menusManage,
    label: "Menu Management",
    description: "Create and update menus, categories, and items.",
    category: "Operations",
  },
  {
    id: PERMISSIONS.menuSpecialsManage,
    label: "Menu Specials",
    description: "Launch specials, promo codes, and campaign windows.",
    category: "Operations",
  },
  {
    id: PERMISSIONS.rewardsManage,
    label: "Rewards",
    description: "Manage reward programs, tiers, and redemptions.",
    category: "Growth",
  },
  {
    id: PERMISSIONS.rewardCodesGenerate,
    label: "Generate Point Codes",
    description: "Create QR, text-code, and scan-card earning flows.",
    category: "Growth",
  },
  {
    id: PERMISSIONS.membersManage,
    label: "Members",
    description: "Manage member profiles, balances, and engagement data.",
    category: "Growth",
  },
  {
    id: PERMISSIONS.memberCredentialsManage,
    label: "Member Credentials",
    description: "Set companion-app usernames, passwords, and access codes.",
    category: "Identity",
  },
  {
    id: PERMISSIONS.analyticsView,
    label: "Analytics",
    description: "Review platform, revenue, and loyalty reporting.",
    category: "Growth",
  },
  {
    id: PERMISSIONS.brandingManage,
    label: "Whitelabeling",
    description: "Adjust themes, assets, fonts, and brand presentation.",
    category: "Workspace",
  },
  {
    id: PERMISSIONS.usersManage,
    label: "Users",
    description: "Create workspace users, profiles, and account status.",
    category: "Admin",
  },
  {
    id: PERMISSIONS.accessManage,
    label: "Access Control",
    description: "Create custom roles and govern permission assignment.",
    category: "Admin",
  },
];

const now = "2026-03-12T00:00:00.000Z";

export const DEFAULT_ACCESS_ROLES: AccessRole[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full workspace control across platform operations, growth, and security.",
    color: "#f97316",
    permissions: PERMISSION_CATALOG.map((permission) => permission.id),
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "designer",
    name: "App Designer",
    description: "Owns app experience, exports, and brand presentation.",
    color: "#0f766e",
    permissions: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.builderManage,
      PERMISSIONS.brandingManage,
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "operator",
    name: "Store Operator",
    description: "Runs day-to-day menu, rewards, and member operations.",
    color: "#2563eb",
    permissions: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.menusManage,
      PERMISSIONS.menuSpecialsManage,
      PERMISSIONS.rewardsManage,
      PERMISSIONS.rewardCodesGenerate,
      PERMISSIONS.membersManage,
      PERMISSIONS.memberCredentialsManage,
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Tracks revenue, loyalty, and operational performance.",
    color: "#7c3aed",
    permissions: [
      PERMISSIONS.dashboardView,
      PERMISSIONS.analyticsView,
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
];

export function getPermissionDefinition(permissionId: string) {
  return PERMISSION_CATALOG.find((permission) => permission.id === permissionId);
}

export function getDefaultRole(roleId: string) {
  return DEFAULT_ACCESS_ROLES.find((role) => role.id === roleId);
}

export const DEFAULT_MODULE_REQUIREMENTS: AccessModuleRequirement[] = [
  {
    path: "/builder",
    title: "App Designer",
    description: "Build mobile experiences with reusable blocks and page workflows.",
    requiredPermissions: [PERMISSIONS.builderManage],
    requirementNotes: "Use this for teams designing or exporting customer-facing apps.",
    updatedAt: now,
  },
  {
    path: "/block-builder",
    title: "Block Builder",
    description: "Compose reusable design blocks and block presets.",
    requiredPermissions: [PERMISSIONS.builderManage],
    requirementNotes: "Provide to teams who build shared block systems.",
    updatedAt: now,
  },
  {
    path: "/function-builder",
    title: "Function Builder",
    description: "Build node-graph function pipelines and effect chains.",
    requiredPermissions: [PERMISSIONS.builderManage],
    requirementNotes: "Provide to teams who design runtime workflows and automation logic.",
    updatedAt: now,
  },
  {
    path: "/menu-management",
    title: "Menu Management",
    description: "Manage menu items, pricing, and scheduling.",
    requiredPermissions: [PERMISSIONS.menusManage],
    requirementNotes: "Grant this to operations staff responsible for menu changes.",
    updatedAt: now,
  },
  {
    path: "/rewards",
    title: "Rewards",
    description: "Configure loyalty programs, tiers, and redemption options.",
    requiredPermissions: [PERMISSIONS.rewardsManage],
    requirementNotes: "Pair with point-code generation if users need campaign publishing.",
    updatedAt: now,
  },
  {
    path: "/members",
    title: "Members",
    description: "Manage member profiles, balances, and engagement history.",
    requiredPermissions: [PERMISSIONS.membersManage],
    requirementNotes: "Include credential access for staff who reset member passwords.",
    updatedAt: now,
  },
  {
    path: "/analytics",
    title: "Analytics",
    description: "Review revenue, growth, and retention reporting.",
    requiredPermissions: [PERMISSIONS.analyticsView],
    requirementNotes: "Keep this read-focused for analyst and leadership roles.",
    updatedAt: now,
  },
  {
    path: "/whitelabeling",
    title: "Whitelabeling",
    description: "Manage themes, assets, and brand presentation.",
    requiredPermissions: [PERMISSIONS.brandingManage],
    requirementNotes: "Use for brand designers and launch teams.",
    updatedAt: now,
  },
  {
    path: "/manage-users",
    title: "Manage Users",
    description: "Create workspace users and manage account states.",
    requiredPermissions: [PERMISSIONS.usersManage],
    requirementNotes: "Restrict to administrative users.",
    updatedAt: now,
  },
  {
    path: "/access-control",
    title: "Access Control",
    description: "Manage roles, permissions, and module requirements.",
    requiredPermissions: [PERMISSIONS.accessManage],
    requirementNotes: "Restrict to trusted security administrators.",
    updatedAt: now,
  },
];
