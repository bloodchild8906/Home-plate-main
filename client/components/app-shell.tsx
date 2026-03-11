import type { PropsWithChildren, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Lock, LogOut, Menu, ShieldCheck } from "lucide-react";
import { APP_ROUTES, ROLE_LABELS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { HelpWidget } from "@/components/help-widget";
import { BrandMark } from "@/components/brand-mark";

export function AppShell({
  title,
  description,
  actions,
  children,
  fluid = false,
}: PropsWithChildren<{
  title: string;
  description: string;
  actions?: ReactNode;
  fluid?: boolean;
}>) {
  const location = useLocation();
  const { user, signOut, hasAccess } = useAuth();
  const { brand } = useBranding();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.24),transparent_32%),radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className="hidden w-80 shrink-0 border-r border-white/10 px-6 py-8 lg:flex lg:flex-col"
          style={{
            background: `linear-gradient(180deg, ${brand.secondary}, ${brand.secondary} 55%, #020617)`,
            color: "var(--brand-panel-foreground)",
          }}
        >
          <Link
            to="/"
            className="rounded-3xl border border-white/10 p-5"
            style={{ backgroundColor: `${brand.secondary}cc` }}
          >
            <BrandMark
              image={brand.logoImage}
              text={brand.logo}
              label={`${brand.name} logo`}
              primary={brand.primary}
              accent={brand.accent}
              className="mb-4 h-12 w-12"
            />
            <div className="text-lg font-black tracking-tight">{brand.name} Control</div>
            <p className="mt-1 text-sm" style={{ color: "var(--brand-panel-muted)" }}>{brand.tagline}</p>
          </Link>

          <div className="mt-8 space-y-2">
            {APP_ROUTES.map((route) => {
              const Icon = route.icon;
              const canAccess = hasAccess(route.allowedRoles);
              const isActive = location.pathname === route.path;

              return canAccess ? (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all",
                    isActive
                      ? "border-white/20 bg-white text-slate-950 shadow-xl"
                      : "border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl",
                      isActive ? "bg-slate-950 text-white" : "bg-white/10 text-white",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{route.title}</span>
                      <ArrowRight className={cn("h-4 w-4 transition-transform", isActive ? "" : "group-hover:translate-x-0.5")} />
                    </div>
                    <p
                      className="mt-1 text-xs"
                      style={{
                        color: isActive ? "hsl(var(--foreground))" : "var(--brand-panel-muted)",
                      }}
                    >
                      {route.shortDescription}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  key={route.path}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-slate-500"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{route.title}</div>
                    <p className="mt-1 text-xs">Restricted to {route.allowedRoles.join(", ")}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${brand.accent}22`, color: brand.accent }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{user?.name}</div>
                <div className="text-xs" style={{ color: "var(--brand-panel-muted)" }}>{user?.email}</div>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2 text-xs">
              <span style={{ color: "var(--brand-panel-muted)" }}>Signed in as</span>
              <span className="font-bold">{user ? ROLE_LABELS[user.role] : "Unknown"}</span>
            </div>
            <Button variant="secondary" className="w-full justify-center rounded-2xl" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className={cn("mx-auto px-4 py-5 sm:px-6", fluid ? "max-w-none" : "max-w-7xl")}>
              <div className="mb-4 flex items-center justify-between gap-4 lg:hidden">
                <Link to="/" className="flex items-center gap-3">
                  <BrandMark
                    image={brand.logoImage}
                    text={brand.logo}
                    label={`${brand.name} logo`}
                    primary={brand.primary}
                    accent={brand.accent}
                    className="h-11 w-11"
                  />
                  <div>
                    <div className="text-sm font-black">{brand.name}</div>
                    <div className="text-xs text-muted-foreground">Workspace</div>
                  </div>
                </Link>
                <Button variant="outline" asChild>
                  <Link to="/">
                    <Menu className="mr-2 h-4 w-4" />
                    Modules
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {user && <Badge className="rounded-full px-3 py-1">{ROLE_LABELS[user.role]}</Badge>}
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      Secured workspace
                    </Badge>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                      {title}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
                      {description}
                    </p>
                  </div>
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </div>
          </header>

          <main className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-6", fluid ? "max-w-none" : "max-w-7xl")}>
            {children}
          </main>
        </div>
      </div>
      <HelpWidget />
    </div>
  );
}
