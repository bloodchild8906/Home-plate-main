import type { ChangeEvent, ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuilderBlockLayout } from "@/lib/builder-store";

export interface SpacingFieldConfig {
  key: keyof BuilderBlockLayout;
  label: string;
}

export function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-xl">
      <div className="border-b border-border/60 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-xl font-black tracking-tight">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
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
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
      {children}
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
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full cursor-pointer rounded-xl border border-border/60 bg-background"
      />
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
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/15 p-3">
        {preview}
        <div className="flex flex-wrap gap-2">
          <Label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-foreground">
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
              className="rounded-2xl"
              onClick={onClear}
            >
              <Trash2 className="mr-2 h-4 w-4" />
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
      className="h-14 w-20 rounded-2xl border border-border/60 object-cover"
    />
  ) : (
    <div className="flex h-14 w-20 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
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
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-3">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {field.label}
            </Label>
            <Input
              type="number"
              min="0"
              value={layout[field.key]}
              onChange={(event) => onChange(field.key, Number(event.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
