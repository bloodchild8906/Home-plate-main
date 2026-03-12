import type { AccessRole, PermissionId, User } from "@shared/api";
import {
  DEFAULT_ACCESS_ROLES,
  PERMISSION_CATALOG,
  getDefaultRole,
} from "@shared/access-control";

export function getPermissionLabel(permissionId: PermissionId | string) {
  return (
    PERMISSION_CATALOG.find((permission) => permission.id === permissionId)?.label ??
    permissionId
  );
}

export function describePermissions(permissionIds: Array<PermissionId | string>) {
  return permissionIds.map(getPermissionLabel).join(", ");
}

export function getRoleLabel(roleId: string, roles?: AccessRole[]) {
  return (
    roles?.find((role) => role.id === roleId)?.name ??
    getDefaultRole(roleId)?.name ??
    roleId
  );
}

export function getRoleColor(roleId: string, roles?: AccessRole[]) {
  return (
    roles?.find((role) => role.id === roleId)?.color ??
    getDefaultRole(roleId)?.color ??
    "#64748b"
  );
}

export function getUserRoleLabel(user: Pick<User, "role" | "roleName">) {
  return user.roleName || getRoleLabel(user.role, DEFAULT_ACCESS_ROLES);
}
