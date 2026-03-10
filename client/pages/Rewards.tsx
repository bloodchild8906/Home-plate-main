import { useState, type ReactNode } from "react";
import {
  Gift,
  MoreHorizontal,
  Percent,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiResponse,
  RewardProgram,
  RewardRedemptionOption,
  RewardTier,
} from "@shared/api";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Rewards() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: rewardsResponse, isLoading } = useQuery<ApiResponse<RewardProgram[]>>({
    queryKey: ["rewards"],
    queryFn: async () => {
      const response = await fetch("/api/rewards");
      if (!response.ok) {
        throw new Error("Failed to fetch reward programs");
      }
      return response.json();
    },
  });

  const deleteProgramMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/rewards/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete reward program");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Reward program deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const programs = rewardsResponse?.data ?? [];
  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalRedemptions = programs.reduce(
    (count, program) => count + program.redemptions.length,
    0,
  );

  return (
    <AppShell
      title="Rewards Studio"
      description="Design earning logic, receipt-based point capture, tier progression, and spend-points redemption rewards in one workspace."
      actions={<CreateProgramDialog />}
    >
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="overflow-hidden border-border/60 bg-card/90 shadow-2xl">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.16),transparent_22%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.14),transparent_28%)]" />
            <div className="relative">
              <Badge className="rounded-full px-3 py-1">Loyalty commerce</Badge>
              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Let members earn through receipt scans and spend points on rewards they actually want.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                This update adds receipt-scan earning moments to the app design workflow and expands program management with explicit redemption catalog options.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricTile label="Programs" value={String(programs.length)} helper="Live loyalty setups" icon={<Gift className="h-4 w-4" />} />
                <MetricTile label="Redemptions" value={String(totalRedemptions)} helper="Spend-points rewards" icon={<Ticket className="h-4 w-4" />} />
                <MetricTile label="Receipt capture" value="Enabled" helper="Member earns from scan flow" icon={<Receipt className="h-4 w-4" />} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-slate-950 text-slate-50 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              Redemption patterns
            </CardTitle>
            <CardDescription className="text-slate-400">
              Common ways members can spend points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <PatternCard
              icon={<Percent className="h-4 w-4" />}
              title="Instant discounts"
              description="Convert points into an order-level discount at checkout."
            />
            <PatternCard
              icon={<Gift className="h-4 w-4" />}
              title="Free items"
              description="Allow point redemptions for coffee, sides, desserts, or signature items."
            />
            <PatternCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Experience perks"
              description="Use points for VIP booking, birthday access, or member-only drops."
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Reward programs</h3>
            <p className="text-sm text-muted-foreground">
              Search and manage tiers plus point-spend options per program.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search reward programs..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 rounded-2xl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] border border-border/60 bg-card/80">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onDelete={() => deleteProgramMutation.mutate(program.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border/60 bg-card/85 shadow-xl">
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Gift className="h-10 w-10" />
              </div>
              <h4 className="text-2xl font-black tracking-tight">No reward programs found</h4>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {searchTerm
                  ? `No programs match "${searchTerm}".`
                  : "Create your first program to define earning rates, tiers, and ways to spend points."}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  );
}

