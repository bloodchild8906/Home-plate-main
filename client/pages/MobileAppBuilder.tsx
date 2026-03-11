import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Pencil, Plus, Rocket, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  APP_TEMPLATES,
  type BuilderAppTemplateId,
  useBuilderStore,
} from "@/lib/builder-store";
import { STATIC_RUNTIME } from "@/lib/static-runtime";
import { exportMauiHybridProject } from "@/lib/maui-export";

export default function MobileAppBuilder() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [publishingAppId, setPublishingAppId] = useState("");
  const { apps, createApp, deleteApp, duplicateApp, updateApp } = useBuilderStore();
  const publishedApps = apps.filter((app) => app.published).length;
  const liveApps = apps.filter((app) => app.live).length;
  const totalPages = apps.reduce((sum, app) => sum + app.pages.length, 0);

  return (
    <AppShell
      title="App Builder"
      description="Manage all mobile apps here first, then open a dedicated designer for each app."
      actions={
        <CreateAppDialog
          open={open}
          onOpenChange={setOpen}
          onCreate={(options) => {
            const id = createApp(options);
            navigate(`/builder/${id}`);
          }}
        />
      }
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full px-3 py-1">Platform workspace</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {APP_TEMPLATES.length} templates
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Design, publish, and version mobile apps from one command deck.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  Start with a template, branch an existing app, or open the IDE-style builder to edit layout, styling, data bindings, and export targets.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Apps" value={apps.length} helper="Projects in workspace" />
              <MetricCard label="Published" value={publishedApps} helper="Ready for export" />
              <MetricCard label="Canvas pages" value={totalPages} helper={`${liveApps} live app${liveApps === 1 ? "" : "s"}`} />
            </div>
          </div>
        </section>

        <Card className="border-border/60 bg-card/90 shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <BrandMark
                        image={app.brand.logoImage}
                        text={app.brand.logo}
                        label={`${app.brand.appName} logo`}
                        primary={app.brand.primary}
                        accent={app.brand.accent}
                        className="h-11 w-11"
                        imageClassName="object-contain bg-white p-1.5"
                      />
                      <div>
                        <div className="font-bold">{app.name}</div>
                        <div className="text-xs text-muted-foreground">{app.brand.appName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.live ? "default" : "outline"}>
                      {app.live ? "Live" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.published ? "default" : "secondary"}>
                      {app.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>{app.pages.length}</TableCell>
                  <TableCell>{app.brand.domain}</TableCell>
                  <TableCell>{new Date(app.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/builder/${app.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const id = duplicateApp(app.id);
                          if (id) navigate(`/builder/${id}`);
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant={app.published ? "secondary" : "default"}
                        disabled={STATIC_RUNTIME || publishingAppId === app.id}
                        onClick={async () => {
                          if (app.published) {
                            updateApp(app.id, (current) => ({
                              ...current,
                              published: false,
                              live: false,
                            }));
                            toast.success(`${app.name} unpublished`);
                            return;
                          }

                          setPublishingAppId(app.id);

                          try {
                            const data = await exportMauiHybridProject(app);
                            updateApp(app.id, (current) => ({
                              ...current,
                              published: true,
                              live: current.live,
                            }));
                            toast.success(
                              `${app.name} published as a .NET MAUI Blazor Hybrid app at ${data.outputPath}`,
                            );
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to publish .NET MAUI Blazor Hybrid app",
                            );
                          } finally {
                            setPublishingAppId("");
                          }
                        }}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        {STATIC_RUNTIME
                          ? "Publish requires server mode"
                          : publishingAppId === app.id
                            ? "Publishing..."
                            : app.published
                              ? "Unpublish"
                              : "Publish"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteApp(app.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-border/60 bg-background/85 p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}

function CreateAppDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (options: { name: string; templateId: BuilderAppTemplateId }) => void;
}) {
  const [appName, setAppName] = useState("");
  const [templateId, setTemplateId] = useState<BuilderAppTemplateId>("loyalty");
  const isValid = appName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create new app
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a new app</DialogTitle>
          <DialogDescription>
            Pick a starting template, then name the app before opening the designer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              App name
            </div>
            <Input
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              placeholder="Enter the app name"
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Template
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {APP_TEMPLATES.map((template) => {
                const selected = template.id === templateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
                    className={`rounded-3xl border p-5 text-left transition-all ${
                      selected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black tracking-tight">{template.label}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      {selected ? <Sparkles className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant={selected ? "default" : "outline"} className="rounded-full px-3 py-1">
                        {template.category}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {template.pageCount} pages
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {template.preview.map((item) => (
                        <span key={item} className="rounded-full border border-border/60 px-2 py-1">
                          {item}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!isValid}
            onClick={() => {
              onCreate({ name: appName.trim(), templateId });
              setAppName("");
              setTemplateId("loyalty");
              onOpenChange(false);
            }}
          >
            Create app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
