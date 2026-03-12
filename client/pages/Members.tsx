import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApiResponse,
  type Member,
  type MemberTagDefinition,
  type MemberUpsertInput,
  type PaginatedResponse,
} from "@shared/api";
import { Plus, Smartphone, Star, Trash2, WalletCards } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_DRAFT: MemberUpsertInput = {
  username: "",
  email: "",
  name: "",
  status: "Active",
  phone: "",
  loyaltyPoints: 0,
  tier: "Bronze",
  joinDate: new Date().toISOString().split("T")[0],
  lastVisit: "",
  favoriteLocation: "",
  address: "",
  dateOfBirth: "",
  notes: "",
  tags: [],
  marketingOptIn: false,
  totalSpend: 0,
  visits: 0,
  avatar: "",
  password: "",
  companionAccessCode: "",
};

export default function Members() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [draft, setDraft] = useState<MemberUpsertInput>(EMPTY_DRAFT);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2563eb");
  const [newTagDescription, setNewTagDescription] = useState("");

  const { data: membersResponse, isLoading } = useQuery<ApiResponse<PaginatedResponse<Member>>>({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await fetch("/api/members?limit=100");
      if (!response.ok) throw new Error("Failed to load members");
      return response.json();
    },
  });

  const { data: memberTagsResponse } = useQuery<ApiResponse<MemberTagDefinition[]>>({
    queryKey: ["member-tags"],
    queryFn: async () => {
      const response = await fetch("/api/members/tags");
      if (!response.ok) throw new Error("Failed to load member tags");
      return response.json();
    },
  });

  const saveMemberMutation = useMutation({
    mutationFn: async (payload: MemberUpsertInput) => {
      const response = await fetch(
        editingMember ? `/api/members/${editingMember.id}` : "/api/members",
        {
          method: editingMember ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ApiResponse<Member>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to save member");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member-tags"] });
      setOpen(false);
      setEditingMember(null);
      setDraft(EMPTY_DRAFT);
    },
  });

  const addPointsMutation = useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const response = await fetch(`/api/members/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const result = (await response.json()) as ApiResponse<Member>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to add points");
      }
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<Member>;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete member");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member-tags"] });
    },
  });

  const updateMemberTagsMutation = useMutation({
    mutationFn: async ({ member, tags }: { member: Member; tags: string[] }) => {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toMemberUpsertInput(member, { tags })),
      });
      const result = (await response.json()) as ApiResponse<Member>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to update member tags");
      }
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members"] }),
  });

  const updateTagCatalogMutation = useMutation({
    mutationFn: async (tags: MemberTagDefinition[]) => {
      const response = await fetch("/api/members/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      const result = (await response.json()) as ApiResponse<MemberTagDefinition[]>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to update tag catalog");
      }
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-tags"] }),
  });

  const members = membersResponse?.data?.data ?? [];
  const fallbackTags = useMemo<MemberTagDefinition[]>(() => {
    const labels = Array.from(new Set(members.flatMap((member) => member.tags))).sort((a, b) => a.localeCompare(b));
    return labels.map((label, index) => ({
      id: slugify(label) || `tag-${index + 1}`,
      label,
      color: "#2563eb",
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [members]);
  const tagCatalog = memberTagsResponse?.data?.length ? memberTagsResponse.data : fallbackTags;
  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.email} ${member.username} ${member.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()),
  );

  const companionReady = members.filter((member) => member.passwordSet && member.companionAccessCode).length;
  const totalPoints = members.reduce((sum, member) => sum + member.loyaltyPoints, 0);
  const totalSpend = members.reduce((sum, member) => sum + (member.totalSpend ?? 0), 0);

  const createTag = () => {
    const label = newTagLabel.trim();
    if (!label || tagCatalog.some((tag) => tag.label.toLowerCase() === label.toLowerCase())) return;
    const now = new Date().toISOString();
    updateTagCatalogMutation.mutate([
      ...tagCatalog,
      { id: slugify(label) || `tag-${Date.now()}`, label, color: newTagColor, description: newTagDescription.trim(), createdAt: now, updatedAt: now },
    ]);
    setNewTagLabel("");
    setNewTagDescription("");
  };

  const toggleMemberTag = (member: Member, tagLabel: string) => {
    const hasTag = member.tags.some((tag) => tag.toLowerCase() === tagLabel.toLowerCase());
    const nextTags = hasTag ? member.tags.filter((tag) => tag.toLowerCase() !== tagLabel.toLowerCase()) : [...member.tags, tagLabel];
    updateMemberTagsMutation.mutate({ member, tags: nextTags });
  };

  const openCreate = () => {
    setEditingMember(null);
    setDraft(EMPTY_DRAFT);
    setOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setDraft(toMemberUpsertInput(member));
    setOpen(true);
  };

  return (
    <AppShell
      title="Members"
      description="Manage full member profiles, loyalty credentials, companion-app access, and engagement tags."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New member
        </Button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Members" value={String(members.length)} helper="Tracked profiles" icon={<WalletCards className="h-5 w-5" />} />
        <MetricCard label="Companion ready" value={String(companionReady)} helper="Credentials + access code" icon={<Smartphone className="h-5 w-5" />} />
        <MetricCard label="Points liability" value={totalPoints.toLocaleString()} helper="Points currently held" icon={<Star className="h-5 w-5" />} />
        <MetricCard label="Lifetime spend" value={`$${totalSpend.toFixed(0)}`} helper="Member wallet value" icon={<WalletCards className="h-5 w-5" />} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Member directory</CardTitle>
              <p className="text-sm text-muted-foreground">Profiles, usernames, password state, and loyalty history.</p>
            </div>
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-sm rounded-2xl"
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-1">
                <Table className="min-w-[840px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Companion app</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">Loading members...</TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="font-bold">{member.name}</div>
                            <div className="text-xs text-muted-foreground">@{member.username} | {member.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.passwordSet ? "default" : "secondary"}>{member.passwordSet ? "Password set" : "No password"}</Badge>
                            <div className="text-xs text-muted-foreground">{member.companionAccessCode || "No access code"}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{member.tier}</Badge></TableCell>
                          <TableCell className="font-bold">{member.loyaltyPoints.toLocaleString()}</TableCell>
                          <TableCell>${member.totalSpend.toFixed(0)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => {
                                const value = window.prompt("Add points", "100");
                                if (value) addPointsMutation.mutate({ id: member.id, points: Number(value) || 0 });
                              }}>
                                Add points
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openEdit(member)}>Edit</Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => window.confirm(`Delete ${member.name}?`) && deleteMemberMutation.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredMembers.map((member) => (
                <div key={`mobile-${member.id}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{member.name}</div>
                      <div className="text-xs text-muted-foreground">@{member.username}</div>
                    </div>
                    <Badge variant="outline">{member.tier}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-muted/30 p-2"><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Points</div><div className="font-bold">{member.loyaltyPoints.toLocaleString()}</div></div>
                    <div className="rounded-xl bg-muted/30 p-2"><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Spend</div><div className="font-bold">${member.totalSpend.toFixed(0)}</div></div>
                    <div className="rounded-xl bg-muted/30 p-2"><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Visits</div><div className="font-bold">{member.visits}</div></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(member)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => window.confirm(`Delete ${member.name}?`) && deleteMemberMutation.mutate(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tight">Engagement tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Create tag</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_90px]">
                <Input value={newTagLabel} onChange={(event) => setNewTagLabel(event.target.value)} placeholder="VIP, promo-campaign..." />
                <Input type="color" value={newTagColor} onChange={(event) => setNewTagColor(event.target.value)} className="h-10 p-1" />
              </div>
              <Textarea value={newTagDescription} onChange={(event) => setNewTagDescription(event.target.value)} placeholder="Optional guidance" className="mt-3" />
              <Button className="mt-3 w-full" onClick={createTag} disabled={updateTagCatalogMutation.isPending}>{updateTagCatalogMutation.isPending ? "Saving..." : "Create engagement tag"}</Button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Tag catalog</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tagCatalog.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="rounded-full px-3 py-1">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>

            {filteredMembers.slice(0, 8).map((member) => (
              <div key={`tags-${member.id}`} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <div className="font-bold">{member.name}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagCatalog.map((tag) => {
                    const active = member.tags.some((item) => item.toLowerCase() === tag.label.toLowerCase());
                    return (
                      <button
                        key={`${member.id}-${tag.id}`}
                        type="button"
                        onClick={() => toggleMemberTag(member, tag.label)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/60"}`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[100vh] max-w-[100vw] overflow-y-auto p-0 sm:max-w-4xl">
          <DialogHeader className="border-b border-border/60 p-5 pb-4">
            <DialogTitle>{editingMember ? `Edit ${editingMember.name}` : "Create member"}</DialogTitle>
            <DialogDescription>
              Store member profile details, password resets, companion-app credentials, and loyalty metadata.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5 p-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMemberMutation.mutate(draft);
            }}
          >
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-muted/40 p-1">
                <TabsTrigger value="profile" className="rounded-xl">Profile</TabsTrigger>
                <TabsTrigger value="loyalty" className="rounded-xl">Loyalty</TabsTrigger>
                <TabsTrigger value="access" className="rounded-xl">Access</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Full name">
                    <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required />
                  </Field>
                  <Field label="Username">
                    <Input value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))} required />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} required />
                  </Field>
                  <Field label="Phone">
                    <Input value={draft.phone ?? ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
                  </Field>
                  <Field label="Status">
                    <Select value={draft.status} onValueChange={(value: Member["status"]) => setDraft((current) => ({ ...current, status: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Favorite location">
                    <Input value={draft.favoriteLocation ?? ""} onChange={(event) => setDraft((current) => ({ ...current, favoriteLocation: event.target.value }))} />
                  </Field>
                  <Field label="Address">
                    <Input value={draft.address ?? ""} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />
                  </Field>
                  <Field label="Date of birth">
                    <Input type="date" value={draft.dateOfBirth ?? ""} onChange={(event) => setDraft((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea value={draft.notes ?? ""} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
                </Field>
              </TabsContent>

              <TabsContent value="loyalty" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tier">
                    <Select value={draft.tier ?? "Bronze"} onValueChange={(value) => setDraft((current) => ({ ...current, tier: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Marketing consent">
                    <Select value={draft.marketingOptIn ? "yes" : "no"} onValueChange={(value) => setDraft((current) => ({ ...current, marketingOptIn: value === "yes" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Opt-in</SelectItem>
                        <SelectItem value="no">Opt-out</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Points">
                    <Input type="number" value={draft.loyaltyPoints ?? 0} onChange={(event) => setDraft((current) => ({ ...current, loyaltyPoints: Number(event.target.value) }))} />
                  </Field>
                  <Field label="Lifetime spend">
                    <Input type="number" value={draft.totalSpend ?? 0} onChange={(event) => setDraft((current) => ({ ...current, totalSpend: Number(event.target.value) }))} />
                  </Field>
                  <Field label="Visits">
                    <Input type="number" value={draft.visits ?? 0} onChange={(event) => setDraft((current) => ({ ...current, visits: Number(event.target.value) }))} />
                  </Field>
                  <Field label="Join date">
                    <Input type="date" value={draft.joinDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, joinDate: event.target.value }))} />
                  </Field>
                  <Field label="Last visit">
                    <Input type="date" value={draft.lastVisit ?? ""} onChange={(event) => setDraft((current) => ({ ...current, lastVisit: event.target.value }))} />
                  </Field>
                  <Field label="Tags">
                    <Input
                      value={Array.isArray(draft.tags) ? draft.tags.join(", ") : draft.tags ?? ""}
                      onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))}
                      placeholder="vip, weekend, app-user"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Password">
                    <Input
                      type="password"
                      placeholder={editingMember ? "Leave blank to keep current password" : "Set password"}
                      value={draft.password ?? ""}
                      onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
                    />
                  </Field>
                  <Field label="Companion access code">
                    <Input value={draft.companionAccessCode ?? ""} onChange={(event) => setDraft((current) => ({ ...current, companionAccessCode: event.target.value }))} />
                  </Field>
                  <Field label="Avatar URL">
                    <Input value={draft.avatar ?? ""} onChange={(event) => setDraft((current) => ({ ...current, avatar: event.target.value }))} />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t border-border/60 pt-4">
              <Button type="submit" disabled={saveMemberMutation.isPending}>
                {saveMemberMutation.isPending ? "Saving..." : editingMember ? "Save member" : "Create member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function MetricCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-lg">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">{icon}</div>
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

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toMemberUpsertInput(member: Member, overrides: Partial<MemberUpsertInput> = {}): MemberUpsertInput {
  return {
    username: member.username,
    email: member.email,
    name: member.name,
    status: member.status,
    phone: member.phone ?? "",
    loyaltyPoints: member.loyaltyPoints,
    tier: member.tier,
    joinDate: member.joinDate,
    lastVisit: member.lastVisit ?? "",
    favoriteLocation: member.favoriteLocation ?? "",
    address: member.address ?? "",
    dateOfBirth: member.dateOfBirth ?? "",
    notes: member.notes ?? "",
    tags: member.tags,
    marketingOptIn: member.marketingOptIn,
    totalSpend: member.totalSpend,
    visits: member.visits,
    avatar: member.avatar ?? "",
    password: "",
    companionAccessCode: member.companionAccessCode ?? "",
    ...overrides,
  };
}
