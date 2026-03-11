import { Link } from "react-router-dom";
import { ArrowLeft, Menu, Plus, Search, MapPin, Calendar, MoreHorizontal, LayoutGrid, List, Eye, Edit2, Trash2, Tag, UtensilsCrossed, ChevronRight, X, DollarSign, Package, Smartphone, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu as MenuType, ApiResponse, MenuItem } from "@shared/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { BrandMark } from "@/components/brand-mark";
import { useBranding } from "@/lib/branding";

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const queryClient = useQueryClient();
  const { brand } = useBranding();

  // Fetch menus
  const { data: menusResponse, isLoading } = useQuery<ApiResponse<MenuType[]>>({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await fetch("/api/menus");
      if (!response.ok) throw new Error("Failed to fetch menus");
      return response.json();
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/menus/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const menus = menusResponse?.data || [];
  const filteredMenus = menus.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <BrandMark
                image={brand.logoImage}
                text={brand.logo}
                label={`${brand.name} logo`}
                primary={brand.primary}
                accent={brand.accent}
                className="h-10 w-10 rounded-lg"
                imageClassName="object-contain bg-white p-1.5"
                textClassName="text-[11px]"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">{brand.name}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Admin Panel</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <CreateMenuDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Menu Management
              </h2>
              <p className="text-muted-foreground">
                Create and manage restaurant menus across multiple locations.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menus..."
                  className="pl-10 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex border rounded-lg overflow-hidden bg-card shadow-sm">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none border-r"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid/List */}
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground animate-pulse font-medium">Loading your menus...</p>
          </div>
        ) : filteredMenus.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredMenus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                viewMode={viewMode}
                onDelete={() => deleteMenuMutation.mutate(menu.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-20 text-center bg-card border border-border rounded-xl shadow-sm">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-background">
              <Menu className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No menus found</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {searchTerm ? `We couldn't find any results matching "${searchTerm}".` : "Start by creating your first restaurant menu to display on your mobile apps."}
            </p>
            {!searchTerm && <CreateMenuDialog />}
          </div>
        )}
      </main>
    </div>
  );
}

function MenuCard({ menu, viewMode, onDelete }: { menu: MenuType; viewMode: "grid" | "list"; onDelete: () => void }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const categories = Array.from(new Set(menu.items.map(i => i.category)));

  if (viewMode === "list") {
    return (
      <div className="group bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{menu.name}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {menu.location}</span>
              <span className="flex items-center gap-1 font-semibold text-foreground/70"><Tag className="h-3 w-3" /> {menu.items.length} items</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 font-semibold" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 font-semibold" onClick={() => setShowItemEditor(true)}>
            <Edit2 className="h-4 w-4" /> Edit
          </Button>
          <MenuActions onDelete={() => setShowDeleteAlert(true)} onEdit={() => setShowItemEditor(true)} onPreview={() => setShowPreview(true)} />
        </div>

        <DeleteMenuAlert
          open={showDeleteAlert}
          onOpenChange={setShowDeleteAlert}
          onConfirm={onDelete}
          menuName={menu.name}
        />

        <MenuItemEditorDialog
          open={showItemEditor}
          onOpenChange={setShowItemEditor}
          menu={menu}
        />

        <MenuPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          menu={menu}
        />
      </div>
    );
  }

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary hover:shadow-xl transition-all h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-muted flex items-center justify-center relative overflow-hidden">
          <UtensilsCrossed className="h-16 w-16 text-primary/20 absolute -right-4 -bottom-4 rotate-12" />
          <div className="h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl z-10 transform group-hover:scale-110 transition-transform">
            🍱
          </div>
          <div className="absolute top-4 right-4">
            <MenuActions onDelete={() => setShowDeleteAlert(true)} onEdit={() => setShowItemEditor(true)} onPreview={() => setShowPreview(true)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{menu.name}</CardTitle>
          <Badge variant="outline" className="font-bold bg-muted/50">{menu.items.length} items</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          {menu.location}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            Categories
            <div className="h-px bg-border flex-1" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 4).map(cat => (
              <Badge key={cat} variant="secondary" className="text-[10px] font-bold py-0">{cat}</Badge>
            ))}
            {categories.length > 4 && <Badge variant="secondary" className="text-[10px] font-bold py-0">+{categories.length - 4} more</Badge>}
            {categories.length === 0 && <span className="text-xs text-muted-foreground italic">No items yet</span>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1 font-bold shadow-sm hover:bg-primary/5" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-2" /> Preview
        </Button>
        <Button className="flex-1 font-bold shadow-md" onClick={() => setShowItemEditor(true)}>
          <Edit2 className="h-4 w-4 mr-2" /> Edit Menu
        </Button>
      </CardFooter>

      <DeleteMenuAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirm={onDelete}
        menuName={menu.name}
      />

      <MenuItemEditorDialog
        open={showItemEditor}
        onOpenChange={setShowItemEditor}
        menu={menu}
      />

      <MenuPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        menu={menu}
      />
    </Card>
  );
}

