import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserCog, ShieldCheck, KeyRound } from "lucide-react";
import { type AccessRole, type ApiResponse, type User, type UserUpsertInput } from "@shared/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { describePermissions, getRoleColor, getUserRoleLabel } from "@/lib/access-control";

type UserDraft = UserUpsertInput;

const EMPTY_DRAFT: UserDraft = {
  username: "",
  email: "",
  name: "",
  role: "operator",
  status: "Pending",
  phone: "",
  title: "",
  department: "",
  notes: "",
  avatar: "",
  password: "",
};

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<UserDraft>(EMPTY_DRAFT);

  const { data: usersResponse, isLoading } = useQuery<ApiResponse<User[]>>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to load users");
      return response.json();
    },
  });

  const { data: rolesResponse } = useQuery<ApiResponse<AccessRole[]>>({
    queryKey: ["access-roles"],
    queryFn: async () => {
      const response = await fetch("/api/access-control/roles");
      if (!response.ok) throw new Error("Failed to load roles");
      return response.json();
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: async (payload: UserDraft) => {
      const response = await fetch(editingUser ? `/api/users/${editingUser.id}` : "/api/users", {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<User>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to save user");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setEditingUser(null);
      setDraft(EMPTY_DRAFT);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<User>;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete user");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const users = usersResponse?.data ?? [];
  const roles = rolesResponse?.data ?? [];
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.username} ${user.roleName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const activeUsers = users.filter((user) => user.status === "Active").length;
  const pendingUsers = users.filter((user) => user.status === "Pending").length;
  const customRoles = roles.filter((role) => !role.isSystem).length;

  const startCreate = () => {
    setEditingUser(null);
    setDraft(EMPTY_DRAFT);
    setOpen(true);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setDraft({
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      phone: user.phone ?? "",
      title: user.title ?? "",
      department: user.department ?? "",
      notes: user.notes ?? "",
      avatar: user.avatar ?? "",
      password: "",
    });
    setOpen(true);
  };

  const selectedRole = roles.find((role) => role.id === draft.role);

  return (
    <AppShell
      title="User Management"
      description="Create internal users with full profiles, assign access roles, and control credential resets from one admin surface."
      actions={
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New user
        </Button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <SummaryCard label="Users" value={String(users.length)} helper="Workspace accounts" icon={<UserCog className="h-5 w-5" />} />
        <SummaryCard label="Active" value={String(activeUsers)} helper="Live access" icon={<ShieldCheck className="h-5 w-5" />} />
        <SummaryCard label="Pending" value={String(pendingUsers)} helper="Needs activation" icon={<KeyRound className="h-5 w-5" />} />
        <SummaryCard label="Custom roles" value={String(customRoles)} helper="Role templates available" icon={<ShieldCheck className="h-5 w-5" />} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">User directory</CardTitle>
              <p className="text-sm text-muted-foreground">Full profiles, login credentials, and access rights.</p>
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="max-w-sm rounded-2xl"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden lg:block">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Access</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Last login</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-[260px]">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white"
                          style={{ backgroundColor: getRoleColor(user.role, roles) }}
                        >
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            @{user.username} | {user.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[user.title, user.department].filter(Boolean).join(" / ") || "Profile pending"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {getUserRoleLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[260px] text-xs text-muted-foreground">
                      {describePermissions(user.permissions)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "No login yet"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(user)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Delete ${user.name}?`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {isLoading ? (
                <div className="rounded-2xl border border-border/60 bg-background/80 p-5 text-center text-sm text-muted-foreground">
                  Loading users...
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={`mobile-${user.id}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {getUserRoleLabel(user)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "No login yet"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {[user.title, user.department].filter(Boolean).join(" / ") || "Profile pending"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {describePermissions(user.permissions)}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete ${user.name}?`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tight">Role visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles.map((role) => {
              const assignedUsers = users.filter((user) => user.role === role.id).length;

              return (
                <div key={role.id} className="rounded-3xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: role.color }} />
                      <div className="font-bold">{role.name}</div>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {assignedUsers} assigned
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {describePermissions(role.permissions)}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? `Edit ${editingUser.name}` : "Create user"}</DialogTitle>
            <DialogDescription>
              Manage workspace identity, account status, and access role assignment.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveUserMutation.mutate(draft);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Username">
                <Input value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))} required />
              </Field>
              <Field label="Email">
                <Input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} required />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Set password"}
                  value={draft.password ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
                />
              </Field>
              <Field label="Title">
                <Input value={draft.title ?? ""} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
              </Field>
              <Field label="Department">
                <Input value={draft.department ?? ""} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))} />
              </Field>
              <Field label="Phone">
                <Input value={draft.phone ?? ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
              </Field>
              <Field label="Status">
                <Select value={draft.status} onValueChange={(value: User["status"]) => setDraft((current) => ({ ...current, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Role">
                <Select value={draft.role} onValueChange={(value) => setDraft((current) => ({ ...current, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Profile notes">
              <Textarea value={draft.notes ?? ""} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </Field>

            <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Resolved access rights</div>
              <div className="mt-3 text-sm text-foreground">
                {selectedRole ? describePermissions(selectedRole.permissions) : "Choose a role to preview access."}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saveUserMutation.isPending}>
                {saveUserMutation.isPending ? "Saving..." : editingUser ? "Save user" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-lg">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
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

