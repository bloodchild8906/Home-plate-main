import { useState } from "react";
import { Plus, Shield, UserCog, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type ApiResponse, type User } from "@shared/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS } from "@/lib/navigation";

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery<ApiResponse<User[]>>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to load users");
      }
      return response.json();
    },
  });
  const allUsers = data?.data ?? [];
  const users = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()),
  );
  const pendingUsers = allUsers.filter((user) => user.status === "Pending").length;
  const adminUsers = allUsers.filter((user) => user.role === "admin").length;

  return (
    <AppShell
      title="Manage Users"
      description="Create users, assign workspace roles, and review admin access across the platform."
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Shield className="h-5 w-5 text-primary" />
              Team overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Total users" value={String(allUsers.length)} helper="Assigned seats" />
            <Kpi label="Admins" value={String(adminUsers)} helper="Elevated access" />
            <Kpi label="Pending" value={String(pendingUsers)} helper="Awaiting activation" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Users className="h-5 w-5 text-primary" />
              User directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="rounded-2xl"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <UserCog className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && users.length === 0 ? (
              <div className="pt-4 text-sm text-muted-foreground">
                No matching users found.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}
