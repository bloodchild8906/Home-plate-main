import { RequestHandler } from "express";
import { type AnalyticsSummary, type ApiResponse } from "@shared/api";
import { listMembers, listMenus, listRewardPrograms } from "../lib/database";

export const getAnalyticsSummary: RequestHandler = (_req, res) => {
  const menus = listMenus();
  const members = listMembers();
  const rewards = listRewardPrograms();
  const menuItems = menus.flatMap((menu) => menu.items);
  const totalRevenue = menuItems.reduce((sum, item) => sum + item.price * 32, 0);
  const totalRedemptions = rewards.reduce(
    (count, program) => count + program.redemptions.length,
    0,
  );
  const averageTransaction =
    menuItems.length > 0
      ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length
      : 0;

  const summary: AnalyticsSummary = {
    metrics: [
      {
        label: "Total Revenue",
        value: `$${totalRevenue.toFixed(2)}`,
        change: 7.8,
        trend: "up",
      },
      {
        label: "Active Members",
        value: members.length.toLocaleString(),
        change: 5.4,
        trend: "up",
      },
      {
        label: "Points Redeemed",
        value: String(totalRedemptions * 240),
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
      { name: "Week 1", value: Math.max(10, Math.round(members.length * 0.25)) },
      { name: "Week 2", value: Math.max(20, Math.round(members.length * 0.5)) },
      { name: "Week 3", value: Math.max(30, Math.round(members.length * 0.75)) },
      { name: "Week 4", value: Math.max(40, members.length) },
    ],
    topItemsData: menuItems.slice(0, 5).map((item) => ({
      name: item.name,
      value: Math.round(item.price * 30),
    })),
  };

  const response: ApiResponse<AnalyticsSummary> = {
    success: true,
    data: summary,
  };

  res.status(200).json(response);
};
