import { RequestHandler } from "express";
import { type AnalyticsSummary, type ApiResponse } from "@shared/api";
import { listAccessRoles, listMembers, listMenus, listRewardPrograms, listUsers } from "../lib/database";

export const getAnalyticsSummary: RequestHandler = async (_req, res) => {
  const [menus, members, rewards, users, roles] = await Promise.all([
    listMenus(),
    listMembers(),
    listRewardPrograms(),
    listUsers(),
    listAccessRoles(),
  ]);
  const menuItems = menus.flatMap((menu) => menu.items);
  const specials = menus.flatMap((menu) => menu.specials);
  const pointGenerators = rewards.flatMap((program) => program.pointGenerators ?? []);
  const totalRevenue = menuItems.reduce((sum, item) => sum + item.price * 46, 0);
  const totalSpend = members.reduce((sum, member) => sum + (member.totalSpend ?? 0), 0);
  const totalRedemptions = rewards.reduce((count, program) => count + program.redemptions.length, 0);
  const totalPointsBalance = members.reduce((sum, member) => sum + member.loyaltyPoints, 0);
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

  const summary: AnalyticsSummary = {
    metrics: [
      {
        label: "Revenue Projection",
        value: `$${totalRevenue.toFixed(0)}`,
        change: 12.6,
        trend: "up",
      },
      {
        label: "Member Lifetime Spend",
        value: `$${totalSpend.toFixed(0)}`,
        change: 8.3,
        trend: "up",
      },
      {
        label: "Open Point Codes",
        value: String(pointGenerators.length),
        change: specials.length > 0 ? 6.1 : 0,
        trend: specials.length > 0 ? "up" : "neutral",
      },
      {
        label: "Average Ticket",
        value: `$${averageTransaction.toFixed(2)}`,
        change: 2.4,
        trend: "up",
      },
    ],
    revenueData: menus.slice(0, 6).map((menu, index) => ({
      name: menu.name.slice(0, 12) || `Menu ${index + 1}`,
      value: Math.round(menu.items.reduce((sum, item) => sum + item.price * 22, 0)),
    })),
    memberGrowthData: [
      { name: "Jan", value: Math.max(12, Math.round(members.length * 0.25)) },
      { name: "Feb", value: Math.max(18, Math.round(members.length * 0.45)) },
      { name: "Mar", value: Math.max(24, Math.round(members.length * 0.65)) },
      { name: "Apr", value: Math.max(30, Math.round(members.length * 0.82)) },
      { name: "May", value: Math.max(34, members.length) },
    ],
    topItemsData: menuItems.slice(0, 6).map((item) => ({
      name: item.name,
      value: Math.round((item.specialPrice ?? item.price) * 28),
    })),
    channelMixData: [
      { name: "QR", value: pointGenerators.filter((generator) => generator.kind === "qr").length || 1 },
      { name: "Text", value: pointGenerators.filter((generator) => generator.kind === "text_code").length || 1 },
      { name: "Scan Card", value: pointGenerators.filter((generator) => generator.kind === "scan_card").length || 1 },
      { name: "Specials", value: specials.length || 1 },
    ],
    tierDistributionData: Object.entries(tierCounts).map(([name, value]) => ({ name, value })),
    locationPerformanceData: Object.entries(locationSpend).map(([name, value]) => ({
      name,
      value: Math.round(value),
    })),
    activityFeed: [
      {
        id: "activity-points",
        title: "Point earning campaigns are active",
        detail: `${pointGenerators.length} reusable earning codes are available for the companion app.`,
        time: "Updated just now",
        category: "points",
      },
      {
        id: "activity-specials",
        title: "Menu specials are driving discovery",
        detail: `${specials.length} active menu specials are currently attached across ${menus.length} menus.`,
        time: "Today",
        category: "menus",
      },
      {
        id: "activity-members",
        title: "Member balances remain healthy",
        detail: `${members.length} member profiles are tracked with ${totalPointsBalance.toLocaleString()} points in circulation.`,
        time: "Today",
        category: "members",
      },
      {
        id: "activity-rewards",
        title: "Rewards catalog is expanding",
        detail: `${totalRedemptions} redemption options are available across ${rewards.length} programs.`,
        time: "This week",
        category: "rewards",
      },
      {
        id: "activity-security",
        title: "Access model is configurable",
        detail: `${roles.length} roles and ${users.length} user accounts are currently governed through the new permission model.`,
        time: "This week",
        category: "security",
      },
    ],
  };

  const response: ApiResponse<AnalyticsSummary> = {
    success: true,
    data: summary,
  };

  res.status(200).json(response);
};
