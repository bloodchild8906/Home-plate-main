import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AccessModuleRequirement,
  type AccessRole,
  type AccessRoleInput,
  type ApiResponse,
  type PermissionId,
  type User,
} from "@shared/api";
import { PERMISSION_CATALOG } from "@shared/access-control";
import {
  Check,
  Info,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPermissionLabel } from "@/lib/access-control";
import { APP_ROUTES } from "@/lib/navigation";

const EMPTY_DRAFT: AccessRoleInput = {
  name: "",
  description: "",
  color: "#2563eb",
  permissions: [],
};

const EMPTY_MODULE: AccessModuleRequirement = {
  path: "",
  title: "",
  description: "",
  requiredPermissions: [],
  requirementNotes: "",
  updatedAt: new Date().toISOString(),
};

export default function AccessControl() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null);
  const [editingModulePath, setEditingModulePath] = useState("");
  const [draft, setDraft] = useState<AccessRoleInput>(EMPTY_DRAFT);
  const [moduleDraft, setModuleDraft] = useState<AccessModuleRequirement>(EMPTY_MODULE);

  const { data: rolesResponse } = useQuery<ApiResponse<AccessRole[]>>({
    queryKey: ["access-roles"],
    queryFn: async () => {
      const response = await fetch("/api/access-control/roles");
      if (!response.ok) throw new Error("Failed to load roles");
      return response.json();
    },
  });

  const { data: usersResponse } = useQuery<ApiResponse<User[]>>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to load users");
      return response.json();
    },
  });

  const { data: moduleRequirementsResponse, isLoading: modulesLoading } =
    useQuery<ApiResponse<AccessModuleRequirement[]>>({
      queryKey: ["module-requirements"],
      queryFn: async () => {
        const response = await fetch("/api/access-control/module-requirements");
        if (!response.ok) throw new Error("Failed to load module requirements");
        return response.json();
      },
    });

  const saveRoleMutation = useMutation({
    mutationFn: async (payload: AccessRoleInput) => {
      const response = await fetch(
        editingRole
          ? `/api/access-control/roles/${editingRole.id}`
          : "/api/access-control/roles",
        {
          method: editingRole ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ApiResponse<AccessRole>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to save role");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-roles"] });
      setOpen(false);
      setEditingRole(null);
      setDraft(EMPTY_DRAFT);
    },
  });

  const updateModuleRequirementsMutation = useMutation({
    mutationFn: async (requirements: AccessModuleRequirement[]) => {
      const response = await fetch("/api/access-control/module-requirements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements }),
      });
      const result = (await response.json()) as ApiResponse<AccessModuleRequirement[]>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to update module requirements");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-requirements"] });
      setModuleOpen(false);
      setEditingModulePath("");
      setModuleDraft(EMPTY_MODULE);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/access-control/roles/${id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<AccessRole>;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete role");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-roles"] });
    },
  });

  const roles = rolesResponse?.data ?? [];
  const users = usersResponse?.data ?? [];
  const customRoles = roles.filter((role) => !role.isSystem);
  const fallbackModules = useMemo<AccessModuleRequirement[]>(
    () =>
      APP_ROUTES.map((route) => ({
        path: route.path,
        title: route.title,
        description: route.shortDescription,
        requiredPermissions: route.requiredPermissions,
        requirementNotes: route.description,
        updatedAt: new Date().toISOString(),
      })),
    [],
  );
  const moduleRequirements = moduleRequirementsResponse?.data?.length
    ? moduleRequirementsResponse.data
    : fallbackModules;

  const permissionById = useMemo(
    () => new Map(PERMISSION_CATALOG.map((permission) => [permission.id, permission])),
    [],
  );

  const openCreate = () => {
    setEditingRole(null);
    setDraft(EMPTY_DRAFT);
    setOpen(true);
  };

  const openEdit = (role: AccessRole) => {
    if (role.isSystem) {
      return;
    }
    setEditingRole(role);
    setDraft({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: role.permissions,
    });
    setOpen(true);
  };

  const openModuleEdit = (module: AccessModuleRequirement) => {
    setEditingModulePath(module.path);
    setModuleDraft({
      ...module,
      requiredPermissions: [...module.requiredPermissions],
    });
    setModuleOpen(true);
  };

  const saveModuleRequirement = () => {
    const nextRequirements = moduleRequirements.map((module) => {
      if (module.path !== editingModulePath) {
        return module;
      }

      return {
        ...module,
        title: moduleDraft.title.trim() || module.title,
        description: moduleDraft.description.trim() || module.description,
        requirementNotes: moduleDraft.requirementNotes.trim(),
        requiredPermissions: [...new Set(moduleDraft.requiredPermissions)],
        updatedAt: new Date().toISOString(),
      };
    });

    updateModuleRequirementsMutation.mutate(nextRequirements);
  };

  return (
    <AppShell
      title="Access Control"
      description="Create custom permission roles, inspect module requirements, and assign cleaner access templates to workspace users."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Custom role
        </Button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Roles" value={String(roles.length)} helper="System and custom templates" />
        <MetricCard label="Custom" value={String(customRoles.length)} helper="Editable roles" />
        <MetricCard label="Permissions" value={String(PERMISSION_CATALOG.length)} helper="Available controls" />
        <MetricCard label="Assigned users" value={String(users.length)} helper="Accounts governed here" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tight">Role catalog</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {roles.map((role) => {
              const assigned = users.filter((user) => user.role === role.id);
              return (
                <div key={role.id} className="rounded-[1.75rem] border border-border/60 bg-background/80 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: role.color }} />
                        <div className="text-lg font-black">{role.name}</div>
                        {role.isSystem ? <Badge variant="outline">System</Badge> : <Badge>Custom</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {!role.isSystem ? (
                        <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                          Edit
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Locked
                        </Button>
                      )}
                      {!role.isSystem ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Delete ${role.name}?`)) {
                              deleteRoleMutation.mutate(role.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="rounded-full px-3 py-1">
                        {getPermissionLabel(permission)}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 rounded-3xl border border-border/60 bg-muted/20 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Assigned users</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {assigned.length > 0 ? (
                        assigned.map((user) => (
                          <Badge key={user.id} variant="outline" className="rounded-full px-3 py-1">
                            {user.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No users assigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 bg-card/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-black tracking-tight">Module rights matrix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="hidden md:block">
                <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Module</TableHead>
                        <TableHead className="whitespace-nowrap">Required rights</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role.id} className="whitespace-nowrap text-center">
                            {role.name}
                          </TableHead>
                        ))}
                        <TableHead className="whitespace-nowrap text-right">Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulesLoading ? (
                        <TableRow>
                          <TableCell colSpan={roles.length + 3} className="py-10 text-center text-sm text-muted-foreground">
                            Loading module requirements...
                          </TableCell>
                        </TableRow>
                      ) : (
                        moduleRequirements.map((module) => (
                          <TableRow key={module.path}>
                            <TableCell className="min-w-[240px]">
                              <div className="flex items-center gap-2 font-bold">
                                {module.title}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-muted-foreground transition hover:text-foreground">
                                      <Info className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs space-y-1">
                                    <div className="font-semibold">{module.description}</div>
                                    <div className="text-xs">{module.requirementNotes || "No requirement notes yet."}</div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">{module.path}</div>
                            </TableCell>
                            <TableCell className="min-w-[280px]">
                              <div className="flex flex-wrap gap-2">
                                {module.requiredPermissions.map((permission) => (
                                  <Tooltip key={permission}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                                        {getPermissionLabel(permission)}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {permissionById.get(permission)?.description ?? "Permission"}
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </TableCell>
                            {roles.map((role) => {
                              const hasAccess = module.requiredPermissions.every((permission) =>
                                role.permissions.includes(permission),
                              );

                              return (
                                <TableCell key={`${module.path}-${role.id}`} className="text-center">
                                  {hasAccess ? (
                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <X className="mx-auto h-4 w-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openModuleEdit(module)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {moduleRequirements.map((module) => (
                  <div key={`mobile-${module.path}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{module.title}</div>
                        <div className="text-xs text-muted-foreground">{module.description}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openModuleEdit(module)}>
                        Edit
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {module.requiredPermissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="rounded-full px-3 py-1">
                          {getPermissionLabel(permission)}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {module.requirementNotes || "No requirement notes yet."}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {roles.map((role) => {
                        const hasAccess = module.requiredPermissions.every((permission) =>
                          role.permissions.includes(permission),
                        );
                        return (
                          <div key={`${module.path}-mobile-${role.id}`} className="rounded-xl border border-border/60 bg-muted/20 px-2 py-1.5">
                            <span className="font-semibold">{role.name}:</span>{" "}
                            <span className={hasAccess ? "text-emerald-600" : "text-muted-foreground"}>
                              {hasAccess ? "Allowed" : "Blocked"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-slate-950 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                Permission design notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-300">
              <PolicyItem title="Custom roles are permission-based" value="Access is derived from permissions, not hard-coded route names." />
              <PolicyItem title="System roles are locked" value="Administrator, App Designer, Store Operator, and Analyst remain baseline templates." />
              <PolicyItem title="Users inherit rights instantly" value="Changing a user role updates the permissions exposed throughout the workspace." />
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[100vh] max-w-[100vw] overflow-y-auto p-0 sm:max-w-4xl">
          <DialogHeader className="border-b border-border/60 p-5 pb-4">
            <DialogTitle>{editingRole ? `Edit ${editingRole.name}` : "Create custom role"}</DialogTitle>
            <DialogDescription>
              Configure a reusable permission bundle that can be assigned to workspace users.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5 p-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveRoleMutation.mutate(draft);
            }}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <Field label="Role name">
                <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Color">
                <Input type="color" value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} required />
            </Field>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {PERMISSION_CATALOG.map((permission) => {
                  const checked = draft.permissions.includes(permission.id);
                  return (
                    <label
                      key={permission.id}
                      className="flex items-start gap-3 rounded-3xl border border-border/60 bg-background/80 p-4"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setDraft((current) => ({
                            ...current,
                            permissions: value
                              ? [...current.permissions, permission.id]
                              : current.permissions.filter((item) => item !== permission.id),
                          }));
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2 font-bold">
                          {permission.label}
                          {checked ? <Check className="h-4 w-4 text-emerald-500" /> : null}
                        </div>
                        <div className="text-sm text-muted-foreground">{permission.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 pt-4">
              <Button type="submit" disabled={saveRoleMutation.isPending}>
                {saveRoleMutation.isPending ? "Saving..." : editingRole ? "Save role" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={moduleOpen} onOpenChange={setModuleOpen}>
        <DialogContent className="max-h-[100vh] max-w-[100vw] overflow-y-auto p-0 sm:max-w-3xl">
          <DialogHeader className="border-b border-border/60 p-5 pb-4">
            <DialogTitle>Edit module requirements</DialogTitle>
            <DialogDescription>
              Adjust which permissions are required to open this module and update the operator guidance.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5 p-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveModuleRequirement();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Module title">
                <Input
                  value={moduleDraft.title}
                  onChange={(event) =>
                    setModuleDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Path">
                <Input value={moduleDraft.path} disabled />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={moduleDraft.description}
                onChange={(event) =>
                  setModuleDraft((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
            </Field>

            <Field label="Requirement notes (tooltip)">
              <Textarea
                value={moduleDraft.requirementNotes}
                onChange={(event) =>
                  setModuleDraft((current) => ({
                    ...current,
                    requirementNotes: event.target.value,
                  }))
                }
                placeholder="Add operator notes shown in the module info tooltip."
              />
            </Field>

            <div className="space-y-3">
              <Label>Permission matrix</Label>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[90px] text-right">Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_CATALOG.map((permission) => {
                      const checked = moduleDraft.requiredPermissions.includes(permission.id);
                      return (
                        <TableRow key={`module-permission-${permission.id}`}>
                          <TableCell className="font-semibold">{permission.label}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{permission.description}</TableCell>
                          <TableCell className="text-right">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                setModuleDraft((current) => ({
                                  ...current,
                                  requiredPermissions: value
                                    ? [...current.requiredPermissions, permission.id]
                                    : current.requiredPermissions.filter((item) => item !== permission.id),
                                }));
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 pt-4">
              <Button type="submit" disabled={updateModuleRequirementsMutation.isPending}>
                {updateModuleRequirementsMutation.isPending ? "Saving..." : "Save requirements"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-lg">
      <CardContent className="p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
      </CardContent>
    </Card>
  );
}

function PolicyItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 font-bold text-white">
        <LockKeyhole className="h-4 w-4 text-amber-300" />
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-300">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
