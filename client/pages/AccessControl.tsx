import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, type UserRole } from "@/lib/auth";
import { APP_ROUTES, ROLE_LABELS } from "@/lib/navigation";
import { Check, ShieldCheck, X } from "lucide-react";

const ROLES: UserRole[] = ["admin", "designer", "operator", "analyst"];

export default function AccessControl() {
  const { user } = useAuth();

  return (
    <AppShell
      title="Access Control"
      description="Route access is enforced at the router and documented here using the same shared permission metadata."
      actions={
        <Button asChild>
          <Link to="/login">Open sign-in page</Link>
        </Button>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/60 bg-card/85 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Active session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-muted/30 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Signed-in user
              </div>
              <div className="mt-3 text-2xl font-black tracking-tight">{user?.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{user?.email}</div>
              <div className="mt-4">
                <Badge className="rounded-full px-3 py-1">{user ? ROLE_LABELS[user.role] : "Unknown"}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <PolicyItem title="Auth persistence" value="Stored in localStorage for the demo environment." />
              <PolicyItem title="Route guards" value="Unauthorized users are redirected or shown an access-denied state." />
              <PolicyItem title="Source of truth" value="Dashboard cards and router rules share the same route metadata." />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black">Permission matrix</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="px-4 text-left text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Module
                  </th>
                  {ROLES.map((role) => (
                    <th
                      key={role}
                      className="px-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground"
                    >
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {APP_ROUTES.map((route) => (
                  <tr key={route.path} className="rounded-2xl bg-muted/25">
                    <td className="rounded-l-2xl border-y border-l border-border/70 px-4 py-4">
                      <div className="font-bold">{route.title}</div>
                      <div className="text-sm text-muted-foreground">{route.shortDescription}</div>
                    </td>
                    {ROLES.map((role) => {
                      const allowed = route.allowedRoles.includes(role);

                      return (
                        <td
                          key={`${route.path}-${role}`}
                          className="border-y border-border/70 px-4 py-4 text-center last:rounded-r-2xl last:border-r"
                        >
                          <div className="flex justify-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                allowed
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-slate-500/10 text-slate-400"
                              }`}
                            >
                              {allowed ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function PolicyItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-sm font-bold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
