import { useMemo, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Copy,
  CreditCard,
  Eye,
  Gift,
  Grid2x2,
  KeyRound,
  MoveVertical,
  Plus,
  QrCode,
  Receipt,
  ScanLine,
  Trash2,
  Type,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { BuilderMauiExportResponse, type ApiResponse } from "@shared/api";
import { createBlock, type BuilderAppModel, type BuilderBlock, type BuilderBlockType, useBuilderStore } from "@/lib/builder-store";

const PHONE_PRESETS = [
  { id: "compact", label: "Compact", width: 320, height: 680 },
  { id: "standard", label: "Standard", width: 375, height: 760 },
  { id: "plus", label: "Plus", width: 430, height: 860 },
  { id: "tablet-small", label: "Tablet S", width: 768, height: 1024 },
  { id: "tablet-large", label: "Tablet L", width: 834, height: 1194 },
] as const;

const LIBRARY: { type: BuilderBlockType; label: string; icon: ReactNode }[] = [
  { type: "heading", label: "Heading", icon: <Type className="h-4 w-4" /> },
  { type: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { type: "button", label: "Button", icon: <Plus className="h-4 w-4" /> },
  { type: "quicklinks", label: "Quick Links", icon: <Grid2x2 className="h-4 w-4" /> },
  { type: "receiptscan", label: "Receipt", icon: <Receipt className="h-4 w-4" /> },
  { type: "qrcode", label: "QR Scan", icon: <QrCode className="h-4 w-4" /> },
  { type: "rewardcatalog", label: "Redeem", icon: <Gift className="h-4 w-4" /> },
  { type: "wallet", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { type: "profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
  { type: "auth", label: "Auth", icon: <KeyRound className="h-4 w-4" /> },
];

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export default function MobileAppDesigner() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { apps, updateApp } = useBuilderStore();
  const app = apps.find((item) => item.id === appId);
  const [selectedPageId, setSelectedPageId] = useState(app?.pages[0]?.id ?? "");
  const [selectedBlockId, setSelectedBlockId] = useState(app?.pages[0]?.blocks[0]?.id ?? "");
  const [preview, setPreview] = useState(false);
  const [screenSize, setScreenSize] = useState<(typeof PHONE_PRESETS)[number]["id"]>("standard");
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);
  const [dragPageId, setDragPageId] = useState<string | null>(null);

  if (!app) {
    return <Navigate to="/builder" replace />;
  }

  const page = app.pages.find((item) => item.id === selectedPageId) ?? app.pages[0];
  const block = page?.blocks.find((item) => item.id === selectedBlockId) ?? page?.blocks[0];
  const preset = PHONE_PRESETS.find((item) => item.id === screenSize) ?? PHONE_PRESETS[1];

  const updateCurrentApp = (updater: (current: BuilderAppModel) => BuilderAppModel) => {
    updateApp(app.id, updater);
  };

  const updateCurrentPage = (updater: (pageData: BuilderAppModel["pages"][number]) => BuilderAppModel["pages"][number]) => {
    updateCurrentApp((current) => ({
      ...current,
      pages: current.pages.map((item) => (item.id === page.id ? updater(item) : item)),
    }));
  };

  const reorderById = <T extends { id: string }>(items: T[], fromId: string, toId: string) => {
    const next = [...items];
    const from = next.findIndex((item) => item.id === fromId);
    const to = next.findIndex((item) => item.id === toId);
    if (from === -1 || to === -1) return items;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const renderPreview = useMemo(() => (item: BuilderBlock, selected: boolean) => renderBlock(item, app, selected), [app]);

  return (
    <AppShell
      title={`${app.name} Designer`}
      description="Design the selected app on a dedicated page. Resize the preview, manage default pages, reorder blocks, and refine white-label settings."
      fluid
      actions={
        <>
          <Button variant="outline" onClick={() => navigate("/builder")}>Back to apps</Button>
          <Button
            onClick={async () => {
              const response = await fetch("/api/builder/export-maui", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ app }),
              });
              const data = (await response.json()) as ApiResponse<BuilderMauiExportResponse>;
              if (!response.ok || !data.success || !data.data) {
                toast.error(data.error ?? "Failed to build MAUI project");
                return;
              }
              toast.success(`MAUI project created at ${data.data.outputPath}`);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Build MAUI app
          </Button>
          <Button variant="outline" onClick={() => setPreview((current) => !current)}>
            <Eye className="mr-2 h-4 w-4" />
            {preview ? "Edit mode" : "Preview mode"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        {!preview ? (
          <div className="space-y-5">
            <Panel eyebrow="Explorer" title="Project">
              <Tabs defaultValue="pages">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-muted/40 p-1">
                  <TabsTrigger value="pages">Pages</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                </TabsList>
                <TabsContent value="pages" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Add or remove app pages here.</p>
                    <Button size="sm" onClick={() => {
                      const nextPage = { id: uid("p"), name: `Page ${app.pages.length + 1}`, blocks: [createBlock("heading"), createBlock("text")] };
                      updateCurrentApp((current) => ({ ...current, pages: [...current.pages, nextPage] }));
                      setSelectedPageId(nextPage.id);
                      setSelectedBlockId(nextPage.blocks[0].id);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      New page
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {app.pages.map((item) => (
                      <ContextMenu key={item.id}>
                        <ContextMenuTrigger>
                          <button
                            draggable
                            onDragStart={() => setDragPageId(item.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (!dragPageId) return;
                              updateCurrentApp((current) => ({ ...current, pages: reorderById(current.pages, dragPageId, item.id) }));
                              setDragPageId(null);
                            }}
                            onClick={() => {
                              setSelectedPageId(item.id);
                              setSelectedBlockId(item.blocks[0]?.id ?? "");
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${item.id === page.id ? "border-primary/40 bg-primary/5" : "border-border/60 bg-background/70"}`}
                          >
                            <div>
                              <div className="font-bold">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{item.blocks.length} blocks</div>
                            </div>
                            <MoveVertical className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuLabel>Page Actions</ContextMenuLabel>
                          <ContextMenuItem onClick={() => {
                            const copy = { ...item, id: uid("p"), name: `${item.name} Copy`, blocks: item.blocks.map((entry) => ({ ...entry, id: uid("b") })) };
                            updateCurrentApp((current) => ({ ...current, pages: [...current.pages, copy] }));
                          }}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate page
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                            if (app.pages.length === 1) return;
                            updateCurrentApp((current) => ({ ...current, pages: current.pages.filter((entry) => entry.id !== item.id) }));
                            if (page.id === item.id) {
                              const fallback = app.pages.find((entry) => entry.id !== item.id);
                              setSelectedPageId(fallback?.id ?? "");
                              setSelectedBlockId(fallback?.blocks[0]?.id ?? "");
                            }
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove page
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="branding" className="mt-4 space-y-4">
                  <Field label="App name">
                    <Input value={app.brand.appName} onChange={(event) => updateCurrentApp((current) => ({ ...current, name: event.target.value, brand: { ...current.brand, appName: event.target.value } }))} />
                  </Field>
                  <Field label="Domain">
                    <Input value={app.brand.domain} onChange={(event) => updateCurrentApp((current) => ({ ...current, brand: { ...current.brand, domain: event.target.value } }))} />
                  </Field>
                </TabsContent>
              </Tabs>
            </Panel>

            <Panel eyebrow="Toolbar" title="Add Blocks">
              <div className="flex flex-wrap gap-3">
                {LIBRARY.map((item) => (
                  <Tooltip key={item.type}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          const next = createBlock(item.type);
                          updateCurrentPage((current) => ({ ...current, blocks: [...current.blocks, next] }));
                          setSelectedBlockId(next.id);
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/75 text-primary transition-all hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="scale-110">{item.icon}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] rounded-2xl p-3">
                      <div className="font-bold">{item.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Add this block to the selected page.</div>
                      <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-2 text-[10px] text-muted-foreground">Preview: {item.label} block</div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </Panel>
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted)/0.45),hsl(var(--background)))] p-4 shadow-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Preview</div>
              <h2 className="mt-2 text-xl font-black tracking-tight">{page.name}</h2>
            </div>
            <select
              value={screenSize}
              onChange={(event) => setScreenSize(event.target.value as (typeof PHONE_PRESETS)[number]["id"])}
              className="h-10 rounded-2xl border border-border/60 bg-background px-3 text-sm"
            >
              {PHONE_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} ({item.width}px)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="rounded-[3.2rem] bg-slate-950 p-3 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.72)]">
              <div className="overflow-hidden rounded-[2.5rem] bg-white transition-all" style={{ width: preset.width }}>
                <div className="flex h-8 items-center justify-center bg-slate-950">
                  <div className="h-1.5 w-24 rounded-full bg-slate-700" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ScrollArea style={{ height: preset.height }}>
                      <div className="space-y-3 p-3" style={{ backgroundColor: app.brand.surface }}>
                        {page.blocks.map((item) => (
                          <ContextMenu key={item.id}>
                            <ContextMenuTrigger>
                              <div
                                draggable={!preview}
                                onDragStart={() => setDragBlockId(item.id)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                  if (!dragBlockId) return;
                                  updateCurrentPage((current) => ({ ...current, blocks: reorderById(current.blocks, dragBlockId, item.id) }));
                                  setDragBlockId(null);
                                }}
                                onClick={() => setSelectedBlockId(item.id)}
                              >
                                {renderPreview(item, item.id === block?.id)}
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuLabel>Block Actions</ContextMenuLabel>
                              <ContextMenuItem onClick={() => {
                                const copy = { ...item, id: uid("b") };
                                updateCurrentPage((current) => ({ ...current, blocks: [...current.blocks, copy] }));
                              }}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate block
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                                updateCurrentPage((current) => ({ ...current, blocks: current.blocks.filter((entry) => entry.id !== item.id) }));
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove block
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {!preview && block ? (
          <div className="space-y-5">
            <Panel eyebrow="Inspector" title="Selected Block">
              <div className="space-y-4">
                <Field label="Text">
                  <Input value={block.text ?? ""} onChange={(event) => updateCurrentPage((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, text: event.target.value } : item) }))} />
                </Field>
                {["quicklinks", "rewardcatalog", "wallet", "profile"].includes(block.type) ? (
                  <Field label="Items">
                    <Textarea className="min-h-[100px]" value={(block.items ?? []).join("\n")} onChange={(event) => updateCurrentPage((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, items: event.target.value.split("\n").map((entry) => entry.trim()).filter(Boolean) } : item) }))} />
                  </Field>
                ) : null}
                {["receiptscan", "qrcode", "auth"].includes(block.type) ? (
                  <Field label="Helper">
                    <Textarea className="min-h-[80px]" value={block.helper ?? ""} onChange={(event) => updateCurrentPage((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, helper: event.target.value } : item) }))} />
                  </Field>
                ) : null}
                {["receiptscan", "qrcode"].includes(block.type) ? (
                  <Field label="Points">
                    <Input type="number" min="1" value={block.points ?? 0} onChange={(event) => updateCurrentPage((current) => ({ ...current, blocks: current.blocks.map((item) => item.id === block.id ? { ...item, points: Number(event.target.value) } : item) }))} />
                  </Field>
                ) : null}
              </div>
            </Panel>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-xl">
      <div className="border-b border-border/60 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</div>
        <h2 className="mt-2 text-xl font-black tracking-tight">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
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

function renderBlock(block: BuilderBlock, app: BuilderAppModel, selected: boolean) {
  const className = `rounded-[1.3rem] bg-white p-4 transition-all ${selected ? "ring-2 shadow-lg" : "hover:shadow-md"}`;
  const style = selected ? ({ boxShadow: `0 0 0 2px ${app.brand.primary}` } as const) : undefined;
  switch (block.type) {
    case "heading":
      return <div className={className} style={style}><h1 className="text-xl font-black tracking-tight">{block.text}</h1></div>;
    case "text":
      return <div className={className} style={style}><p className="text-xs leading-5 text-slate-600">{block.text}</p></div>;
    case "button":
      return <div className={className} style={style}><button className="w-full rounded-2xl px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: app.brand.primary }}>{block.text}</button></div>;
    case "quicklinks":
      return <div className={className} style={style}><div className="grid grid-cols-2 gap-2">{(block.items ?? []).map((item) => <div key={item} className="rounded-2xl border border-border p-3 text-xs font-bold">{item}</div>)}</div></div>;
    case "receiptscan":
      return <div className={className} style={style}><div className="flex items-center justify-between"><div><div className="text-sm font-black">{block.text}</div><div className="mt-1 text-[11px] text-slate-500">{block.helper}</div></div><ScanLine className="h-5 w-5" style={{ color: app.brand.primary }} /></div><div className="mt-3 text-xs font-bold">+{block.points} pts</div></div>;
    case "qrcode":
      return <div className={className} style={style}><div className="flex items-center justify-between"><div><div className="text-sm font-black">{block.text}</div><div className="mt-1 text-[11px] text-slate-500">{block.helper}</div></div><QrCode className="h-5 w-5" style={{ color: app.brand.primary }} /></div></div>;
    case "rewardcatalog":
      return <div className={className} style={style}><div className="mb-2 text-sm font-black">{block.text}</div><div className="space-y-2">{(block.items ?? []).map((item) => <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold">{item}</div>)}</div></div>;
    case "wallet":
      return <div className={className} style={style}><div className="mb-2 text-sm font-black">{block.text}</div><div className="space-y-2">{(block.items ?? []).map((item) => <div key={item} className="rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: app.brand.primary }}>{item}</div>)}</div></div>;
    case "profile":
      return <div className={className} style={style}><div className="mb-2 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: app.brand.primary }}><UserRound className="h-5 w-5" /></div><div className="text-sm font-black">{block.text}</div></div><div className="space-y-2">{(block.items ?? []).map((item) => <div key={item} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold">{item}</div>)}</div></div>;
    case "auth":
      return <div className={className} style={style}><div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(145deg, ${app.brand.primary}, #0f172a)` }}><div className="text-lg font-black">{block.text}</div><div className="mt-1 text-[11px] text-white/75">{block.helper}</div></div></div>;
    default:
      return null;
  }
}
