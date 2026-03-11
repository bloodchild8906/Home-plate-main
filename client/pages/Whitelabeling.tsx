import type { ChangeEvent, ReactNode } from "react";
import {
  ImagePlus,
  Palette,
  RefreshCcw,
  Save,
  Trash2,
  Type,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranding } from "@/lib/branding";
import { readImageFileAsDataUrl } from "@/lib/asset-utils";
import {
  buildUploadedFontFamily,
  deriveFontName,
  inferFontFormat,
  readFontFileAsDataUrl,
} from "@/lib/font-utils";
import {
  DEFAULT_FONT_PRESET_ID,
  findFontOption,
  findPlatformThemePreset,
  FONT_OPTIONS,
  PLATFORM_THEME_PRESETS,
  UPLOADED_FONT_PRESET_ID,
} from "@/lib/theme-presets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Whitelabeling() {
  const { brand, updateBrand, resetBrand, saveBrand, isSaving } = useBranding();
  const selectedTheme = findPlatformThemePreset(brand.themePresetId);
  const selectedFontValue = brand.customFontSource
    ? UPLOADED_FONT_PRESET_ID
    : brand.fontPresetId;
  const selectedFont = findFontOption(
    selectedFontValue === UPLOADED_FONT_PRESET_ID
      ? DEFAULT_FONT_PRESET_ID
      : brand.fontPresetId,
  );

  const uploadAsset = async (
    event: ChangeEvent<HTMLInputElement>,
    field: "logoImage" | "faviconImage",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const image = await readImageFileAsDataUrl(
        file,
        field === "faviconImage" ? 192 : 512,
      );
      updateBrand(
        field === "logoImage" ? { logoImage: image } : { faviconImage: image },
      );
      toast.success(field === "logoImage" ? "Logo uploaded" : "Favicon uploaded");
    } catch {
      toast.error("Unable to read that image");
    } finally {
      event.target.value = "";
    }
  };

  const applyThemePreset = (presetId: string) => {
    const preset = findPlatformThemePreset(presetId);
    updateBrand({
      themePresetId: preset.id,
      primary: preset.theme.primary,
      secondary: preset.theme.secondary,
      accent: preset.theme.accent,
    });
    toast.success(`${preset.label} applied`);
  };

  const applyFontPreset = (fontId: string) => {
    if (fontId === UPLOADED_FONT_PRESET_ID) {
      return;
    }

    const font = findFontOption(fontId);
    updateBrand({
      fontPresetId: font.id,
      fontFamily: font.family,
      customFontName: "",
      customFontSource: "",
      customFontFormat: "",
    });
  };

  const uploadFont = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fontName = deriveFontName(file.name);
      const fontSource = await readFontFileAsDataUrl(file);
      updateBrand({
        fontPresetId: UPLOADED_FONT_PRESET_ID,
        fontFamily: buildUploadedFontFamily(fontName),
        customFontName: fontName,
        customFontSource: fontSource,
        customFontFormat: inferFontFormat(file),
      });
      toast.success("Font uploaded");
    } catch {
      toast.error("Unable to read that font file");
    } finally {
      event.target.value = "";
    }
  };

  const clearUploadedFont = () => {
    updateBrand({
      fontPresetId: selectedFont.id || DEFAULT_FONT_PRESET_ID,
      fontFamily: selectedFont.family,
      customFontName: "",
      customFontSource: "",
      customFontFormat: "",
    });
  };

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
          <Button
            onClick={async () => {
              try {
                await saveBrand();
                toast.success("Brand settings saved site-wide");
              } catch {
                toast.error("Unable to save brand settings right now");
              }
            }}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black">Brand controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black">
                    <Palette className="h-4 w-4" />
                    Platform themes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose a preset, then tune any token and save the modified version for this site.
                  </p>
                </div>
                <Badge className="rounded-full px-3 py-1">{selectedTheme.label}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {PLATFORM_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      "rounded-3xl border border-border/60 bg-background/80 p-4 text-left transition hover:border-primary/60 hover:shadow-lg",
                      brand.themePresetId === preset.id &&
                        "border-primary bg-primary/5 shadow-[0_18px_48px_-28px_hsl(var(--primary)/0.55)]",
                    )}
                    onClick={() => applyThemePreset(preset.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black">{preset.label}</div>
                      <div className="flex gap-1.5">
                        {preset.swatches.map((swatch) => (
                          <span
                            key={`${preset.id}-${swatch}`}
                            className="h-4 w-4 rounded-full border border-white/60 shadow-sm"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Brand name">
              <Input
                value={brand.name}
                onChange={(event) => updateBrand({ name: event.target.value })}
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={brand.tagline}
                onChange={(event) => updateBrand({ tagline: event.target.value })}
              />
            </Field>
            <Field label="Logo text">
              <Input
                value={brand.logo}
                onChange={(event) =>
                  updateBrand({ logo: event.target.value.toUpperCase().slice(0, 3) })
                }
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <UploadField
                label="Logo image"
                actionLabel={brand.logoImage ? "Replace logo" : "Upload logo"}
                onChange={(event) => void uploadAsset(event, "logoImage")}
                preview={
                  <BrandMark
                    image={brand.logoImage}
                    text={brand.logo}
                    label={`${brand.name} logo`}
                    primary={brand.primary}
                    accent={brand.accent}
                    className="h-14 w-14"
                    imageClassName="object-contain bg-white p-1.5"
                  />
                }
                onClear={brand.logoImage ? () => updateBrand({ logoImage: "" }) : undefined}
              />
              <UploadField
                label="Favicon"
                actionLabel={brand.faviconImage ? "Replace favicon" : "Upload favicon"}
                onChange={(event) => void uploadAsset(event, "faviconImage")}
                preview={
                  <BrandMark
                    image={brand.faviconImage || brand.logoImage}
                    text={brand.logo}
                    label={`${brand.name} favicon`}
                    primary={brand.primary}
                    accent={brand.accent}
                    className="h-12 w-12 rounded-xl"
                    imageClassName="object-contain bg-white p-1.5"
                    textClassName="text-[10px]"
                  />
                }
                onClear={
                  brand.faviconImage ? () => updateBrand({ faviconImage: "" }) : undefined
                }
              />
            </div>
            <Field label="Domain">
              <Input
                value={brand.domain}
                onChange={(event) => updateBrand({ domain: event.target.value })}
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <ColorField
                label="Primary"
                value={brand.primary}
                onChange={(value) => updateBrand({ primary: value })}
              />
              <ColorField
                label="Secondary"
                value={brand.secondary}
                onChange={(value) => updateBrand({ secondary: value })}
              />
              <ColorField
                label="Accent"
                value={brand.accent}
                onChange={(value) => updateBrand({ accent: value })}
              />
            </div>

            <div className="rounded-[2rem] border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center gap-2 text-sm font-black">
                <Type className="h-4 w-4" />
                Font library
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Preset font">
                  <Select value={selectedFontValue} onValueChange={applyFontPreset}>
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Choose a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {brand.customFontSource ? (
                        <SelectItem value={UPLOADED_FONT_PRESET_ID}>
                          Uploaded: {brand.customFontName || "Custom font"}
                        </SelectItem>
                      ) : null}
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.id} value={font.id}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div
                  className="rounded-3xl border border-border/60 bg-background/90 p-5"
                  style={{ fontFamily: brand.fontFamily }}
                >
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Live font preview
                  </div>
                  <div className="mt-3 text-2xl font-black tracking-tight">
                    {brand.name} workspace
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Buttons, cards, navigation, headings, forms, and shared shell text all use this selection.
                  </p>
                </div>
                <Field label="Font stack">
                  <Input
                    value={brand.fontFamily}
                    onChange={(event) => updateBrand({ fontFamily: event.target.value })}
                    placeholder={selectedFont.family}
                  />
                </Field>
                <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold">Uploaded font</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {brand.customFontName || "No uploaded font saved"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm font-semibold text-foreground">
                        <Type className="h-4 w-4" />
                        Upload font
                        <input
                          type="file"
                          accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                          className="sr-only"
                          onChange={(event) => void uploadFont(event)}
                        />
                      </Label>
                      {brand.customFontSource ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-2xl"
                          onClick={clearUploadedFont}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-black">Live preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6" style={{ fontFamily: brand.fontFamily }}>
            <div
              className="rounded-[2rem] p-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${brand.secondary}, ${brand.primary})`,
              }}
            >
              <div className="flex items-center gap-4">
                <BrandMark
                  image={brand.logoImage}
                  text={brand.logo}
                  label={`${brand.name} logo`}
                  primary={brand.primary}
                  accent={brand.accent}
                  className="h-14 w-14"
                  imageClassName="object-contain bg-white p-2"
                />
                <div>
                  <div className="text-2xl font-black tracking-tight">{brand.name}</div>
                  <div className="text-sm text-white/75">{brand.tagline}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Buttons and badges
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button className="rounded-2xl">Continue</Button>
                  <Button variant="secondary" className="rounded-2xl">
                    Secondary
                  </Button>
                  <Button variant="outline" className="rounded-2xl">
                    Outline
                  </Button>
                  <Badge className="rounded-full px-3 py-1">Live brand</Badge>
                </div>
              </div>
              <div className="rounded-3xl border border-border/60 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Forms and surfaces
                </div>
                <div className="mt-4 space-y-3">
                  <Input value={brand.domain} readOnly className="rounded-2xl" />
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Cards, inputs, focus rings, shell chrome, and shared headings inherit the saved platform theme and font.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/60 bg-muted/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Applied across the app
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Changes here immediately affect shared buttons, cards, inputs, shell navigation, headers, and the stored site logo, favicon, and font stack throughout the workspace.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function UploadField({
  label,
  actionLabel,
  preview,
  onChange,
  onClear,
}: {
  label: string;
  actionLabel: string;
  preview: ReactNode;
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
            <input type="file" accept="image/*" className="sr-only" onChange={onChange} />
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </Label>
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
