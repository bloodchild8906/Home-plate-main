import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Pencil, Plus, Rocket, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
import { useBuilderStore } from "@/lib/builder-store";

export default function MobileAppBuilder() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { apps, createApp, deleteApp, duplicateApp, updateApp } = useBuilderStore();

  return (
    <AppShell
      title="App Builder"
      description="Manage all mobile apps here first, then open a dedicated designer for each app."
      actions={
        <CreateAppDialog
          open={open}
          onOpenChange={setOpen}
          onCreate={(mode) => {
            const id = createApp(mode);
            navigate(`/builder/${id}`);
          }}
        />
      }
    >
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
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white"
                        style={{ backgroundColor: app.brand.primary }}
                      >
                        {app.brand.logo}
                      </div>
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
                        onClick={() =>
                          updateApp(app.id, (current) => ({
                            ...current,
                            published: !current.published,
                            live: !current.published ? current.live : false,
                          }))
                        }
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        {app.published ? "Unpublish" : "Publish"}
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
    </AppShell>
  );
}

function CreateAppDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (mode: "blank" | "template") => void;
}) {
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
            Choose whether to start from a blank canvas or from the default loyalty template.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => {
              onCreate("blank");
              onOpenChange(false);
            }}
            className="rounded-3xl border border-border/60 bg-background p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="text-lg font-black tracking-tight">Blank App</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Starts with a simple home page so you can build every page and flow from scratch.
            </p>
          </button>
          <button
            onClick={() => {
              onCreate("template");
              onOpenChange(false);
            }}
            className="rounded-3xl border border-border/60 bg-background p-5 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="text-lg font-black tracking-tight">From Template</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Starts with default `Earn`, `Redeem`, `Payments`, `Profile`, and `Auth` pages prefilled.
            </p>
          </button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
