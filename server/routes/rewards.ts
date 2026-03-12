import { randomBytes } from "node:crypto";
import { RequestHandler } from "express";
import {
  type ApiResponse,
  type RewardPointGenerator,
  type RewardPointGeneratorInput,
  type RewardProgram,
} from "@shared/api";
import {
  deleteRewardProgramRecord,
  getRewardProgram,
  listRewardPrograms,
  saveRewardProgram,
} from "../lib/database";

export const getRewardPrograms: RequestHandler = async (_req, res) => {
  const response: ApiResponse<RewardProgram[]> = {
    success: true,
    data: await listRewardPrograms(),
  };

  res.status(200).json(response);
};

export const getRewardProgramById: RequestHandler = async (req, res) => {
  const program = await getRewardProgram(req.params.id);

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

export const createRewardProgram: RequestHandler = async (req, res) => {
  const newProgram: RewardProgram = {
    id: `program-${Date.now()}`,
    name: String(req.body?.name ?? "").trim(),
    pointsPerDollar: Number(req.body?.pointsPerDollar ?? 0),
    tiers: Array.isArray(req.body?.tiers) ? req.body.tiers : [],
    redemptions: Array.isArray(req.body?.redemptions) ? req.body.redemptions : [],
    pointGenerators: Array.isArray(req.body?.pointGenerators) ? req.body.pointGenerators : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveRewardProgram(newProgram);
  res.status(201).json({
    success: true,
    data: newProgram,
  } satisfies ApiResponse<RewardProgram>);
};

export const updateRewardProgram: RequestHandler = async (req, res) => {
  const current = await getRewardProgram(req.params.id);

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
    pointGenerators: Array.isArray(req.body?.pointGenerators)
      ? req.body.pointGenerators
      : current.pointGenerators,
    updatedAt: new Date().toISOString(),
  };

  await saveRewardProgram(nextProgram);
  res.status(200).json({
    success: true,
    data: nextProgram,
  } satisfies ApiResponse<RewardProgram>);
};

export const deleteRewardProgram: RequestHandler = async (req, res) => {
  const deleted = await deleteRewardProgramRecord(req.params.id);

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

export const createPointGenerator: RequestHandler = async (req, res) => {
  const current = await getRewardProgram(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Reward program not found",
    } satisfies ApiResponse<never>);
  }

  const body = req.body as Partial<RewardPointGeneratorInput>;
  const code = randomBytes(4).toString("hex").toUpperCase();
  const generator: RewardPointGenerator = {
    id: `generator-${Date.now()}`,
    name: String(body.name ?? "").trim() || "Generated points",
    kind: body.kind ?? "qr",
    points: Number(body.points ?? 0),
    code,
    payload: `homeplate://points/${current.id}/${code}`,
    description: String(body.description ?? "").trim() || "Generated loyalty earning code.",
    expiresAt: String(body.expiresAt ?? "").trim() || undefined,
    createdAt: new Date().toISOString(),
    redemptionCount: 0,
  };

  const updatedProgram: RewardProgram = {
    ...current,
    pointGenerators: [generator, ...(current.pointGenerators ?? [])],
    updatedAt: new Date().toISOString(),
  };

  await saveRewardProgram(updatedProgram);
  res.status(201).json({
    success: true,
    data: generator,
  } satisfies ApiResponse<RewardPointGenerator>);
};
