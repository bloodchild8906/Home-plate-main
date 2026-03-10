import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { APP_ROUTES, ROLE_LABELS } from "@/lib/navigation";

export default function Index() {
  const { user, hasAccess } = useAuth();
  const { brand } = useBranding();

  const accessibleRoutes = APP_ROUTES.filter((route) => hasAccess(route.allowedRoles));
  const lockedRoutes = APP_ROUTES.filter((route) => !hasAccess(route.allowedRoles));

  return (
    <AppShell
      title="Command Center"
      description={`A role-aware ${brand.name} control surface for app design, restaurant operations, loyalty growth, and reporting.`}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/access-control">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Review permissions
            </Link>
          </Button>
          <Button asChild>
            <Link to={accessibleRoutes[0]?.path ?? "/builder"}>
              Open workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden border-border/60 bg-card/90 shadow-2xl">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_25%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.18),transparent_30%)]" />
            <div className="relative space-y-6">
              <Badge className="rounded-full px-3 py-1">
                {user ? `${ROLE_LABELS[user.role]} workspace` : "Workspace"}
              </Badge>
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                  Navigation blocks, auth, and module control are now part of the same app surface.
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  The dashboard only exposes modules your role can open, and the builder can now compose navigation-specific mobile patterns alongside loyalty and commerce blocks for {brand.name}.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard label="Accessible modules" value={String(accessibleRoutes.length)} helper="Role-filtered routes" />
                <KpiCard label="Restricted modules" value={String(lockedRoutes.length)} helper="Guarded by route policy" />
                <KpiCard label="Current role" value={user ? ROLE_LABELS[user.role] : "Guest"} helper="Persisted locally for demo auth" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-slate-950 text-slate-50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Workspace Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Builder additions
              </div>
              <p>Top nav, quick links, and tab bar blocks are now available in the app designer palette.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Access model
              </div>
              <p>Each route is guarded against the active role, and the access page mirrors the same metadata.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-white">
                <WandSparkles className="h-4 w-4 text-rose-300" />
                UI direction
              </div>
              <p>The shell now uses a unified workspace layout instead of isolated page headers.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Module navigation</h3>
            <p className="text-sm text-muted-foreground">
              Cards below are driven by the same route-permission definitions used by the router.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {accessibleRoutes.length} available now
          </Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {APP_ROUTES.map((route) => {
            const Icon = route.icon;
            const canAccess = hasAccess(route.allowedRoles);

            return (
              <Card
                key={route.path}
                className="group border-border/60 bg-card/85 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <CardContent className="p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/25 text-primary">
                      <Icon className="h-7 w-7" />
                    </div>
                    <Badge variant={canAccess ? "default" : "outline"} className="rounded-full px-3 py-1">
                      {route.category}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-black tracking-tight">{route.title}</h4>
                      {!canAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="min-h-12 text-sm text-muted-foreground">{route.description}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        Live status
                      </div>
                      <div className="mt-1 text-sm font-semibold">{route.stat}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Roles: {route.allowedRoles.join(", ")}
                    </div>
                  </div>

                  <div className="mt-5">
                    {canAccess ? (
                      <Button asChild className="w-full justify-between rounded-2xl">
                        <Link to={route.path}>
                          Open module
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                        Request access from an administrator to use this module.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}
