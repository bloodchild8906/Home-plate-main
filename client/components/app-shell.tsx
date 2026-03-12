import { useEffect, useMemo, useState, type PropsWithChildren, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Lock,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { APP_ROUTES } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { HelpWidget } from "@/components/help-widget";
import { BrandMark } from "@/components/brand-mark";
import { describePermissions, getUserRoleLabel } from "@/lib/access-control";

const NAV_CATEGORY_ORDER = ["Design", "Operations", "Growth", "Admin"] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
  fluid = false,
  hideSidebar = false,
  hidePageIntro = false,
}: PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
  fluid?: boolean;
  hideSidebar?: boolean;
  hidePageIntro?: boolean;
}>) {
  const location = useLocation();
  const { user, signOut, hasAccess } = useAuth();
  const { brand } = useBranding();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const accessibleRoutes = APP_ROUTES.filter((route) => hasAccess(route.requiredPermissions));
  const groupedRoutes = useMemo(
    () =>
      NAV_CATEGORY_ORDER.map((category) => ({
        category,
        routes: APP_ROUTES.filter((route) => route.category === category),
      })).filter((group) => group.routes.length > 0),
    [],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("homeplate:sidebar-collapsed");
    if (stored === "1") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("homeplate:sidebar-collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen w-screen max-w-[100vw] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.24),transparent_32%),radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
        {hideSidebar ? null : (
          <aside
            className={cn(
              "hidden h-screen max-h-screen shrink-0 overflow-hidden border-r border-white/10 transition-[width,padding] duration-300 lg:flex lg:flex-col",
              sidebarCollapsed ? "w-[104px] px-3 py-5" : "w-72 px-5 py-6",
            )}
            style={{
              background: `linear-gradient(180deg, ${brand.secondary}, ${brand.secondary} 55%, #020617)`,
              color: "var(--brand-panel-foreground)",
            }}
          >
            <Link
              to="/"
              title={`${brand.name} Control`}
              className={cn(
                "rounded-3xl border border-white/10",
                sidebarCollapsed ? "flex justify-center p-3" : "p-4",
              )}
              style={{ backgroundColor: `${brand.secondary}cc` }}
            >
              <BrandMark
                image={brand.logoImage}
                text={brand.logo}
                label={`${brand.name} logo`}
                primary={brand.primary}
                accent={brand.accent}
                className={cn("h-10 w-10", sidebarCollapsed ? "" : "mb-3")}
              />
              {sidebarCollapsed ? null : (
                <>
                  <div className="text-sm font-black tracking-tight">{brand.name} Control</div>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--brand-panel-muted)" }}>{brand.tagline}</p>
                </>
              )}
            </Link>

            <div className="mt-4 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => setSidebarCollapsed((current) => !current)}
                  >
                    {sidebarCollapsed ? (
                      <PanelLeftOpen className="h-3.5 w-3.5" />
                    ) : (
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 hide-scrollbar">
              {groupedRoutes.map((group) => (
                <section key={group.category} className="space-y-1.5">
                  <div
                    className={cn(
                      "font-black uppercase",
                      sidebarCollapsed
                        ? "text-center text-[8px] tracking-[0.14em]"
                        : "px-1 text-[9px] tracking-[0.2em]",
                    )}
                    style={{ color: "var(--brand-panel-muted)" }}
                  >
                    {sidebarCollapsed ? group.category.slice(0, 3) : group.category}
                  </div>
                  <div className="space-y-1.5">
                    {group.routes.map((route) => {
                      const Icon = route.icon;
                      const canAccess = hasAccess(route.requiredPermissions);
                      const isActive = location.pathname === route.path;
                      const collapsedCardTone = sidebarCollapsed
                        ? isActive
                          ? "border-white/35 bg-gradient-to-b from-white to-white/90 text-slate-950 shadow-[0_14px_28px_-18px_rgba(2,6,23,0.75)]"
                          : "border-white/10 bg-gradient-to-b from-white/[0.12] to-white/[0.04] hover:border-white/25 hover:from-white/[0.2] hover:to-white/[0.1]"
                        : "";

                      return canAccess ? (
                        <Link
                          key={route.path}
                          to={route.path}
                          title={route.title}
                          className={cn(
                            "group flex rounded-2xl border transition-all",
                            sidebarCollapsed
                              ? "flex-col items-center justify-center px-1.5 py-2 text-center"
                              : "items-center gap-3 px-3 py-3",
                            sidebarCollapsed
                              ? collapsedCardTone
                              : isActive
                                ? "border-white/20 bg-white text-slate-950 shadow-xl"
                                : "border-white/5 bg-white/5 hover:border-white/15 hover:bg-white/10",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-xl",
                              isActive
                                ? "bg-slate-950 text-white"
                                : sidebarCollapsed
                                  ? "bg-gradient-to-br from-amber-400/30 to-orange-500/30 text-amber-50 ring-1 ring-white/20"
                                  : "bg-white/10 text-white",
                            )}
                          >
                            <Icon className="h-3 w-3" />
                          </div>
                          {sidebarCollapsed ? (
                            <div
                              className="mt-1 max-w-full text-[9px] font-semibold leading-3"
                              style={{ color: isActive ? "hsl(var(--foreground))" : "rgb(248 250 252)" }}
                            >
                              {route.title}
                            </div>
                          ) : (
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold">{route.title}</span>
                                <ArrowRight
                                  className={cn(
                                    "h-2.5 w-2.5 transition-transform",
                                    isActive ? "" : "group-hover:translate-x-0.5",
                                  )}
                                />
                              </div>
                              <p
                                className="mt-1 text-[10px]"
                                style={{
                                  color: isActive
                                    ? "hsl(var(--foreground))"
                                    : "var(--brand-panel-muted)",
                                }}
                              >
                                {route.shortDescription}
                              </p>
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div
                          key={route.path}
                          title={route.title}
                          className={cn(
                            "flex rounded-2xl border border-white/5 bg-white/[0.03] text-slate-500",
                            sidebarCollapsed
                              ? "flex-col items-center justify-center px-1.5 py-2 text-center"
                              : "items-center gap-3 px-3 py-3",
                          )}
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5">
                            <Lock className="h-3 w-3" />
                          </div>
                          {sidebarCollapsed ? (
                            <div className="mt-1 max-w-full text-[9px] font-semibold leading-3">
                              {route.title}
                            </div>
                          ) : (
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-semibold">{route.title}</div>
                              <p className="mt-1 text-[10px]">
                                Requires {describePermissions(route.requiredPermissions)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

          </aside>
        )}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className={cn("w-full min-w-0 px-3 py-3 sm:px-4", fluid ? "max-w-none" : "max-w-full")}>
              <div className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/70 px-3 py-2 shadow-sm">
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{brand.name} workspace</span>
                  <span className="text-border">/</span>
                  <span className="truncate">{accessibleRoutes.length} modules</span>
                  {title ? (
                    <>
                      <span className="text-border">/</span>
                      <span className="truncate">{title}</span>
                    </>
                  ) : null}
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  {actions ? (
                    <div className="hidden min-w-0 items-center gap-1.5 sm:flex [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs [&_a]:h-8 [&_a]:px-3 [&_a]:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5">
                      {actions}
                    </div>
                  ) : null}
                  {user ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="cursor-default rounded-full px-2.5 py-0.5 text-[11px]">
                          {getUserRoleLabel(user)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>{user.name}</TooltipContent>
                    </Tooltip>
                  ) : null}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-default rounded-full px-2.5 py-0.5 text-[11px]">
                        Permission-aware
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Routes and actions are filtered by role permissions.</TooltipContent>
                  </Tooltip>
                  {user ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-2 py-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted/60 text-foreground">
                            <UserRound className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{user.name}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 rounded-xl"
                            onClick={signOut}
                            title="Sign out"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Sign out</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : null}
                  {hideSidebar ? null : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-full lg:hidden" asChild>
                          <Link to="/">
                            <Menu className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open modules</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              {actions ? (
                <div className="mt-2 flex items-center gap-1.5 sm:hidden [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs [&_a]:h-8 [&_a]:px-3 [&_a]:text-xs [&_svg]:h-3.5 [&_svg]:w-3.5">
                  {actions}
                </div>
              ) : null}
            </div>
          </header>

          <main className={cn("w-full min-w-0 flex-1 px-4 sm:px-6", hidePageIntro ? "py-4" : "py-8", fluid ? "max-w-none" : "max-w-full")}>
            {children}
          </main>
        </div>
      </div>
      <HelpWidget />
    </div>
  );
}
