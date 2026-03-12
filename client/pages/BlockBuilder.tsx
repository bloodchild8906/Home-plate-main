import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Grid2x2,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  QrCode,
  Receipt,
  Trash2,
  Type,
  UserRound,
  Gift,
  CreditCard,
} from "lucide-react";
import {
  createBlock,
  type BuilderAppModel,
  type BuilderBlock,
  type BuilderBlockType,
  type BuilderBrand,
} from "@/lib/builder-store";
import { AppShell } from "@/components/app-shell";
import { BuilderPhonePreview } from "@/components/mobile-builder/builder-phone-preview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const BLOCK_LIBRARY: {
  type: BuilderBlockType;
  label: string;
  icon: ReactNode;
}[] = [
  { type: "heading", label: "Heading", icon: <Type className="h-3.5 w-3.5" /> },
  { type: "text", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
  { type: "button", label: "Button", icon: <Plus className="h-3.5 w-3.5" /> },
  { type: "html", label: "HTML", icon: <Grid2x2 className="h-3.5 w-3.5" /> },
  { type: "quicklinks", label: "Links", icon: <Grid2x2 className="h-3.5 w-3.5" /> },
  { type: "receiptscan", label: "Receipt", icon: <Receipt className="h-3.5 w-3.5" /> },
  { type: "qrcode", label: "QR Scan", icon: <QrCode className="h-3.5 w-3.5" /> },
  { type: "rewardcatalog", label: "Rewards", icon: <Gift className="h-3.5 w-3.5" /> },
  { type: "wallet", label: "Wallet", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { type: "profile", label: "Profile", icon: <UserRound className="h-3.5 w-3.5" /> },
  { type: "auth", label: "Auth", icon: <KeyRound className="h-3.5 w-3.5" /> },
];

const PREVIEW_PRESET = { id: "standard", width: 375, height: 760 };
const PREVIEW_SCALE = 0.82;
const PREVIEW_CANVAS_HEIGHT = (PREVIEW_PRESET.height + 56) * PREVIEW_SCALE;

const PREVIEW_BRAND: BuilderBrand = {
  appName: "Block Builder Canvas",
  logo: "BB",
  logoImage: "",
  primary: "#ea580c",
  secondary: "#7c2d12",
  accent: "#f59e0b",
  surface: "#fff7ed",
  textColor: "#0f172a",
  cardBackground: "#ffffff",
  themePresetId: "sunset-mobile",
  fontPresetId: "default",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  customFontName: "",
  customFontSource: "",
  customFontFormat: "",
  backgroundImage: "",
  heroImage: "",
  customCss: "",
  customCssFileName: "",
  domain: "canvas.homeplate.app",
};

const PREVIEW_SURFACE_STYLE: CSSProperties = {
  backgroundColor: PREVIEW_BRAND.surface,
  color: PREVIEW_BRAND.textColor,
  fontFamily: PREVIEW_BRAND.fontFamily,
};

const PREVIEW_HERO_STYLE: CSSProperties = {
  background: `linear-gradient(145deg, ${PREVIEW_BRAND.secondary}, ${PREVIEW_BRAND.primary})`,
  boxShadow: `0 20px 48px -32px ${PREVIEW_BRAND.secondary}`,
};

export default function BlockBuilder() {
  const [blockType, setBlockType] = useState<BuilderBlockType>("heading");
  const [blocks, setBlocks] = useState<BuilderBlock[]>([
    createBlock("heading", { text: "Welcome block" }),
    createBlock("text", { text: "Intro text block for your app shell." }),
    createBlock("button", { text: "Primary action" }),
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState(() => blocks[0]?.id ?? "");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    const storedLeft = window.localStorage.getItem("homeplate:block-builder:left-collapsed");
    const storedRight = window.localStorage.getItem("homeplate:block-builder:right-collapsed");
    setLeftCollapsed(storedLeft === "1");
    setRightCollapsed(storedRight === "1");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("homeplate:block-builder:left-collapsed", leftCollapsed ? "1" : "0");
  }, [leftCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("homeplate:block-builder:right-collapsed", rightCollapsed ? "1" : "0");
  }, [rightCollapsed]);

  useEffect(() => {
    if (!blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(blocks[0]?.id ?? "");
    }
  }, [blocks, selectedBlockId]);

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? blocks[0];
  const selectedIndex = blocks.findIndex((block) => block.id === selectedBlock?.id);

  const addBlock = (type: BuilderBlockType = blockType) => {
    const next = createBlock(type);
    setBlocks((current) => [...current, next]);
    setSelectedBlockId(next.id);
  };

  const removeBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const duplicateSelectedBlock = () => {
    if (!selectedBlock) {
      return;
    }

    const duplicated = createBlock(selectedBlock.type, {
      ...selectedBlock,
      id: undefined,
      name: `${selectedBlock.name} Copy`,
    });
    setBlocks((current) => [...current, duplicated]);
    setSelectedBlockId(duplicated.id);
  };

  const updateSelectedBlock = (updater: (block: BuilderBlock) => BuilderBlock) => {
    if (!selectedBlock) {
      return;
    }

    setBlocks((current) =>
      current.map((block) => (block.id === selectedBlock.id ? updater(block) : block)),
    );
  };

  const exportJson = useMemo(() => JSON.stringify(blocks, null, 2), [blocks]);
  const previewApp = useMemo<BuilderAppModel>(
    () => ({
      id: "block-builder-canvas",
      name: "Block Builder Canvas",
      published: false,
      live: false,
      updatedAt: new Date().toISOString(),
      brand: PREVIEW_BRAND,
      apiFunctions: [],
      pages: [{ id: "canvas", name: "Canvas", blocks }],
    }),
    [blocks],
  );

  const elementsContent = (
    <div className="space-y-4 p-4">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Quick add
        </div>
        <div className="mt-3 flex gap-2">
          <Select value={blockType} onValueChange={(value: BuilderBlockType) => setBlockType(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_LIBRARY.map((item) => (
                <SelectItem key={item.type} value={item.type}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => addBlock()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Elements
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BLOCK_LIBRARY.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => addBlock(item.type)}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-2.5 py-2 text-left text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Canvas layers
        </div>
        <div className="mt-3 space-y-2">
          {blocks.map((block, index) => {
            const active = selectedBlock?.id === block.id;
            return (
              <div
                key={block.id}
                className={cn(
                  "rounded-xl border p-2",
                  active
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 bg-background",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(block.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold">{block.name}</span>
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatBlockType(block.type)}
                  </div>
                </button>
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => moveBlock(block.id, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(block.id, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeBlock(block.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const inspectorContent = (
    <Tabs defaultValue="inspector" className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 px-4 pb-3 pt-4">
        <TabsList className="h-8">
          <TabsTrigger value="inspector" className="text-xs">Inspector</TabsTrigger>
          <TabsTrigger value="json" className="text-xs">JSON</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="inspector" className="mt-0 min-h-0 flex-1">
        <ScrollArea className="h-full p-4">
          {!selectedBlock ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
              Select a block on the canvas to edit it.
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-xs">
                Editing block #{selectedIndex + 1}
              </div>
              <Tabs key={selectedBlock.id} defaultValue="content" className="space-y-3">
                <TabsList className="grid h-8 w-full grid-cols-3">
                  <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
                  <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-0">
                  <Accordion
                    type="multiple"
                    defaultValue={["identity", "copy"]}
                    className="rounded-xl border border-border/60 bg-background/60"
                  >
                    <AccordionItem value="identity" className="border-border/60">
                      <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                        Identity
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 px-3 pb-3 pt-1">
                        <Field label="Block name">
                          <Input
                            className="h-8 text-xs"
                            value={selectedBlock.name}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({ ...block, name: event.target.value }))
                            }
                          />
                        </Field>
                        <Field label="Type">
                          <Select
                            value={selectedBlock.type}
                            onValueChange={(value: BuilderBlockType) =>
                              updateSelectedBlock((block) => ({ ...createBlock(value, block), type: value }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BLOCK_LIBRARY.map((item) => (
                                <SelectItem key={item.type} value={item.type}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="copy" className="border-border/60">
                      <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                        Content
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 px-3 pb-3 pt-1">
                        <Field label="Text">
                          <Input
                            className="h-8 text-xs"
                            value={selectedBlock.text ?? ""}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({ ...block, text: event.target.value }))
                            }
                          />
                        </Field>
                        <Field label="Helper">
                          <Textarea
                            className="min-h-[72px] text-xs"
                            value={selectedBlock.helper ?? ""}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({ ...block, helper: event.target.value }))
                            }
                          />
                        </Field>
                        <Field label="Items (one per line)">
                          <Textarea
                            className="min-h-[88px] text-xs"
                            value={(selectedBlock.items ?? []).join("\n")}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({
                                ...block,
                                items: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                              }))
                            }
                          />
                        </Field>
                        <Field label="Points">
                          <Input
                            className="h-8 text-xs"
                            type="number"
                            value={selectedBlock.points ?? 0}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({
                                ...block,
                                points: Number(event.target.value) || 0,
                              }))
                            }
                          />
                        </Field>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="style" className="mt-0">
                  <Accordion
                    type="multiple"
                    defaultValue={["appearance"]}
                    className="rounded-xl border border-border/60 bg-background/60"
                  >
                    <AccordionItem value="appearance" className="border-border/60">
                      <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                        Appearance
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 px-3 pb-3 pt-1">
                        <Field label="Class name">
                          <Input
                            className="h-8 text-xs"
                            value={selectedBlock.attributes.className}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({
                                ...block,
                                attributes: { ...block.attributes, className: event.target.value },
                              }))
                            }
                          />
                        </Field>
                        <Field label="Inline style">
                          <Input
                            className="h-8 text-xs"
                            value={selectedBlock.attributes.style}
                            onChange={(event) =>
                              updateSelectedBlock((block) => ({
                                ...block,
                                attributes: { ...block.attributes, style: event.target.value },
                              }))
                            }
                          />
                        </Field>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <Accordion
                    type="multiple"
                    defaultValue={selectedBlock.type === "html" ? ["markup", "actions"] : ["actions"]}
                    className="rounded-xl border border-border/60 bg-background/60"
                  >
                    {selectedBlock.type === "html" ? (
                      <AccordionItem value="markup" className="border-border/60">
                        <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                          HTML Markup
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 px-3 pb-3 pt-1">
                          <Field label="HTML tag">
                            <Input
                              className="h-8 text-xs"
                              value={selectedBlock.htmlTag ?? "section"}
                              onChange={(event) =>
                                updateSelectedBlock((block) => ({ ...block, htmlTag: event.target.value }))
                              }
                            />
                          </Field>
                          <Field label="HTML attributes (JSON)">
                            <Textarea
                              className="min-h-[84px] text-xs font-mono"
                              value={selectedBlock.htmlAttributes ?? ""}
                              onChange={(event) =>
                                updateSelectedBlock((block) => ({ ...block, htmlAttributes: event.target.value }))
                              }
                            />
                          </Field>
                          <Field label="HTML content">
                            <Textarea
                              className="min-h-[84px] text-xs"
                              value={selectedBlock.htmlContent ?? ""}
                              onChange={(event) =>
                                updateSelectedBlock((block) => ({ ...block, htmlContent: event.target.value }))
                              }
                            />
                          </Field>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}

                    <AccordionItem value="actions" className="border-border/60">
                      <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                        Actions
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 px-3 pb-3 pt-1">
                        <Button size="sm" variant="outline" onClick={duplicateSelectedBlock}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeBlock(selectedBlock.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="json" className="mt-0 min-h-0 flex-1">
        <div className="h-full p-4">
          <div className="h-full overflow-auto rounded-xl border border-border/60 bg-black p-3">
            <pre className="text-[11px] text-slate-100">{exportJson}</pre>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <AppShell
      title="Block Builder"
      description="Build reusable blocks using an element library, live canvas, and inspector."
      actions={
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setLeftCollapsed((current) => !current)}
              >
                {leftCollapsed ? (
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{leftCollapsed ? "Show elements panel" : "Hide elements panel"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setRightCollapsed((current) => !current)}
              >
                {rightCollapsed ? (
                  <PanelRightOpen className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightClose className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{rightCollapsed ? "Show inspector panel" : "Hide inspector panel"}</TooltipContent>
          </Tooltip>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="rounded-[1.8rem] border border-border/60 bg-card/90 shadow-xl lg:hidden">
          <Tabs defaultValue="canvas">
            <div className="border-b border-border/60 p-3">
              <TabsList className="grid h-8 w-full grid-cols-3">
                <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
                <TabsTrigger value="canvas" className="text-xs">Canvas</TabsTrigger>
                <TabsTrigger value="inspector" className="text-xs">Inspector</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="elements" className="mt-0">
              <ScrollArea className="h-[70vh]">{elementsContent}</ScrollArea>
            </TabsContent>
            <TabsContent value="canvas" className="mt-0">
              <div className="h-[70vh] overflow-auto bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_36%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))] p-4">
                <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Canvas Preview
                  </div>
                  <div className="mt-4 flex justify-center">
                    <BuilderPhonePreview
                      app={previewApp}
                      pageName="Canvas"
                      preset={PREVIEW_PRESET}
                      previewScale={PREVIEW_SCALE}
                      previewCanvasHeight={PREVIEW_CANVAS_HEIGHT}
                      previewSurfaceStyle={PREVIEW_SURFACE_STYLE}
                      previewHeroStyle={PREVIEW_HERO_STYLE}
                      scopedPreviewCss=""
                    >
                      <div className="space-y-2">{blocks.map((block, index) => (
                        <CanvasBlockCard
                          key={block.id}
                          block={block}
                          index={index}
                          selected={selectedBlock?.id === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                        />
                      ))}</div>
                    </BuilderPhonePreview>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="inspector" className="mt-0 h-[70vh]">
              {inspectorContent}
            </TabsContent>
          </Tabs>
        </section>

        <section className="hidden min-h-[76vh] overflow-hidden rounded-[1.8rem] border border-border/60 bg-card/90 shadow-xl lg:flex">
          {leftCollapsed ? (
            <div className="flex w-11 items-start justify-center border-r border-border/60 bg-background/50 pt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLeftCollapsed(false)}
                  >
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand elements panel</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <aside className="w-[300px] border-r border-border/60">
              <div className="flex h-11 items-center justify-between border-b border-border/60 px-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Elements
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setLeftCollapsed(true)}
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(76vh-44px)]">{elementsContent}</ScrollArea>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex h-11 items-center justify-between border-b border-border/60 px-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="px-2 py-0 text-[10px]">Canvas</Badge>
                <span>{blocks.length} blocks</span>
                {selectedBlock ? <span className="truncate">Selected: {selectedBlock.name}</span> : null}
              </div>
              <Button size="sm" onClick={() => addBlock()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add {formatBlockType(blockType)}
              </Button>
            </div>
            <div className="h-[calc(76vh-44px)] overflow-auto bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_36%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))] p-5">
              <div className="mx-auto max-w-[860px] rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Canvas Preview
                </div>
                <div className="flex justify-center">
                  <BuilderPhonePreview
                    app={previewApp}
                    pageName="Canvas"
                    preset={PREVIEW_PRESET}
                    previewScale={PREVIEW_SCALE}
                    previewCanvasHeight={PREVIEW_CANVAS_HEIGHT}
                    previewSurfaceStyle={PREVIEW_SURFACE_STYLE}
                    previewHeroStyle={PREVIEW_HERO_STYLE}
                    scopedPreviewCss=""
                  >
                    <div className="space-y-2">
                      {blocks.map((block, index) => (
                        <CanvasBlockCard
                          key={block.id}
                          block={block}
                          index={index}
                          selected={selectedBlock?.id === block.id}
                          onSelect={() => setSelectedBlockId(block.id)}
                        />
                      ))}
                    </div>
                  </BuilderPhonePreview>
                </div>
              </div>
            </div>
          </div>

          {rightCollapsed ? (
            <div className="flex w-11 items-start justify-center border-l border-border/60 bg-background/50 pt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setRightCollapsed(false)}
                  >
                    <PanelRightOpen className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Expand inspector panel</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <aside className="w-[360px] border-l border-border/60">
              <div className="flex h-11 items-center justify-between border-b border-border/60 px-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Inspector
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setRightCollapsed(true)}
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="h-[calc(76vh-44px)]">{inspectorContent}</div>
            </aside>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function CanvasBlockCard({
  block,
  index,
  selected,
  onSelect,
}: {
  block: BuilderBlock;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition",
        selected
          ? "border-primary/50 bg-primary/10 shadow-sm"
          : "border-border/60 bg-white hover:border-primary/30 hover:bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          #{index + 1}
        </div>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {formatBlockType(block.type)}
        </Badge>
      </div>
      <div className="mt-2 text-sm font-semibold">{block.text || block.name}</div>
      {block.helper ? <div className="mt-1 text-xs text-muted-foreground">{block.helper}</div> : null}
      {block.items?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {block.items.slice(0, 4).map((item) => (
            <Badge key={`${block.id}-${item}`} variant="secondary" className="px-2 py-0 text-[10px]">
              {item}
            </Badge>
          ))}
          {block.items.length > 4 ? (
            <Badge variant="outline" className="px-2 py-0 text-[10px]">+{block.items.length - 4}</Badge>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function formatBlockType(type: BuilderBlockType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (part) => part.toUpperCase());
}
