import { RequestHandler } from "express";
import { type ApiResponse, type RewardProgram } from "@shared/api";
import {
  deleteRewardProgramRecord,
  getRewardProgram,
  listRewardPrograms,
  saveRewardProgram,
} from "../lib/database";

export const getRewardPrograms: RequestHandler = (_req, res) => {
  const response: ApiResponse<RewardProgram[]> = {
    success: true,
    data: listRewardPrograms(),
  };

  res.status(200).json(response);
};

export const getRewardProgramById: RequestHandler = (req, res) => {
  const program = getRewardProgram(req.params.id);

  if (!program) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  res.status(200).json({
    success: true,
    data: program,
  } satisfies ApiResponse<RewardProgram>);
};

export const createRewardProgram: RequestHandler = (req, res) => {
  const newProgram: RewardProgram = {
    id: `program-${Date.now()}`,
    name: String(req.body?.name ?? "").trim(),
    pointsPerDollar: Number(req.body?.pointsPerDollar ?? 0),
    tiers: Array.isArray(req.body?.tiers) ? req.body.tiers : [],
    redemptions: Array.isArray(req.body?.redemptions) ? req.body.redemptions : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveRewardProgram(newProgram);
  res.status(201).json({
    success: true,
    data: newProgram,
  } satisfies ApiResponse<RewardProgram>);
};

export const updateRewardProgram: RequestHandler = (req, res) => {
  const current = getRewardProgram(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  const nextProgram: RewardProgram = {
    ...current,
    ...req.body,
    id: current.id,
    pointsPerDollar: Number(req.body?.pointsPerDollar ?? current.pointsPerDollar),
    tiers: Array.isArray(req.body?.tiers) ? req.body.tiers : current.tiers,
    redemptions: Array.isArray(req.body?.redemptions)
      ? req.body.redemptions
      : current.redemptions,
    updatedAt: new Date().toISOString(),
  };

  saveRewardProgram(nextProgram);
  res.status(200).json({
    success: true,
    data: nextProgram,
  } satisfies ApiResponse<RewardProgram>);
};

export const deleteRewardProgram: RequestHandler = (req, res) => {
  const deleted = deleteRewardProgramRecord(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    });
  }

  res.status(200).json({
    success: true,
    data: deleted,
  } satisfies ApiResponse<RewardProgram>);
};
