import { RequestHandler } from "express";
import {
  type AccessModuleRequirement,
  type AccessRole,
  type AccessRoleInput,
  type ApiResponse,
} from "@shared/api";
import {
  deleteAccessRole,
  getModuleRequirementsConfig,
  getAccessRole,
  listAccessRoles,
  setModuleRequirementsConfig,
  saveAccessRole,
} from "../lib/database";

function buildRolePayload(body: Partial<AccessRoleInput>, current?: AccessRole | null): AccessRole {
  const now = new Date().toISOString();
  const name = String(body.name ?? current?.name ?? "").trim();

  return {
    id:
      current?.id ??
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ??
      `role-${Date.now()}`,
    name,
    description: String(body.description ?? current?.description ?? "").trim(),
    color: String(body.color ?? current?.color ?? "#2563eb").trim() || "#2563eb",
    permissions: Array.isArray(body.permissions) ? body.permissions : current?.permissions ?? [],
    isSystem: current?.isSystem ?? false,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

export const getRoles: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: await listAccessRoles(),
  } satisfies ApiResponse<AccessRole[]>);
};

export const createRole: RequestHandler = async (req, res) => {
  try {
    const role = buildRolePayload(req.body);
    const created = await saveAccessRole(role);

    res.status(201).json({
      success: true,
      data: created,
    } satisfies ApiResponse<AccessRole | null>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create role",
    } satisfies ApiResponse<never>);
  }
};

export const updateRole: RequestHandler = async (req, res) => {
  const current = await getAccessRole(req.params.id);

  if (!current) {
    return res.status(404).json({
      success: false,
      error: "Role not found",
    } satisfies ApiResponse<never>);
  }

  try {
    const updated = await saveAccessRole(buildRolePayload(req.body, current));

    res.status(200).json({
      success: true,
      data: updated,
    } satisfies ApiResponse<AccessRole | null>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    } satisfies ApiResponse<never>);
  }
};

export const removeRole: RequestHandler = async (req, res) => {
  try {
    const deleted = await deleteAccessRole(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Role not found",
      } satisfies ApiResponse<never>);
    }

    res.status(200).json({
      success: true,
      data: deleted,
    } satisfies ApiResponse<AccessRole>);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete role",
    } satisfies ApiResponse<never>);
  }
};

function buildModuleRequirementPayload(
  body: Partial<AccessModuleRequirement>,
  current: AccessModuleRequirement,
): AccessModuleRequirement {
  return {
    path: current.path,
    title: String(body.title ?? current.title).trim() || current.title,
    description: String(body.description ?? current.description).trim() || current.description,
    requiredPermissions: Array.isArray(body.requiredPermissions)
      ? body.requiredPermissions
      : current.requiredPermissions,
    requirementNotes:
      String(body.requirementNotes ?? current.requirementNotes ?? "").trim(),
    updatedAt: new Date().toISOString(),
  };
}

export const getModuleRequirements: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: await getModuleRequirementsConfig(),
  } satisfies ApiResponse<AccessModuleRequirement[]>);
};

export const updateModuleRequirements: RequestHandler = async (req, res) => {
  const current = await getModuleRequirementsConfig();
  const input = Array.isArray(req.body?.requirements) ? req.body.requirements : [];
  const currentByPath = new Map(current.map((item) => [item.path, item]));
  const next = input
    .map((item: Partial<AccessModuleRequirement>) => {
      const existing = currentByPath.get(String(item.path ?? ""));
      return existing ? buildModuleRequirementPayload(item, existing) : null;
    })
    .filter(Boolean) as AccessModuleRequirement[];

  const payload = next.length > 0 ? next : current;
  const updated = await setModuleRequirementsConfig(payload);

  res.status(200).json({
    success: true,
    data: updated,
  } satisfies ApiResponse<AccessModuleRequirement[]>);
};
