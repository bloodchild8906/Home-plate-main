import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApiResponse,
  type RewardPointGeneratorInput,
  type RewardProgram,
} from "@shared/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Plus, QrCode, ScanLine, Ticket, Trash2 } from "lucide-react";

type ProgramDraft = {
  name: string;
  pointsPerDollar: number;
};

const EMPTY_PROGRAM: ProgramDraft = {
  name: "",
  pointsPerDollar: 1,
};

const EMPTY_GENERATOR: RewardPointGeneratorInput = {
  name: "",
  kind: "qr",
  points: 50,
  description: "",
  expiresAt: "",
};

export default function Rewards() {
  const queryClient = useQueryClient();
  const [programOpen, setProgramOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<RewardProgram | null>(null);
  const [quickPointsByProgram, setQuickPointsByProgram] = useState<Record<string, string>>({});
  const [programDraft, setProgramDraft] = useState<ProgramDraft>(EMPTY_PROGRAM);
  const [generatorDraft, setGeneratorDraft] = useState<RewardPointGeneratorInput>(EMPTY_GENERATOR);

  const { data: rewardsResponse, isLoading } = useQuery<ApiResponse<RewardProgram[]>>({
    queryKey: ["rewards"],
    queryFn: async () => {
      const response = await fetch("/api/rewards");
      if (!response.ok) throw new Error("Failed to fetch rewards");
      return response.json();
    },
  });

  const saveProgramMutation = useMutation({
    mutationFn: async (payload: ProgramDraft) => {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, tiers: [], redemptions: [], pointGenerators: [] }),
      });
      const result = (await response.json()) as ApiResponse<RewardProgram>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to create program");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setProgramOpen(false);
      setProgramDraft(EMPTY_PROGRAM);
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/rewards/${id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<RewardProgram>;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete program");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  const createGeneratorMutation = useMutation({
    mutationFn: async (payload: RewardPointGeneratorInput) => {
      if (!editingProgram) {
        throw new Error("No reward program selected");
      }
      const nextPayload: RewardPointGeneratorInput = {
        ...payload,
        name: payload.name.trim() || `${payload.points} pts ${payload.kind.replace("_", " ")}`,
        description: payload.description.trim() || "Generated loyalty earning code.",
      };
      const response = await fetch(`/api/rewards/${editingProgram.id}/point-generators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextPayload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to generate point code");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setGeneratorOpen(false);
      setGeneratorDraft(EMPTY_GENERATOR);
    },
  });

  const programs = rewardsResponse?.data ?? [];
  const totalGenerators = programs.reduce((sum, program) => sum + program.pointGenerators.length, 0);
  const totalRedemptions = programs.reduce((sum, program) => sum + program.redemptions.length, 0);
  const generatorPreviewProgramId = editingProgram?.id ?? "program";
  const generatorPreviewCode = `${generatorDraft.kind.slice(0, 2).toUpperCase()}${String(generatorDraft.points || 0).padStart(4, "0")}`;
  const generatorPreviewPayload = `homeplate://points/${generatorPreviewProgramId}/${generatorPreviewCode}`;

  return (
    <AppShell
      title="Rewards Studio"
      description="Manage reward programs and generate QR, text-code, and scan-card earning flows for the companion app."
      actions={
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const first = programs[0] ?? null;
              setEditingProgram(first);
              setGeneratorDraft({
                ...EMPTY_GENERATOR,
                points: Number(quickPointsByProgram[first?.id ?? ""] ?? 50) || 50,
              });
              setGeneratorOpen(true);
            }}
            disabled={programs.length === 0}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generate points
          </Button>
          <Button onClick={() => setProgramOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New program
          </Button>
        </div>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Programs" value={String(programs.length)} helper="Loyalty structures" icon={<Gift className="h-5 w-5" />} />
        <MetricCard label="Point generators" value={String(totalGenerators)} helper="QR/text/scan-card outputs" icon={<QrCode className="h-5 w-5" />} />
        <MetricCard label="Redemptions" value={String(totalRedemptions)} helper="Spend-point offers" icon={<Ticket className="h-5 w-5" />} />
        <MetricCard label="Average earn rate" value={`${(programs[0]?.pointsPerDollar ?? 0).toFixed(0)} pts/$`} helper="Current baseline" icon={<ScanLine className="h-5 w-5" />} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        {isLoading ? (
          <Card className="border-border/60 bg-card/90 shadow-xl">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading rewards...</CardContent>
          </Card>
        ) : programs.map((program) => (
          <Card key={program.id} className="border-border/60 bg-card/90 shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">{program.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{program.pointsPerDollar} points per $1 spent</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProgram(program);
                      setGeneratorDraft({
                        ...EMPTY_GENERATOR,
                        points: Number(quickPointsByProgram[program.id] ?? 50) || 50,
                      });
                      setGeneratorOpen(true);
                    }}
                  >
                    Generate points
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete ${program.name}?`)) {
                        deleteProgramMutation.mutate(program.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Quick generator
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="number"
                    min={1}
                    value={quickPointsByProgram[program.id] ?? ""}
                    onChange={(event) =>
                      setQuickPointsByProgram((current) => ({
                        ...current,
                        [program.id]: event.target.value,
                      }))
                    }
                    placeholder="Enter points"
                  />
                  <Button
                    onClick={() => {
                      setEditingProgram(program);
                      setGeneratorDraft({
                        ...EMPTY_GENERATOR,
                        kind: "qr",
                        points: Number(quickPointsByProgram[program.id] ?? 50) || 50,
                      });
                      setGeneratorOpen(true);
                    }}
                  >
                    Generate QR/code
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Tiers</div>
                <div className="grid gap-3">
                  {program.tiers.map((tier) => (
                    <div key={tier.id} className="rounded-3xl border border-border/60 bg-background/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-bold">{tier.name}</div>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {tier.pointsRequired} pts
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Companion-app point generators</div>
                <div className="grid gap-3">
                  {program.pointGenerators.length > 0 ? (
                    program.pointGenerators.map((generator) => (
                      <div key={generator.id} className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold">{generator.name}</div>
                          <Badge>{generator.kind.replace("_", " ")}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{generator.description}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
                          {generator.kind === "qr" ? (
                            <img
                              src={buildQrPreviewUrl(generator.payload)}
                              alt={`QR ${generator.code}`}
                              className="h-28 w-28 rounded-2xl border border-border/60 bg-white p-2"
                            />
                          ) : (
                            <div className="flex h-28 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-2xl font-black tracking-[0.25em]">
                              {generator.code}
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
                              <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Code</span>
                              <div className="mt-1 font-mono text-base font-semibold">{generator.code}</div>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground break-all">
                              {generator.payload}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline" className="rounded-full px-3 py-1">
                            {generator.points} pts
                          </Badge>
                          <Badge variant="outline" className="rounded-full px-3 py-1">
                            {generator.kind === "qr" ? "Scannable QR" : "Manual code"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                      No point generators yet.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={programOpen} onOpenChange={setProgramOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create reward program</DialogTitle>
            <DialogDescription>Start with an earn rate, then generate companion-app point codes.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveProgramMutation.mutate(programDraft);
            }}
          >
            <Field label="Program name">
              <Input value={programDraft.name} onChange={(event) => setProgramDraft((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Points per $1">
              <Input type="number" value={programDraft.pointsPerDollar} onChange={(event) => setProgramDraft((current) => ({ ...current, pointsPerDollar: Number(event.target.value) }))} required />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={saveProgramMutation.isPending}>
                {saveProgramMutation.isPending ? "Creating..." : "Create program"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={generatorOpen} onOpenChange={setGeneratorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate points</DialogTitle>
            <DialogDescription>
              Add the points, choose delivery type, and generate either a QR or plain code.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              createGeneratorMutation.mutate(generatorDraft);
            }}
          >
            <Field label="Program">
              <Select
                value={editingProgram?.id ?? ""}
                onValueChange={(value) => setEditingProgram(programs.find((program) => program.id === value) ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Points">
                <Input type="number" min={1} value={generatorDraft.points} onChange={(event) => setGeneratorDraft((current) => ({ ...current, points: Number(event.target.value) }))} required />
              </Field>
              <Field label="Generator name (optional)">
                <Input value={generatorDraft.name} onChange={(event) => setGeneratorDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Auto-generated if empty" />
              </Field>
              <Field label="Delivery type">
                <Select value={generatorDraft.kind} onValueChange={(value: RewardPointGeneratorInput["kind"]) => setGeneratorDraft((current) => ({ ...current, kind: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr">QR</SelectItem>
                    <SelectItem value="text_code">Text code</SelectItem>
                    <SelectItem value="scan_card">Scan card</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Expires at">
                <Input type="datetime-local" value={generatorDraft.expiresAt ?? ""} onChange={(event) => setGeneratorDraft((current) => ({ ...current, expiresAt: event.target.value }))} />
              </Field>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/80 p-4">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Live preview</div>
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                {generatorDraft.kind === "qr" ? (
                  <img
                    src={buildQrPreviewUrl(generatorPreviewPayload)}
                    alt="QR preview"
                    className="h-28 w-28 rounded-2xl border border-border/60 bg-white p-2"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-2xl font-black tracking-[0.25em]">
                    {generatorPreviewCode}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Code</span>
                    <div className="mt-1 font-mono text-base font-semibold">{generatorPreviewCode}</div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground break-all">
                    {generatorPreviewPayload}
                  </div>
                </div>
              </div>
            </div>
            <Field label="Description">
              <Textarea value={generatorDraft.description} onChange={(event) => setGeneratorDraft((current) => ({ ...current, description: event.target.value }))} />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={createGeneratorMutation.isPending || !editingProgram}>
                {createGeneratorMutation.isPending ? "Generating..." : "Generate points"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function buildQrPreviewUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
}

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-lg">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
