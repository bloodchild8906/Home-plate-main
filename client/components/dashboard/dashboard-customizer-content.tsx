import type {
  DashboardDensity,
  DashboardPreferencesConfig,
  DashboardWidgetId,
} from "@shared/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AppRouteMeta } from "@/lib/navigation";
import {
  CustomizerRow,
  type DashboardWidgetDefinition,
} from "./dashboard-ui";

interface DashboardCustomizerContentProps {
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

export function DashboardCustomizerContent({
  focusRoutes,
  preferences,
  widgets,
  onUpdatePreferences,
  onToggleWidgetVisibility,
  onMoveWidget,
  onReset,
}: DashboardCustomizerContentProps) {
  return (
    <ScrollArea className="mt-6 h-[calc(100vh-10rem)] pr-4">
      <div className="space-y-6 pb-8">
        <div className="rounded-3xl border border-border/60 bg-card/80 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-foreground">Dashboard layout</div>
              <div className="text-sm text-muted-foreground">
                Tune the density and default focus module.
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={onReset}
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
                  onUpdatePreferences({
                    density: value as DashboardDensity,
                  })
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Focus module</Label>
              <Select
                value={preferences.focusModulePath}
                onValueChange={(value) =>
                  onUpdatePreferences({ focusModulePath: value })
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {focusRoutes.map((route) => (
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
                  onUpdatePreferences({
                    moduleColumns:
                      value === "2" || value === "4"
                        ? (Number(value) as 2 | 4)
                        : 3,
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
                  onUpdatePreferences({ showLockedModules: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/80 p-5">
          <div className="mb-4">
            <div className="font-bold text-foreground">Widget library</div>
            <div className="text-sm text-muted-foreground">
              Toggle widgets on or off and move them up or down in the dashboard
              flow.
            </div>
          </div>

          <div className="space-y-4">
            {preferences.widgetOrder.map((widgetId, index) => {
              const widget = widgets.find((item) => item.id === widgetId);

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
                    onToggleWidgetVisibility(widget.id, checked)
                  }
                  onMoveUp={() => onMoveWidget(widget.id, -1)}
                  onMoveDown={() => onMoveWidget(widget.id, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < preferences.widgetOrder.length - 1}
                />
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
