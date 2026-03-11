import { lazy, Suspense, useState } from "react";
import type { DashboardPreferencesConfig, DashboardWidgetId } from "@shared/api";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppRouteMeta } from "@/lib/navigation";
import type { DashboardWidgetDefinition } from "./dashboard-ui";

const loadDashboardCustomizerContent = () =>
  import("./dashboard-customizer-content");

const LazyDashboardCustomizerContent = lazy(async () => {
  const module = await loadDashboardCustomizerContent();
  return { default: module.DashboardCustomizerContent };
});

interface DashboardCustomizerSheetProps {
  focusRoutes: AppRouteMeta[];
  preferences: DashboardPreferencesConfig;
  widgets: readonly DashboardWidgetDefinition[];
  onUpdatePreferences: (updates: Partial<DashboardPreferencesConfig>) => void;
  onToggleWidgetVisibility: (
    widgetId: DashboardWidgetId,
    visible: boolean,
  ) => void;
  onMoveWidget: (widgetId: DashboardWidgetId, direction: -1 | 1) => void;
  onReset: () => void;
}

export function DashboardCustomizerSheet({
  focusRoutes,
  preferences,
  widgets,
  onUpdatePreferences,
  onToggleWidgetVisibility,
  onMoveWidget,
  onReset,
}: DashboardCustomizerSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          onMouseEnter={() => void loadDashboardCustomizerContent()}
          onFocus={() => void loadDashboardCustomizerContent()}
        >
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
            Control widget visibility, widget order, focus module, density, and
            module board layout. Settings are saved for the current signed-in
            user.
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <Suspense
            fallback={
              <div className="mt-6 space-y-4">
                <div className="h-24 rounded-3xl border border-border/60 bg-card/60 animate-pulse" />
                <div className="h-40 rounded-3xl border border-border/60 bg-card/60 animate-pulse" />
              </div>
            }
          >
            <LazyDashboardCustomizerContent
              focusRoutes={focusRoutes}
              preferences={preferences}
              widgets={widgets}
              onUpdatePreferences={onUpdatePreferences}
              onToggleWidgetVisibility={onToggleWidgetVisibility}
              onMoveWidget={onMoveWidget}
              onReset={onReset}
            />
          </Suspense>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
