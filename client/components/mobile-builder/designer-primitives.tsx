import type { ChangeEvent, ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuilderBlockLayout } from "@/lib/builder-store";
import { cn } from "@/lib/utils";

export interface SpacingFieldConfig {
  key: keyof BuilderBlockLayout;
  label: string;
}

export function Panel({
  eyebrow,
  title,
  children,
  className,
  contentClassName,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden border border-border/70 bg-card/95 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border/70 bg-muted/25 px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-sm font-semibold uppercase tracking-[0.08em]">
          {title}
        </h2>
      </div>
      <div className={cn("p-3", contentClassName)}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
      <Label className="pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      <div className="min-w-0 space-y-2 [&_button]:rounded-none [&_input]:rounded-none [&_select]:rounded-none [&_textarea]:rounded-none">
        {children}
      </div>
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
      <Label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      <div className="flex h-9 items-center gap-3 border border-border/70 bg-background px-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-6 w-8 cursor-pointer border border-border/70 bg-transparent p-0"
        />
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

export function AssetField({
  label,
  preview,
  actionLabel,
  onChange,
  onClear,
}: {
  label: string;
  preview: ReactNode;
  actionLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
      <Label className="pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3 border border-border/70 bg-muted/10 p-2">
        {preview}
        <div className="flex flex-wrap gap-2">
          <Label className="inline-flex h-8 cursor-pointer items-center gap-2 border border-border/70 bg-background px-3 text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
            <ImagePlus className="h-4 w-4" />
            {actionLabel}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onChange}
            />
          </Label>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-none px-3 text-xs font-semibold uppercase tracking-[0.12em]"
              onClick={onClear}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ImageAssetPreview({
  source,
  label,
  fallback,
}: {
  source?: string;
  label: string;
  fallback: string;
}) {
  return source ? (
    <img
      src={source}
      alt={label}
      className="h-14 w-20 border border-border/70 object-cover"
    />
  ) : (
    <div className="flex h-14 w-20 items-center justify-center border border-dashed border-border/70 bg-background text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {fallback}
    </div>
  );
}

export function SpacingGroup({
  label,
  layout,
  fields,
  onChange,
}: {
  label: string;
  layout: BuilderBlockLayout;
  fields: SpacingFieldConfig[];
  onChange: (key: keyof BuilderBlockLayout, value: number) => void;
}) {
  return (
    <div className="border border-border/70 bg-background/80">
      <div className="border-b border-border/70 bg-muted/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/60">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1 bg-background px-3 py-2">
            <Label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {field.label}
            </Label>
            <Input
              type="number"
              min="0"
              value={layout[field.key]}
              onChange={(event) => onChange(field.key, Number(event.target.value))}
              className="h-8 rounded-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
