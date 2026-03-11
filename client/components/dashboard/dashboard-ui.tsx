import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Grip,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DashboardWidgetId } from "@shared/api";

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export function DashboardWidgetCard({
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

export function KpiStat({
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

export function CustomizerRow({
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
