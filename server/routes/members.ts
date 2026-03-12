import { RequestHandler } from "express";
import {
  type ApiResponse,
  type Member,
  type MemberTagDefinition,
  type MemberUpsertInput,
  type PaginatedResponse,
} from "@shared/api";
import {
  deleteMemberRecord,
  getMember,
  getMembersPage,
  listMemberTags,
  saveMember,
  setMemberTags,
} from "../lib/database";

function buildMemberPayload(
  body: Partial<MemberUpsertInput>,
  current?: Member | null,
): { member: Omit<Member, "passwordSet">; password?: string } {
  const now = new Date().toISOString();

  return {
    member: {
      id: current?.id ?? `member-${Date.now()}`,
      username: String(body.username ?? current?.username ?? "").trim(),
      email: String(body.email ?? current?.email ?? "").trim(),
      name: String(body.name ?? current?.name ?? "").trim(),
      status: body.status ?? current?.status ?? "Active",
      phone: String(body.phone ?? current?.phone ?? "").trim() || undefined,
      loyaltyPoints: Number(body.loyaltyPoints ?? current?.loyaltyPoints ?? 0),
      tier: String(body.tier ?? current?.tier ?? "Bronze").trim() || "Bronze",
      joinDate:
        String(body.joinDate ?? current?.joinDate ?? now.split("T")[0]).trim() ||
        now.split("T")[0],
      lastVisit: String(body.lastVisit ?? current?.lastVisit ?? "").trim() || undefined,
      favoriteLocation:
        String(body.favoriteLocation ?? current?.favoriteLocation ?? "").trim() || undefined,
      address: String(body.address ?? current?.address ?? "").trim() || undefined,
      dateOfBirth: String(body.dateOfBirth ?? current?.dateOfBirth ?? "").trim() || undefined,
      notes: String(body.notes ?? current?.notes ?? "").trim() || undefined,
      tags: Array.isArray(body.tags) ? body.tags : current?.tags ?? [],
      marketingOptIn: Boolean(body.marketingOptIn ?? current?.marketingOptIn ?? false),
      totalSpend: Number(body.totalSpend ?? current?.totalSpend ?? 0),
      visits: Number(body.visits ?? current?.visits ?? 0),
      avatar: String(body.avatar ?? current?.avatar ?? "").trim() || undefined,
      passwordUpdatedAt: current?.passwordUpdatedAt,
      companionAccessCode:
        String(body.companionAccessCode ?? current?.companionAccessCode ?? "").trim() || undefined,
    },
    password: typeof body.password === "string" && body.password.trim() ? body.password : undefined,
  };
}

function normalizeTag(entry: Partial<MemberTagDefinition> | string, index = 0): MemberTagDefinition {
  const now = new Date().toISOString();
  const label = typeof entry === "string" ? entry : String(entry.label ?? "").trim();
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: (typeof entry === "string" ? "" : entry.id ?? "").trim() || slug || `tag-${Date.now()}-${index}`,
    label: label || `Tag ${index + 1}`,
    color:
      (typeof entry === "string" ? "" : String(entry.color ?? "").trim()) || "#2563eb",
    description: typeof entry === "string" ? "" : String(entry.description ?? "").trim(),
    createdAt:
      (typeof entry === "string" ? "" : String(entry.createdAt ?? "").trim()) || now,
    updatedAt: now,
  };
}

async function syncMemberTagCatalog(memberTags: string[]) {
  if (!Array.isArray(memberTags) || memberTags.length === 0) {
    return;
  }

  const existing = await listMemberTags();
  const existingLabels = new Set(existing.map((tag) => tag.label.toLowerCase()));
  const additions = memberTags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag) => !existingLabels.has(tag.toLowerCase()))
    .map((tag, index) => normalizeTag(tag, index));

  if (additions.length > 0) {
    await setMemberTags([...existing, ...additions]);
  }
}

export const getMembers: RequestHandler = async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = Math.max(1, Number(req.query.limit ?? 50) || 50);

  const response: ApiResponse<PaginatedResponse<Member>> = {
    success: true,
    data: await getMembersPage(page, limit),
  };

  res.status(200).json(response);
};

export const getMemberById: RequestHandler = async (req, res) => {
  const member = await getMember(req.params.id);

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

export const createMember: RequestHandler = async (req, res) => {
  try {
    const { member, password } = buildMemberPayload(req.body);

    if (!member.username || !member.email || !member.name) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and name are required.",
      } satisfies ApiResponse<never>);
    }

    const created = await saveMember(member, password);
    await syncMemberTagCatalog(created.tags);

    res.status(201).json({
      success: true,
      data: created,
    } satisfies ApiResponse<Member>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create member",
    } satisfies ApiResponse<never>);
  }
};

export const updateMember: RequestHandler = async (req, res) => {
  const current = await getMember(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  try {
    const { member, password } = buildMemberPayload(req.body, current);
    const updated = await saveMember(member, password);
    await syncMemberTagCatalog(updated.tags);

    res.status(200).json({
      success: true,
      data: updated,
    } satisfies ApiResponse<Member>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update member",
    } satisfies ApiResponse<never>);
  }
};

export const deleteMember: RequestHandler = async (req, res) => {
  const deleted = await deleteMemberRecord(req.params.id);

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

export const addPoints: RequestHandler = async (req, res) => {
  const member = await getMember(req.params.id);

  if (!member) {
    return res.status(404).json({
      success: false,
      error: "Member not found",
    });
  }

  const points = Number(req.body?.points ?? 0);
  const updatedMember = await saveMember({
    ...member,
    loyaltyPoints: member.loyaltyPoints + points,
  });

  res.status(200).json({
    success: true,
    data: updatedMember,
  } satisfies ApiResponse<Member>);
};

export const getMemberTags: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: await listMemberTags(),
  } satisfies ApiResponse<MemberTagDefinition[]>);
};

export const updateMemberTags: RequestHandler = async (req, res) => {
  const bodyTags = Array.isArray(req.body?.tags) ? req.body.tags : [];
  const normalized = bodyTags.map((tag, index) => normalizeTag(tag, index));
  const deduplicated = normalized.filter((tag, index, array) => {
    return array.findIndex((candidate) => candidate.label.toLowerCase() === tag.label.toLowerCase()) === index;
  });

  const saved = await setMemberTags(deduplicated);
  res.status(200).json({
    success: true,
    data: saved,
  } satisfies ApiResponse<MemberTagDefinition[]>);
};
