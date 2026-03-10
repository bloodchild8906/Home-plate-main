import { useState } from "react";
import { Plus, Shield, UserCog, Users } from "lucide-react";
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

const DEFAULT_USERS = [
  { id: "user-1", name: "Michael Brown", email: "michael@homeplate.app", role: "Administrator", status: "Active" },
  { id: "user-2", name: "Ava Patel", email: "ava@homeplate.app", role: "App Designer", status: "Active" },
  { id: "user-3", name: "Jordan Kim", email: "jordan@homeplate.app", role: "Store Operator", status: "Pending" },
  { id: "user-4", name: "Nina Cole", email: "nina@homeplate.app", role: "Analyst", status: "Active" },
];

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const users = DEFAULT_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );

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
            <Kpi label="Total users" value="6" helper="Assigned seats" />
            <Kpi label="Admins" value="2" helper="Elevated access" />
            <Kpi label="Pending" value="1" helper="Awaiting activation" />
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
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