function ProgramCard({
  program,
  onDelete,
}: {
  program: RewardProgram;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden border-border/60 bg-card/90 shadow-xl">
      <CardHeader className="border-b border-border/60 bg-[linear-gradient(135deg,hsl(var(--accent)/0.16),transparent_60%)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {program.pointsPerDollar} point / $1
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {program.redemptions.length} redemptions
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">{program.name}</CardTitle>
            <CardDescription className="mt-2">
              Earn through spend and scanned receipts, then convert points into rewards.
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <WandSparkles className="mr-2 h-4 w-4" />
                Edit program
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete program
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            Tiers
          </div>
          <div className="space-y-3">
            {program.tiers
              .slice()
              .sort((left, right) => left.pointsRequired - right.pointsRequired)
              .map((tier) => (
                <div key={tier.id} className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold">{tier.name}</div>
                    <Badge className="rounded-full px-3 py-1">{tier.pointsRequired} pts</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <Ticket className="h-4 w-4 text-accent" />
            Spend Points
          </div>
          <div className="space-y-3">
            {program.redemptions.map((option) => (
              <div key={option.id} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold">{option.title}</div>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {option.pointsCost} pts
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {formatRedemption(option)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-muted/20 px-6 py-4">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Manage tiers & rewards
        </Button>
      </CardFooter>

      <ProgramEditorDialog open={open} onOpenChange={setOpen} program={program} />
    </Card>
  );
}

function CreateProgramDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    pointsPerDollar: 1,
  });
  const queryClient = useQueryClient();

  const createProgramMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tiers: [],
          redemptions: [],
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create reward program");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Reward program created");
      setFormData({ name: "", pointsPerDollar: 1 });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createProgramMutation.mutate(formData);
          }}
        >
          <DialogHeader>
            <DialogTitle>Create reward program</DialogTitle>
            <DialogDescription>
              Start with earning rules, then add tiers and point-spend options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Field label="Program name">
              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="VIP Dining Club"
                required
              />
            </Field>
            <Field label="Points per $1 spent">
              <Input
                type="number"
                min="1"
                value={formData.pointsPerDollar}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    pointsPerDollar: Number(event.target.value),
                  }))
                }
                required
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createProgramMutation.isPending}>
              {createProgramMutation.isPending ? "Creating..." : "Create program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProgramEditorDialog({
  open,
  onOpenChange,
  program,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: RewardProgram;
}) {
  const queryClient = useQueryClient();
  const [tierDraft, setTierDraft] = useState<Partial<RewardTier>>({});
  const [redemptionDraft, setRedemptionDraft] = useState<Partial<RewardRedemptionOption>>({
    rewardType: "discount",
  });

  const updateProgramMutation = useMutation({
    mutationFn: async (updatedProgram: RewardProgram) => {
      const response = await fetch(`/api/rewards/${program.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProgram),
      });
      if (!response.ok) {
        throw new Error("Failed to update reward program");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast.success("Reward program updated");
      setTierDraft({});
      setRedemptionDraft({ rewardType: "discount" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addTier = (event: React.FormEvent) => {
    event.preventDefault();

    if (!tierDraft.name || tierDraft.pointsRequired === undefined || !tierDraft.description) {
      return;
    }

    updateProgramMutation.mutate({
      ...program,
      tiers: [
        ...program.tiers,
        {
          id: `tier-${Date.now()}`,
          name: tierDraft.name,
          pointsRequired: Number(tierDraft.pointsRequired),
          description: tierDraft.description,
          discount: tierDraft.discount ? Number(tierDraft.discount) : undefined,
          freeItem: tierDraft.freeItem || undefined,
        },
      ],
    });
  };

  const addRedemption = (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !redemptionDraft.title ||
      redemptionDraft.pointsCost === undefined ||
      !redemptionDraft.value ||
      !redemptionDraft.description ||
      !redemptionDraft.rewardType
    ) {
      return;
    }

    updateProgramMutation.mutate({
      ...program,
      redemptions: [
        ...program.redemptions,
        {
          id: `redemption-${Date.now()}`,
          title: redemptionDraft.title,
          pointsCost: Number(redemptionDraft.pointsCost),
          rewardType: redemptionDraft.rewardType,
          value: redemptionDraft.value,
          description: redemptionDraft.description,
        },
      ],
    });
  };

  const removeTier = (tierId: string) => {
    updateProgramMutation.mutate({
      ...program,
      tiers: program.tiers.filter((tier) => tier.id !== tierId),
    });
  };

  const removeRedemption = (redemptionId: string) => {
    updateProgramMutation.mutate({
      ...program,
      redemptions: program.redemptions.filter((redemption) => redemption.id !== redemptionId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{program.name}</DialogTitle>
          <DialogDescription>
            Manage status tiers and add rewards members can unlock by spending points.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tiers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tiers">Tiers</TabsTrigger>
            <TabsTrigger value="redemptions">Spend Points</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <ScrollArea className="h-[420px] rounded-2xl border border-border/60 p-4">
                <div className="space-y-3">
                  {program.tiers.map((tier) => (
                    <div key={tier.id} className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{tier.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{tier.description}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeTier(tier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge>{tier.pointsRequired} pts</Badge>
                        {tier.discount ? <Badge variant="outline">{tier.discount}% off</Badge> : null}
                        {tier.freeItem ? <Badge variant="outline">Free {tier.freeItem}</Badge> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={addTier} className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                <Field label="Tier name">
                  <Input
                    value={tierDraft.name ?? ""}
                    onChange={(event) =>
                      setTierDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Platinum"
                    required
                  />
                </Field>
                <Field label="Points required">
                  <Input
                    type="number"
                    min="0"
                    value={tierDraft.pointsRequired ?? ""}
                    onChange={(event) =>
                      setTierDraft((current) => ({
                        ...current,
                        pointsRequired: Number(event.target.value),
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={tierDraft.description ?? ""}
                    onChange={(event) =>
                      setTierDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Early access plus concierge support"
                    required
                  />
                </Field>
                <Field label="Discount % (optional)">
                  <Input
                    type="number"
                    min="0"
                    value={tierDraft.discount ?? ""}
                    onChange={(event) =>
                      setTierDraft((current) => ({
                        ...current,
                        discount: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
                <Field label="Free item (optional)">
                  <Input
                    value={tierDraft.freeItem ?? ""}
                    onChange={(event) =>
                      setTierDraft((current) => ({
                        ...current,
                        freeItem: event.target.value,
                      }))
                    }
                    placeholder="Dessert"
                  />
                </Field>
                <Button type="submit" disabled={updateProgramMutation.isPending}>
                  Add tier
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="redemptions" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <ScrollArea className="h-[420px] rounded-2xl border border-border/60 p-4">
                <div className="space-y-3">
                  {program.redemptions.map((redemption) => (
                    <div key={redemption.id} className="rounded-2xl border border-border/60 bg-muted/25 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold">{redemption.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {redemption.description}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeRedemption(redemption.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge>{redemption.pointsCost} pts</Badge>
                        <Badge variant="outline">{formatRedemption(redemption)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <form onSubmit={addRedemption} className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                <Field label="Reward title">
                  <Input
                    value={redemptionDraft.title ?? ""}
                    onChange={(event) =>
                      setRedemptionDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Free dessert"
                    required
                  />
                </Field>
                <Field label="Points cost">
                  <Input
                    type="number"
                    min="1"
                    value={redemptionDraft.pointsCost ?? ""}
                    onChange={(event) =>
                      setRedemptionDraft((current) => ({
                        ...current,
                        pointsCost: Number(event.target.value),
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="Reward type">
                  <select
                    value={redemptionDraft.rewardType ?? "discount"}
                    onChange={(event) =>
                      setRedemptionDraft((current) => ({
                        ...current,
                        rewardType: event.target.value as RewardRedemptionOption["rewardType"],
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="discount">Discount</option>
                    <option value="free_item">Free item</option>
                    <option value="perk">Perk</option>
                  </select>
                </Field>
                <Field label="Reward value">
                  <Input
                    value={redemptionDraft.value ?? ""}
                    onChange={(event) =>
                      setRedemptionDraft((current) => ({
                        ...current,
                        value: event.target.value,
                      }))
                    }
                    placeholder="15% / Dessert / VIP booking"
                    required
                  />
                </Field>
                <Field label="Description">
                  <Input
                    value={redemptionDraft.description ?? ""}
                    onChange={(event) =>
                      setRedemptionDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Members can redeem at checkout."
                    required
                  />
                </Field>
                <Button type="submit" disabled={updateProgramMutation.isPending}>
                  Add redemption option
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function MetricTile({
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
    <div className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  );
}

function PatternCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
        {icon}
      </div>
      <div className="font-bold text-white">{title}</div>
      <p className="mt-1 text-slate-400">{description}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatRedemption(option: RewardRedemptionOption) {
  switch (option.rewardType) {
    case "discount":
      return `${option.value} discount`;
    case "free_item":
      return `Free ${option.value}`;
    case "perk":
      return option.value;
    default:
      return option.value;
  }
}
