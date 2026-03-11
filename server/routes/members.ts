import { RequestHandler } from "express";
import {
  type ApiResponse,
  type Member,
  type PaginatedResponse,
} from "@shared/api";
import {
  deleteMemberRecord,
  getMember,
  getMembersPage,
  saveMember,
} from "../lib/database";

export const getMembers: RequestHandler = (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.max(1, Number(req.query.limit ?? 10) || 10);

  const response: ApiResponse<PaginatedResponse<Member>> = {
    success: true,
    data: getMembersPage(page, limit),
  };

  res.status(200).json(response);
};

export const getMemberById: RequestHandler = (req, res) => {
  const member = getMember(req.params.id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  res.status(200).json({
    success: true,
    data: member,
  } satisfies ApiResponse<Member>);
};

export const createMember: RequestHandler = (req, res) => {
  const newMember: Member = {
    id: `member-${Date.now()}`,
    email: String(req.body?.email ?? "").trim(),
    name: String(req.body?.name ?? "").trim(),
    phone: String(req.body?.phone ?? "").trim() || undefined,
    loyaltyPoints: 0,
    tier: "Bronze",
    joinDate: new Date().toISOString().split("T")[0],
  };

  saveMember(newMember);
  res.status(201).json({
    success: true,
    data: newMember,
  } satisfies ApiResponse<Member>);
};

export const updateMember: RequestHandler = (req, res) => {
  const current = getMember(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  const nextMember: Member = {
    ...current,
    ...req.body,
    id: current.id,
    loyaltyPoints: Number(req.body?.loyaltyPoints ?? current.loyaltyPoints),
  };

  saveMember(nextMember);
  res.status(200).json({
    success: true,
    data: nextMember,
  } satisfies ApiResponse<Member>);
};

export const deleteMember: RequestHandler = (req, res) => {
  const deleted = deleteMemberRecord(req.params.id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  res.status(200).json({
    success: true,
    data: deleted,
  } satisfies ApiResponse<Member>);
};

export const addPoints: RequestHandler = (req, res) => {
  const member = getMember(req.params.id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  const points = Number(req.body?.points ?? 0);
  const updatedMember: Member = {
    ...member,
    loyaltyPoints: member.loyaltyPoints + points,
  };

  saveMember(updatedMember);
  res.status(200).json({
    success: true,
    data: updatedMember,
  } satisfies ApiResponse<Member>);
};
