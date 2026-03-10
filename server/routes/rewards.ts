import { RequestHandler } from "express";
import { RewardProgram, ApiResponse } from "@shared/api";

// Mock data
const mockRewardPrograms: RewardProgram[] = [
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

export const getRewardPrograms: RequestHandler = (req, res) => {
  const response: ApiResponse<RewardProgram[]> = {
    success: true,
    data: mockRewardPrograms,
  };
  res.status(200).json(response);
};

export const getRewardProgramById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const program = mockRewardPrograms.find((p) => p.id === id);

  if (!program) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  res.status(200).json({
    success: true,
    data: program,
  });
};

export const createRewardProgram: RequestHandler = (req, res) => {
  const { name, pointsPerDollar, tiers, redemptions } = req.body;

  const newProgram: RewardProgram = {
    id: `program-${Date.now()}`,
    name,
    pointsPerDollar,
    tiers: tiers || [],
    redemptions: redemptions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRewardPrograms.push(newProgram);

  res.status(201).json({
    success: true,
    data: newProgram,
  });
};

export const updateRewardProgram: RequestHandler = (req, res) => {
  const { id } = req.params;
  const program = mockRewardPrograms.find((p) => p.id === id);

  if (!program) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  Object.assign(program, req.body, {
    updatedAt: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    data: program,
  });
};

export const deleteRewardProgram: RequestHandler = (req, res) => {
  const { id } = req.params;
  const index = mockRewardPrograms.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  const deletedProgram = mockRewardPrograms.splice(index, 1);

  res.status(200).json({
    success: true,
    data: deletedProgram[0],
  });
};
