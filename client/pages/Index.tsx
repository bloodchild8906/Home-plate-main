import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type {
  ApiResponse,
  DashboardDensity,
  DashboardPreferencesConfig,
  DashboardWidgetId,
} from "@shared/api";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Grip,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";
import { APP_ROUTES, ROLE_LABELS, type AppRouteMeta } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: AppRouteMeta["category"][] = [
  "Design",
  "Operations",
  "Growth",
  "Admin",
];

const DASHBOARD_CONFIG_PREFIX = "homeplate_dashboard_preferences";

const DASHBOARD_WIDGETS = [
  {
    id: "focus",
    label: "Focus module",
    description: "Large hero card for the primary module you want in front.",
    icon: Sparkles,
  },
  {
    id: "overview",
    label: "Workspace overview",
    description: "Role, route access, and command-surface KPIs.",
    icon: LayoutDashboard,
  },
  {
    id: "quickActions",
    label: "Quick actions",
    description: "Fast links to the modules you use most often.",
    icon: WandSparkles,
  },
  {
    id: "categoryBreakdown",
    label: "Category health",
    description: "Coverage by design, operations, growth, and admin areas.",
    icon: Grip,
  },
  {
    id: "accessRadar",
    label: "Access radar",
    description: "Shows what is available now and what is still restricted.",
    icon: ShieldCheck,
  },
  {
    id: "activity",
    label: "Workspace feed",
    description: "Short operational feed tied to the active brand and role.",
    icon: CheckCircle2,
  },
  {
    id: "notes",
    label: "Team notes",
    description: "Reusable dashboard notes for design, access, and UX direction.",
    icon: Sparkles,
  },
  {
    id: "moduleBoard",
    label: "Module board",
    description: "Main module grid with configurable density and column count.",
    icon: LayoutDashboard,
  },
] as const;

type DashboardPreferences = DashboardPreferencesConfig;

function createDefaultDashboardPreferences(
  availableFocusPaths: string[],
): DashboardPreferences {
  return {
    density: "comfortable",
    focusModulePath: availableFocusPaths[0] ?? APP_ROUTES[0]?.path ?? "/",
    showLockedModules: true,
    moduleColumns: 3,
    widgetOrder: DASHBOARD_WIDGETS.map((widget) => widget.id),
    hiddenWidgets: [],
  };
}

function normalizeDashboardPreferences(
  value: Partial<DashboardPreferences> | null | undefined,
  availableFocusPaths: string[],
): DashboardPreferences {
  const defaults = createDefaultDashboardPreferences(availableFocusPaths);
  const validWidgetIds = DASHBOARD_WIDGETS.map((widget) => widget.id);
  const requestedOrder = Array.isArray(value?.widgetOrder)
    ? value.widgetOrder.filter((widgetId): widgetId is DashboardWidgetId =>
        validWidgetIds.includes(widgetId as DashboardWidgetId),
      )
    : [];
  const uniqueOrder = requestedOrder.filter(
    (widgetId, index) => requestedOrder.indexOf(widgetId) === index,
  );
  const widgetOrder = [
    ...uniqueOrder,
    ...validWidgetIds.filter((widgetId) => !uniqueOrder.includes(widgetId)),
  ];
  const hiddenWidgets = Array.isArray(value?.hiddenWidgets)
    ? value.hiddenWidgets.filter(
        (widgetId, index, items): widgetId is DashboardWidgetId =>
          validWidgetIds.includes(widgetId as DashboardWidgetId) &&
          items.indexOf(widgetId) === index,
      )
    : [];

  return {
    density: value?.density === "compact" ? "compact" : defaults.density,
    focusModulePath:
      typeof value?.focusModulePath === "string" &&
      availableFocusPaths.includes(value.focusModulePath)
        ? value.focusModulePath
        : defaults.focusModulePath,
    showLockedModules:
      typeof value?.showLockedModules === "boolean"
        ? value.showLockedModules
        : defaults.showLockedModules,
    moduleColumns:
      value?.moduleColumns === 2 ||
      value?.moduleColumns === 3 ||
      value?.moduleColumns === 4
        ? value.moduleColumns
        : defaults.moduleColumns,
    widgetOrder,
    hiddenWidgets,
  };
}

