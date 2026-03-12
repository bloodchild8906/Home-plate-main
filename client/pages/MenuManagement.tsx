import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApiResponse, type Menu, type MenuItem, type MenuSpecial, type MenuUpsertInput } from "@shared/api";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Tag, Trash2, UtensilsCrossed } from "lucide-react";

const EMPTY_MENU: MenuUpsertInput = {
  name: "",
  location: "",
  items: [],
  specials: [],
};

const EMPTY_ITEM: Partial<MenuItem> = {
  name: "",
  description: "",
  price: 0,
  category: "",
  specialLabel: "",
};

const EMPTY_SPECIAL: Partial<MenuSpecial> = {
  title: "",
  description: "",
  bannerText: "",
  promoCode: "",
  specialPrice: 0,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
  active: true,
  channels: ["qr"],
};

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [draft, setDraft] = useState<MenuUpsertInput>(EMPTY_MENU);
  const [itemDraft, setItemDraft] = useState<Partial<MenuItem>>(EMPTY_ITEM);
  const [specialDraft, setSpecialDraft] = useState<Partial<MenuSpecial>>(EMPTY_SPECIAL);

  const { data: menusResponse, isLoading } = useQuery<ApiResponse<Menu[]>>({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await fetch("/api/menus");
      if (!response.ok) throw new Error("Failed to load menus");
      return response.json();
    },
  });

  const saveMenuMutation = useMutation({
    mutationFn: async (payload: MenuUpsertInput) => {
      const response = await fetch(editingMenu ? `/api/menus/${editingMenu.id}` : "/api/menus", {
        method: editingMenu ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<Menu>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to save menu");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      setOpen(false);
      setEditingMenu(null);
      setDraft(EMPTY_MENU);
      setItemDraft(EMPTY_ITEM);
      setSpecialDraft(EMPTY_SPECIAL);
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<Menu>;
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to delete menu");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });

  const menus = menusResponse?.data ?? [];
  const filteredMenus = menus.filter((menu) =>
    `${menu.name} ${menu.location}`.toLowerCase().includes(search.toLowerCase()),
  );
  const totalSpecials = menus.reduce((sum, menu) => sum + menu.specials.length, 0);
  const totalItems = menus.reduce((sum, menu) => sum + menu.items.length, 0);

  const openCreate = () => {
    setEditingMenu(null);
    setDraft(EMPTY_MENU);
    setItemDraft(EMPTY_ITEM);
    setSpecialDraft(EMPTY_SPECIAL);
    setOpen(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setDraft({
      name: menu.name,
      location: menu.location,
      items: menu.items,
      specials: menu.specials,
    });
    setItemDraft(EMPTY_ITEM);
    setSpecialDraft(EMPTY_SPECIAL);
    setOpen(true);
  };

  const addItem = () => {
    if (!itemDraft.name || !itemDraft.category) {
      return;
    }
    setDraft((current) => ({
      ...current,
      items: [
        ...(current.items ?? []),
        {
          id: `item-${Date.now()}`,
          name: itemDraft.name ?? "",
          description: itemDraft.description ?? "",
          price: Number(itemDraft.price ?? 0),
          category: itemDraft.category ?? "General",
          featured: Boolean(itemDraft.featured),
          available: true,
          specialLabel: itemDraft.specialLabel ?? "",
        },
      ],
    }));
    setItemDraft(EMPTY_ITEM);
  };

  const addSpecial = () => {
    if (!specialDraft.title || !specialDraft.bannerText || !specialDraft.promoCode) {
      return;
    }
    setDraft((current) => ({
      ...current,
      specials: [
        ...(current.specials ?? []),
        {
          id: `special-${Date.now()}`,
          title: specialDraft.title ?? "",
          description: specialDraft.description ?? "",
          itemId: specialDraft.itemId || undefined,
          bannerText: specialDraft.bannerText ?? "",
          promoCode: specialDraft.promoCode ?? "",
          specialPrice: Number(specialDraft.specialPrice ?? 0) || undefined,
          startDate: specialDraft.startDate ?? new Date().toISOString().split("T")[0],
          endDate: specialDraft.endDate ?? new Date().toISOString().split("T")[0],
          active: specialDraft.active ?? true,
          channels: specialDraft.channels ?? ["qr"],
        },
      ],
    }));
    setSpecialDraft(EMPTY_SPECIAL);
  };

  return (
    <AppShell
      title="Menu Management"
      description="Run menus and promotional specials together so operations, pricing, and campaign activations stay aligned."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New menu
        </Button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="Menus" value={String(menus.length)} helper="Location catalogs" />
        <MetricCard label="Items" value={String(totalItems)} helper="Tracked menu items" />
        <MetricCard label="Specials" value={String(totalSpecials)} helper="Promo campaigns" />
        <MetricCard label="Featured" value={String(menus.flatMap((menu) => menu.items).filter((item) => item.featured).length)} helper="Boosted items" />
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Catalogs and specials</h2>
            <p className="text-sm text-muted-foreground">Menus now include built-in specials for QR, text-code, or scan-card campaigns.</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search menus..."
            className="max-w-sm rounded-2xl"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {isLoading ? (
            <Card className="border-border/60 bg-card/90 shadow-xl">
              <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading menus...</CardContent>
            </Card>
          ) : filteredMenus.map((menu) => (
            <Card key={menu.id} className="border-border/60 bg-card/90 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight">{menu.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{menu.location}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {menu.items.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                    Items
                  </div>
                  <div className="grid gap-3">
                    {menu.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="rounded-3xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold">{item.name}</div>
                          <div className="font-bold">${(item.specialPrice ?? item.price).toFixed(2)}</div>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{item.category}</div>
                        {item.specialLabel ? (
                          <Badge className="mt-3 rounded-full px-3 py-1">{item.specialLabel}</Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    <Tag className="h-4 w-4 text-accent" />
                    Specials
                  </div>
                  <div className="space-y-3">
                    {menu.specials.length > 0 ? (
                      menu.specials.map((special) => (
                        <div key={special.id} className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-bold">{special.title}</div>
                            <Badge variant={special.active ? "default" : "secondary"}>
                              {special.active ? "Live" : "Scheduled"}
                            </Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{special.description}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {special.bannerText}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {special.promoCode}
                            </Badge>
                            {special.channels.map((channel) => (
                              <Badge key={channel} variant="secondary" className="rounded-full px-3 py-1">
                                {channel.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                        No specials configured.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => openEdit(menu)}>
                    Edit menu
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete ${menu.name}?`)) {
                        deleteMenuMutation.mutate(menu.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingMenu ? `Edit ${editingMenu.name}` : "Create menu"}</DialogTitle>
            <DialogDescription>
              Manage menu items and promotional specials in one editing flow.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMenuMutation.mutate(draft);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Menu name">
                <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Location">
                <Input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} required />
              </Field>
            </div>

            <Tabs defaultValue="items">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="specials">Specials</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Item name">
                    <Input value={itemDraft.name ?? ""} onChange={(event) => setItemDraft((current) => ({ ...current, name: event.target.value }))} />
                  </Field>
                  <Field label="Category">
                    <Input value={itemDraft.category ?? ""} onChange={(event) => setItemDraft((current) => ({ ...current, category: event.target.value }))} />
                  </Field>
                  <Field label="Price">
                    <Input type="number" value={itemDraft.price ?? 0} onChange={(event) => setItemDraft((current) => ({ ...current, price: Number(event.target.value) }))} />
                  </Field>
                  <Field label="Special label">
                    <Input value={itemDraft.specialLabel ?? ""} onChange={(event) => setItemDraft((current) => ({ ...current, specialLabel: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea value={itemDraft.description ?? ""} onChange={(event) => setItemDraft((current) => ({ ...current, description: event.target.value }))} />
                </Field>
                <Button type="button" variant="outline" onClick={addItem}>
                  Add item
                </Button>
                <div className="grid gap-3">
                  {(draft.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/80 p-4">
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            items: current.items?.filter((entry) => entry.id !== item.id) ?? [],
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="specials" className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Title">
                    <Input value={specialDraft.title ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, title: event.target.value }))} />
                  </Field>
                  <Field label="Banner text">
                    <Input value={specialDraft.bannerText ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, bannerText: event.target.value }))} />
                  </Field>
                  <Field label="Promo code">
                    <Input value={specialDraft.promoCode ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, promoCode: event.target.value.toUpperCase() }))} />
                  </Field>
                  <Field label="Special price">
                    <Input type="number" value={specialDraft.specialPrice ?? 0} onChange={(event) => setSpecialDraft((current) => ({ ...current, specialPrice: Number(event.target.value) }))} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea value={specialDraft.description ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, description: event.target.value }))} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Start date">
                    <Input type="date" value={specialDraft.startDate ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, startDate: event.target.value }))} />
                  </Field>
                  <Field label="End date">
                    <Input type="date" value={specialDraft.endDate ?? ""} onChange={(event) => setSpecialDraft((current) => ({ ...current, endDate: event.target.value }))} />
                  </Field>
                </div>
                <Button type="button" variant="outline" onClick={addSpecial}>
                  Add special
                </Button>
                <div className="grid gap-3">
                  {(draft.specials ?? []).map((special) => (
                    <div key={special.id} className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/80 p-4">
                      <div>
                        <div className="font-bold">{special.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {special.promoCode} · {special.startDate} to {special.endDate}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            specials: current.specials?.filter((entry) => entry.id !== special.id) ?? [],
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="submit" disabled={saveMenuMutation.isPending}>
                {saveMenuMutation.isPending ? "Saving..." : editingMenu ? "Save menu" : "Create menu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-lg">
      <CardContent className="p-5">
        <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
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
