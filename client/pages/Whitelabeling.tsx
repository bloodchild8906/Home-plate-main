import type { ReactNode } from "react";
import { RefreshCcw, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBranding } from "@/lib/branding";
import { toast } from "sonner";

export default function Whitelabeling() {
  const { brand, updateBrand, resetBrand } = useBranding();

  return (
    <AppShell
      title="Whitelabeling"
      description="These branding settings apply site-wide across the dashboard, designer shell, and module chrome."
      actions={
        <>
          <Button variant="outline" onClick={() => resetBrand()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={() => toast.success("Brand settings saved site-wide")}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black">Brand controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Brand name">
              <Input value={brand.name} onChange={(event) => updateBrand({ name: event.target.value })} />
            </Field>
            <Field label="Tagline">
              <Input value={brand.tagline} onChange={(event) => updateBrand({ tagline: event.target.value })} />
            </Field>
            <Field label="Logo text">
              <Input value={brand.logo} onChange={(event) => updateBrand({ logo: event.target.value.toUpperCase().slice(0, 3) })} />
            </Field>
            <Field label="Domain">
              <Input value={brand.domain} onChange={(event) => updateBrand({ domain: event.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <ColorField label="Primary" value={brand.primary} onChange={(value) => updateBrand({ primary: value })} />
              <ColorField label="Secondary" value={brand.secondary} onChange={(value) => updateBrand({ secondary: value })} />
              <ColorField label="Accent" value={brand.accent} onChange={(value) => updateBrand({ accent: value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black">Live preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-[2rem] p-6 text-white" style={{ background: `linear-gradient(135deg, ${brand.secondary}, ${brand.primary})` }}>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black" style={{ backgroundColor: brand.accent, color: brand.secondary }}>
                  {brand.logo}
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight">{brand.name}</div>
                  <div className="text-sm text-white/75">{brand.tagline}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Primary action</div>
                <button className="mt-4 rounded-2xl px-4 py-3 font-bold text-white" style={{ backgroundColor: brand.primary }}>
                  Continue
                </button>
              </div>
              <div className="rounded-3xl border border-border/60 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Accent action</div>
                <button className="mt-4 rounded-2xl px-4 py-3 font-bold" style={{ backgroundColor: brand.accent, color: brand.secondary }}>
                  Highlight
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Applied across the app</div>
              <p className="mt-3 text-sm text-muted-foreground">
                Changes here immediately affect the shell header, module branding, and help widget context throughout the workspace.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({
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
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</Label>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full cursor-pointer rounded-xl border border-border/60 bg-background" />
    </div>
  );
}