function MenuActions({ onDelete, onEdit, onPreview }: { onDelete: () => void; onEdit: () => void; onPreview: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 shadow-xl ring-1 ring-border">
        <DropdownMenuLabel>Menu Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={onPreview}>
          <Eye className="h-4 w-4" /> Preview
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={onEdit}>
          <Edit2 className="h-4 w-4" /> Edit Items
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Calendar className="h-4 w-4" /> Set Availability
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer font-semibold"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" /> Delete Menu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateMenuDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "" });
  const queryClient = useQueryClient();

  const createMenuMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu created successfully");
      setOpen(false);
      setFormData({ name: "", location: "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMenuMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-bold">
          <Plus className="h-4 w-4" />
          New Menu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Create New Menu</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Define a new menu catalog for a specific restaurant or location.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Menu Name</Label>
              <Input
                id="name"
                placeholder="e.g. Breakfast Menu, Seasonal Specials"
                className="rounded-lg border-muted-foreground/20 focus:ring-primary shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">Location / Store</Label>
              <Input
                id="location"
                placeholder="e.g. Downtown Outlet, All Stores"
                className="rounded-lg border-muted-foreground/20 focus:ring-primary shadow-sm"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t border-border mt-2 rounded-b-xl">
            <Button type="button" variant="ghost" className="font-semibold" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold shadow-md" disabled={createMenuMutation.isPending}>
              {createMenuMutation.isPending ? "Creating..." : "Create Menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MenuItemEditorDialog({ open, onOpenChange, menu }: { open: boolean; onOpenChange: (open: boolean) => void; menu: MenuType }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("items");
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  const categories = Array.from(new Set(menu.items.map(i => i.category)));

  const updateMenuMutation = useMutation({
    mutationFn: async (updatedMenu: MenuType) => {
      const response = await fetch(`/api/menus/${menu.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMenu),
      });
      if (!response.ok) throw new Error("Failed to update menu");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("Menu updated successfully");
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.price) return;

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: editingItem.name || "",
      description: editingItem.description || "",
      price: Number(editingItem.price),
      category: editingItem.category || "Uncategorized",
    };

    const updatedMenu = {
      ...menu,
      items: [...menu.items, newItem],
    };

    updateMenuMutation.mutate(updatedMenu);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedMenu = {
      ...menu,
      items: menu.items.filter(i => i.id !== itemId),
    };
    updateMenuMutation.mutate(updatedMenu);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 rounded-xl overflow-hidden border-none shadow-2xl">
        <div className="p-6 pb-0 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl font-bold">{menu.name}</DialogTitle>
              <DialogDescription>Manage menu items, pricing, and categories.</DialogDescription>
            </div>
            <Badge variant="outline" className="font-black text-primary border-primary/20">{menu.items.length} Items Total</Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted w-full justify-start rounded-none border-b-0 h-10 p-0">
              <TabsTrigger value="items" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-6 font-bold">
                Items List
              </TabsTrigger>
              <TabsTrigger value="add" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-6 font-bold">
                + Add New Item
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-10 px-6 font-bold">
                Menu Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} className="h-full">
            <TabsContent value="items" className="m-0 h-full">
              <ScrollArea className="h-full p-6">
                {categories.length > 0 ? (
                  categories.map(category => (
                    <div key={category} className="mb-8 last:mb-0">
                      <div className="flex items-center gap-2 mb-4">
                        <Tag className="h-4 w-4 text-primary" />
                        <h5 className="font-black uppercase tracking-tighter text-sm text-foreground">{category}</h5>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      <div className="space-y-3">
                        {menu.items.filter(i => i.category === category).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors shadow-sm group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">{item.name}</span>
                                <Badge variant="secondary" className="text-[10px] font-bold h-4 px-1.5">${item.price.toFixed(2)}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h6 className="font-bold text-foreground">Empty Menu</h6>
                    <p className="text-sm text-muted-foreground max-w-[200px]">You haven't added any items to this menu yet.</p>
                    <Button variant="outline" size="sm" className="mt-4 font-bold" onClick={() => setActiveTab("add")}>
                      Add Your First Item
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add" className="m-0 h-full p-6">
              <form onSubmit={handleAddItem} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="font-bold">Item Name</Label>
                    <Input
                      placeholder="e.g. Double Cheeseburger"
                      required
                      value={editingItem?.name || ""}
                      onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="font-bold">Price ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-9"
                          required
                          value={editingItem?.price || ""}
                          onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-bold">Category</Label>
                      <Input
                        placeholder="e.g. Entrees"
                        required
                        value={editingItem?.category || ""}
                        onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold">Description</Label>
                    <Textarea
                      placeholder="Describe the item ingredients, allergens, etc."
                      className="min-h-[100px]"
                      value={editingItem?.description || ""}
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full font-bold shadow-lg" disabled={updateMenuMutation.isPending}>
                  {updateMenuMutation.isPending ? "Adding Item..." : "Add Item to Menu"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="settings" className="m-0 h-full p-6">
               <div className="space-y-6 max-w-md mx-auto">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h6 className="font-bold text-primary mb-1">Coming Soon</h6>
                  <p className="text-xs text-primary/70">Advanced settings like schedule overrides, location-specific pricing, and integration mappings will be available here.</p>
                </div>
                <div className="space-y-4 opacity-50 pointer-events-none">
                  <div className="grid gap-2">
                    <Label className="font-bold">Availability Schedule</Label>
                    <Button variant="outline" className="w-full justify-between font-bold">
                      All Times
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold">Third-Party Sync</Label>
                    <div className="flex items-center gap-2 p-3 rounded border">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-black text-[10px]">UBER</div>
                      <span className="text-sm font-bold flex-1">Uber Eats Sync</span>
                      <Badge>OFF</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MenuPreviewDialog({ open, onOpenChange, menu }: { open: boolean; onOpenChange: (open: boolean) => void; menu: MenuType }) {
  const categories = Array.from(new Set(menu.items.map(i => i.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 rounded-[3rem] overflow-hidden border-[8px] border-foreground shadow-2xl bg-white aspect-[9/19]">
        <div className="h-full flex flex-col bg-slate-50 relative">
          {/* Status Bar */}
          <div className="h-10 flex items-center justify-between px-8 pt-4">
            <span className="text-xs font-bold">9:41</span>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-foreground" />
              <div className="h-3 w-5 rounded-sm border-2 border-foreground relative">
                 <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-1 w-0.5 bg-foreground" />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* App Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm" onClick={() => onOpenChange(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <h6 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Ordering from</h6>
                  <p className="font-bold text-sm flex items-center gap-1">{menu.location} <ChevronRight className="h-3 w-3" /></p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm">
                  <Info className="h-5 w-5" />
                </Button>
              </div>

              <h1 className="text-3xl font-black tracking-tighter mb-2">{menu.name}</h1>
              <p className="text-sm text-muted-foreground mb-6">Experience our chef's curated selection of gourmet flavors.</p>

              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat, idx) => (
                  <Badge key={cat} variant={idx === 0 ? "default" : "secondary"} className="whitespace-nowrap rounded-full px-4 py-1 font-bold">
                    {cat}
                  </Badge>
                ))}
              </div>

              {/* Items List */}
              <div className="space-y-8 pb-12">
                {categories.map(category => (
                  <div key={category}>
                    <h2 className="text-xl font-black mb-4 tracking-tight">{category}</h2>
                    <div className="space-y-4">
                      {menu.items.filter(i => i.category === category).map(item => (
                        <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
                          <div className="flex-1">
                            <h3 className="font-bold text-base mb-1">{item.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                            <span className="font-black text-primary">${item.price.toFixed(2)}</span>
                          </div>
                          <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center relative">
                            <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                            <Button size="icon" className="h-7 w-7 rounded-full absolute -bottom-1 -right-1 shadow-lg">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Tab Bar */}
          <div className="h-24 bg-white/80 backdrop-blur-md border-t border-slate-200 px-8 flex items-center justify-between pb-6">
            <div className="flex flex-col items-center gap-1 text-primary">
              <Smartphone className="h-5 w-5" />
              <span className="text-[10px] font-bold">Home</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-bold">Search</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Tag className="h-5 w-5" />
              <span className="text-[10px] font-bold">Offers</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-bold">Orders</span>
            </div>
          </div>

          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-20" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMenuAlert({ open, onOpenChange, onConfirm, menuName }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; menuName: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">Delete Menu?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-bold text-foreground">{menuName}</span>?
            This will remove all item associations and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-6 bg-muted/30 border-t border-border mt-4 -mx-6 -mb-6 rounded-b-xl">
          <AlertDialogCancel className="font-semibold bg-transparent border-none hover:bg-muted">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg"
          >
            Delete Menu
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