function getWidgetSpan(widgetId: DashboardWidgetId) {
  switch (widgetId) {
    case "focus":
      return "xl:col-span-7";
    case "overview":
      return "xl:col-span-5";
    case "moduleBoard":
      return "xl:col-span-12";
    case "activity":
      return "xl:col-span-7";
    case "notes":
      return "xl:col-span-5";
    default:
      return "xl:col-span-4";
  }
}

function getModuleBoardGridClass(columns: DashboardPreferences["moduleColumns"]) {
  switch (columns) {
    case 2:
      return "lg:grid-cols-2";
    case 4:
      return "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";
    case 3:
    default:
      return "lg:grid-cols-2 2xl:grid-cols-3";
  }
}

function DashboardWidgetCard({
  eyebrow,
  title,
  action,
  compact,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  compact: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("border-border/60 bg-card/90 shadow-xl", className)}>
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between gap-4 space-y-0",
          compact ? "p-5 pb-3" : "p-6 pb-4",
        )}
      >
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </div>
          <CardTitle className="mt-2 text-xl font-black tracking-tight text-foreground">
            {title}
          </CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn(compact ? "px-5 pb-5" : "px-6 pb-6")}>
        {children}
      </CardContent>
    </Card>
  );
}

function KpiStat({
  label,
  value,
  helper,
  compact,
}: {
  label: string;
  value: string;
  helper: string;
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-background/85 shadow-sm",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight text-foreground">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}

function CustomizerRow({
  icon: Icon,
  label,
  description,
  visible,
  onVisibilityChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  visible: boolean;
  onVisibilityChange: (checked: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-foreground">{label}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {description}
          </div>
        </div>
        <Switch checked={visible} onCheckedChange={onVisibilityChange} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Grip className="h-3.5 w-3.5" />
          Widget order
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { user, hasAccess } = useAuth();
  const { brand } = useBranding();
  const accessibleRoutes = APP_ROUTES.filter((route) =>
    hasAccess(route.allowedRoles),
  );
  const lockedRoutes = APP_ROUTES.filter((route) => !hasAccess(route.allowedRoles));
  const availableFocusPaths =
    accessibleRoutes.length > 0
      ? accessibleRoutes.map((route) => route.path)
      : APP_ROUTES.map((route) => route.path);
  const availableFocusKey = availableFocusPaths.join("|");
  const dashboardConfigKey = `${DASHBOARD_CONFIG_PREFIX}:${user?.email ?? user?.role ?? "guest"}`;
  const [preferences, setPreferences] = useState<DashboardPreferences>(() =>
    createDefaultDashboardPreferences(APP_ROUTES.map((route) => route.path)),
  );
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const compact = preferences.density === "compact";
  const focusRoute =
    accessibleRoutes.find((route) => route.path === preferences.focusModulePath) ??
    accessibleRoutes[0] ??
    APP_ROUTES.find((route) => route.path === preferences.focusModulePath) ??
    APP_ROUTES[0];
  const visibleWidgetOrder = preferences.widgetOrder.filter(
    (widgetId) => !preferences.hiddenWidgets.includes(widgetId),
  );
  const moduleBoardRoutes = preferences.showLockedModules
    ? APP_ROUTES
    : accessibleRoutes;
  const quickActions = accessibleRoutes.slice(0, 4);
  const categorySummary = CATEGORY_ORDER.map((category) => {
    const total = APP_ROUTES.filter((route) => route.category === category).length;
    const accessible = accessibleRoutes.filter(
      (route) => route.category === category,
    ).length;

    return {
      category,
      total,
      accessible,
      locked: total - accessible,
      percentage: total === 0 ? 0 : Math.round((accessible / total) * 100),
    };
  }).filter((item) => item.total > 0);
  const workspaceFeed = [
    {
      title: `${focusRoute.title} is the primary module`,
      detail: `Dashboard focus is pinned to ${focusRoute.title} for ${brand.name}.`,
    },
    {
      title: `${user ? ROLE_LABELS[user.role] : "Guest"} policies are active`,
      detail: `${accessibleRoutes.length} modules are live for the current role and ${lockedRoutes.length} remain guarded.`,
    },
    {
      title: `${brand.name} branding is applied`,
      detail: `Dashboard colors, shell chrome, and module entry points now follow the active white-label theme.`,
    },
  ];
  const teamNotes = [
    {
      title: "Builder additions",
      detail:
        "Mobile app templates, layout controls, HTML blocks, and event wiring are now available from one workflow.",
    },
    {
      title: "Access model",
      detail:
        "Route cards and workspace navigation are still driven by the same permission metadata used by the router.",
    },
    {
      title: "Dashboard direction",
      detail:
        "This surface now behaves like a configurable workspace with widgets instead of a static welcome page.",
    },
  ];

  useEffect(() => {
    let cancelled = false;

    setHasLoadedPreferences(false);

    const loadPreferences = async () => {
      try {
        const response = await fetch(
          `/api/site-config/dashboard/${encodeURIComponent(dashboardConfigKey)}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load dashboard preferences");
        }

        const payload =
          (await response.json()) as ApiResponse<DashboardPreferencesConfig | null>;

        if (!cancelled) {
          setPreferences(
            payload.success && payload.data
              ? normalizeDashboardPreferences(payload.data, availableFocusPaths)
              : createDefaultDashboardPreferences(availableFocusPaths),
          );
        }
      } catch {
        if (!cancelled) {
          setPreferences(createDefaultDashboardPreferences(availableFocusPaths));
        }
      } finally {
        if (!cancelled) {
          setHasLoadedPreferences(true);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [availableFocusKey, dashboardConfigKey]);

  useEffect(() => {
    if (!hasLoadedPreferences) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetch(
        `/api/site-config/dashboard/${encodeURIComponent(dashboardConfigKey)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            normalizeDashboardPreferences(preferences, availableFocusPaths),
          ),
        },
      ).catch(() => undefined);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [availableFocusKey, dashboardConfigKey, hasLoadedPreferences, preferences]);

  const updatePreferences = (updates: Partial<DashboardPreferences>) => {
    setPreferences((current) =>
      normalizeDashboardPreferences(
        {
          ...current,
          ...updates,
        },
        availableFocusPaths,
      ),
    );
  };

  const toggleWidgetVisibility = (
    widgetId: DashboardWidgetId,
    visible: boolean,
  ) => {
    setPreferences((current) =>
      normalizeDashboardPreferences(
        {
          ...current,
          hiddenWidgets: visible
            ? current.hiddenWidgets.filter((item) => item !== widgetId)
            : [...current.hiddenWidgets, widgetId],
        },
        availableFocusPaths,
      ),
    );
  };

  const moveWidget = (widgetId: DashboardWidgetId, direction: -1 | 1) => {
    setPreferences((current) => {
      const order = [...current.widgetOrder];
      const currentIndex = order.indexOf(widgetId);
      const nextIndex = currentIndex + direction;

      if (
        currentIndex === -1 ||
        nextIndex < 0 ||
        nextIndex >= order.length
      ) {
        return current;
      }

      [order[currentIndex], order[nextIndex]] = [
        order[nextIndex],
        order[currentIndex],
      ];

      return normalizeDashboardPreferences(
        {
          ...current,
          widgetOrder: order,
        },
        availableFocusPaths,
      );
    });
  };

  const resetDashboard = () => {
    setPreferences(createDefaultDashboardPreferences(availableFocusPaths));
  };

  const renderWidget = (widgetId: DashboardWidgetId) => {
    switch (widgetId) {
      case "focus":
        return (
          <Card
            className="relative overflow-hidden border-border/60 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${brand.secondary}, ${brand.secondary} 48%, ${brand.primary})`,
              color: "var(--brand-panel-foreground)",
            }}
          >
            <CardContent className={cn("relative", compact ? "p-5" : "p-6")}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_28%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div
                      className="text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{ color: "var(--brand-panel-muted)" }}
                    >
                      Focus module
                    </div>
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                      {focusRoute.title}
                    </h2>
                  </div>
                  <Badge
                    className="rounded-full border-white/10 bg-white/10 px-3 py-1 text-white"
                    variant="outline"
                  >
                    {focusRoute.category}
                  </Badge>
                </div>
                <p className="mt-4 max-w-2xl text-sm sm:text-base">
                  {focusRoute.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div
                      className="text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{ color: "var(--brand-panel-muted)" }}
                    >
                      Live signal
                    </div>
                    <div className="mt-2 text-xl font-black">
                      {focusRoute.stat}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div
                      className="text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{ color: "var(--brand-panel-muted)" }}
                    >
                      Accessible modules
                    </div>
                    <div className="mt-2 text-xl font-black">
                      {accessibleRoutes.length}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <div
                      className="text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{ color: "var(--brand-panel-muted)" }}
                    >
                      Current role
                    </div>
                    <div className="mt-2 text-xl font-black">
                      {user ? ROLE_LABELS[user.role] : "Guest"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="rounded-2xl bg-white text-slate-950 hover:bg-white/90"
                  >
                    <Link to={focusRoute.path}>
                      Open module
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-black/10 px-3 py-1 text-white"
                  >
                    {brand.name} command surface
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "overview":
        return (
          <DashboardWidgetCard
            eyebrow="Workspace overview"
            title="Operational status"
            compact={compact}
            action={
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {preferences.density}
              </Badge>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiStat
                label="Accessible"
                value={String(accessibleRoutes.length)}
                helper="Available for this role"
                compact={compact}
              />
              <KpiStat
                label="Restricted"
                value={String(lockedRoutes.length)}
                helper="Protected by route policy"
                compact={compact}
              />
              <KpiStat
                label="Role"
                value={user ? ROLE_LABELS[user.role] : "Guest"}
                helper="Pulled from the local auth session"
                compact={compact}
              />
              <KpiStat
                label="Brand"
                value={brand.name}
                helper="Applied across shell, cards, and controls"
                compact={compact}
              />
            </div>
          </DashboardWidgetCard>
        );
      case "quickActions":
        return (
          <DashboardWidgetCard
            eyebrow="Quick actions"
            title="Frequent module entry points"
            compact={compact}
          >
            <div className="space-y-3">
              {quickActions.length > 0 ? (
                quickActions.map((route) => {
                  const Icon = route.icon;

                  return (
                    <div
                      key={route.path}
                      className="flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-background/75 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground">
                            {route.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {route.shortDescription}
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="ghost" className="rounded-2xl">
                        <Link to={route.path}>
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                  No modules are available for the current role.
                </div>
              )}
            </div>
          </DashboardWidgetCard>
        );
      case "categoryBreakdown":
        return (
          <DashboardWidgetCard
            eyebrow="Category health"
            title="Coverage by area"
            compact={compact}
          >
            <div className="space-y-4">
              {categorySummary.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="font-bold text-foreground">
                      {item.category}
                    </div>
                    <div className="text-muted-foreground">
                      {item.accessible}/{item.total} available
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {item.locked} locked for the current role
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidgetCard>
        );
      case "accessRadar":
        return (
          <DashboardWidgetCard
            eyebrow="Access radar"
            title="Available and restricted modules"
            compact={compact}
            action={
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {preferences.showLockedModules ? "Including locked" : "Accessible only"}
              </Badge>
            }
          >
            <div className="space-y-3">
              {accessibleRoutes.slice(0, 3).map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                >
                  <div>
                    <div className="font-bold text-foreground">
                      {route.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {route.stat}
                    </div>
                  </div>
                  <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                    Live
                  </Badge>
                </div>
              ))}

              {lockedRoutes.length > 0 ? (
                lockedRoutes.slice(0, 2).map((route) => (
                  <div
                    key={route.path}
                    className="flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        {route.title}
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Restricted to {route.allowedRoles.join(", ")}
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      Guarded
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  This role can access every configured workspace module.
                </div>
              )}
            </div>
          </DashboardWidgetCard>
        );
      case "activity":
        return (
          <DashboardWidgetCard
            eyebrow="Workspace feed"
            title="Recent signals"
            compact={compact}
          >
            <div className="space-y-4">
              {workspaceFeed.map((entry) => (
                <div
                  key={entry.title}
                  className="flex gap-3 rounded-3xl border border-border/60 bg-background/75 p-4"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {entry.title}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {entry.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidgetCard>
        );
      case "notes":
        return (
          <DashboardWidgetCard
            eyebrow="Team notes"
            title="Shared context"
            compact={compact}
          >
            <div className="space-y-3">
              {teamNotes.map((note) => (
                <div
                  key={note.title}
                  className="rounded-3xl border border-border/60 bg-background/75 p-4"
                >
                  <div className="mb-2 flex items-center gap-2 font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {note.title}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {note.detail}
                  </p>
                </div>
              ))}
            </div>
          </DashboardWidgetCard>
        );
      case "moduleBoard":
        return (
          <DashboardWidgetCard
            eyebrow="Module board"
            title="Command surface"
            compact={compact}
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {preferences.moduleColumns} columns
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {moduleBoardRoutes.length} cards
                </Badge>
              </div>
            }
          >
            <div
              className={cn(
                "grid gap-4",
                getModuleBoardGridClass(preferences.moduleColumns),
              )}
            >
              {moduleBoardRoutes.map((route) => {
                const Icon = route.icon;
                const canAccess = hasAccess(route.allowedRoles);

                return (
                  <Card
                    key={route.path}
                    className={cn(
                      "border-border/60 bg-background/80 transition-all hover:-translate-y-1 hover:shadow-xl",
                      !canAccess && "opacity-75",
                    )}
                  >
                    <CardContent className={cn(compact ? "p-4" : "p-5")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/20 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge
                          variant={canAccess ? "default" : "outline"}
                          className="rounded-full px-3 py-1"
                        >
                          {route.category}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black tracking-tight text-foreground">
                            {route.title}
                          </h3>
                          {!canAccess ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : null}
                        </div>
                        <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                          {route.shortDescription}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Live status
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground">
                          {route.stat}
                        </div>
                      </div>

                      <div className="mt-4">
                        {canAccess ? (
                          <Button
                            asChild
                            className="w-full justify-between rounded-2xl"
                          >
                            <Link to={route.path}>
                              Open module
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
                            Restricted to {route.allowedRoles.join(", ")}.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DashboardWidgetCard>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell
      title="Command Center"
      description={`A configurable ${brand.name} dashboard for app design, restaurant operations, loyalty growth, and reporting.`}
      actions={
        <>
          {hasAccess(["admin"]) ? (
            <Button variant="outline" asChild>
              <Link to="/access-control">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Review permissions
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link to={focusRoute.path}>
              Open {focusRoute.title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" />
                Customize dashboard
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-border/70 bg-background/95 sm:max-w-xl"
            >
              <SheetHeader>
                <SheetTitle>Customize dashboard</SheetTitle>
                <SheetDescription>
                  Control widget visibility, widget order, focus module, density,
                  and module board layout. Settings are saved for the current
                  signed-in user.
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="mt-6 h-[calc(100vh-10rem)] pr-4">
                <div className="space-y-6 pb-8">
                  <div className="rounded-3xl border border-border/60 bg-card/80 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-foreground">
                          Dashboard layout
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tune the density and default focus module.
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-2xl"
                        onClick={resetDashboard}
                      >
                        Reset
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Dashboard density</Label>
                        <Select
                          value={preferences.density}
                          onValueChange={(value) =>
                            updatePreferences({
                              density: value as DashboardDensity,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select density" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comfortable">
                              Comfortable
                            </SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Focus module</Label>
                        <Select
                          value={focusRoute.path}
                          onValueChange={(value) =>
                            updatePreferences({ focusModulePath: value })
                          }
                        >
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                          <SelectContent>
                            {(accessibleRoutes.length > 0
                              ? accessibleRoutes
                              : APP_ROUTES
                            ).map((route) => (
                              <SelectItem key={route.path} value={route.path}>
                                {route.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Module board columns</Label>
                        <Select
                          value={String(preferences.moduleColumns)}
                          onValueChange={(value) =>
                            updatePreferences({
                              moduleColumns:
                                value === "2" || value === "4" ? Number(value) as 2 | 4 : 3,
                            })
                          }
                        >
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select columns" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 columns</SelectItem>
                            <SelectItem value="3">3 columns</SelectItem>
                            <SelectItem value="4">4 columns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                        <div>
                          <div className="font-bold text-foreground">
                            Show locked modules on the board
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Keep restricted cards visible for dashboard context.
                          </div>
                        </div>
                        <Switch
                          checked={preferences.showLockedModules}
                          onCheckedChange={(checked) =>
                            updatePreferences({ showLockedModules: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-card/80 p-5">
                    <div className="mb-4">
                      <div className="font-bold text-foreground">
                        Widget library
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Toggle widgets on or off and move them up or down in the
                        dashboard flow.
                      </div>
                    </div>

                    <div className="space-y-4">
                      {preferences.widgetOrder.map((widgetId, index) => {
                        const widget = DASHBOARD_WIDGETS.find(
                          (item) => item.id === widgetId,
                        );

                        if (!widget) {
                          return null;
                        }

                        return (
                          <CustomizerRow
                            key={widget.id}
                            icon={widget.icon}
                            label={widget.label}
                            description={widget.description}
                            visible={!preferences.hiddenWidgets.includes(widget.id)}
                            onVisibilityChange={(checked) =>
                              toggleWidgetVisibility(widget.id, checked)
                            }
                            onMoveUp={() => moveWidget(widget.id, -1)}
                            onMoveDown={() => moveWidget(widget.id, 1)}
                            canMoveUp={index > 0}
                            canMoveDown={index < preferences.widgetOrder.length - 1}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      }
    >
      <section className={cn("grid gap-6 xl:grid-cols-12", compact ? "gap-4" : "gap-6")}>
        {visibleWidgetOrder.length > 0 ? (
          visibleWidgetOrder.map((widgetId) => (
            <div key={widgetId} className={getWidgetSpan(widgetId)}>
              {renderWidget(widgetId)}
            </div>
          ))
        ) : (
          <div className="xl:col-span-12">
            <Card className="border-border/60 bg-card/90 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-tight text-foreground">
                  All dashboard widgets are hidden
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Re-enable widgets from the dashboard customizer to bring the
                  workspace back.
                </p>
                <Button
                  type="button"
                  className="mt-5 rounded-2xl"
                  onClick={resetDashboard}
                >
                  Restore default layout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {preferences.density === "compact" ? "Compact density" : "Comfortable density"}
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {preferences.moduleColumns} module board columns
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {preferences.showLockedModules ? (
            <>
              <Eye className="mr-2 h-3.5 w-3.5" />
              Locked modules visible
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-3.5 w-3.5" />
              Locked modules hidden
            </>
          )}
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {visibleWidgetOrder.length} active widgets
        </Badge>
      </section>
    </AppShell>
  );
}
