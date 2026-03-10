import { RequestHandler } from "express";
import { AnalyticsSummary, ApiResponse } from "@shared/api";

export const getAnalyticsSummary: RequestHandler = (req, res) => {
  const summary: AnalyticsSummary = {
    metrics: [
      {
        label: "Total Revenue",
        value: "$142,847.50",
        change: 12.5,
        trend: "up",
      },
      {
        label: "Active Members",
        value: "2,847",
        change: 8.2,
        trend: "up",
      },
      {
        label: "Points Redeemed",
        value: "48,362",
        change: -3.1,
        trend: "down",
      },
      {
        label: "Avg. Transaction",
        value: "$34.12",
        change: 1.5,
        trend: "neutral",
      },
    ],
    revenueData: [
      { name: "Jan", value: 4000 },
      { name: "Feb", value: 3000 },
      { name: "Mar", value: 2000 },
      { name: "Apr", value: 2780 },
      { name: "May", value: 1890 },
      { name: "Jun", value: 2390 },
      { name: "Jul", value: 3490 },
    ],
    memberGrowthData: [
      { name: "Week 1", value: 100 },
      { name: "Week 2", value: 250 },
      { name: "Week 3", value: 380 },
      { name: "Week 4", value: 520 },
    ],
    topItemsData: [
      { name: "Signature Burger", value: 450 },
      { name: "Caesar Salad", value: 320 },
      { name: "French Fries", value: 680 },
      { name: "Soft Drink", value: 590 },
      { name: "Ice Cream", value: 120 },
    ],
  };

  const response: ApiResponse<AnalyticsSummary> = {
    success: true,
    data: summary,
  };

  res.status(200).json(response);
};
