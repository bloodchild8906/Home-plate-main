import { Link } from "react-router-dom";
import { ArrowLeft, Users, Plus, Search, MoreHorizontal, Mail, Phone, Calendar, Star, Trash2, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Member, ApiResponse, PaginatedResponse } from "@shared/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch members
  const { data: membersResponse, isLoading } = useQuery<ApiResponse<PaginatedResponse<Member>>>({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });

  // Mutations
  const addPointsMutation = useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const response = await fetch(`/api/members/${id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      if (!response.ok) throw new Error("Failed to add points");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Points added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/members/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const members = membersResponse?.data?.data || [];
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "gold":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "silver":
        return "bg-slate-400/10 text-slate-600 border-slate-400/20";
      case "bronze":
        return "bg-orange-400/10 text-orange-600 border-orange-400/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary via-accent to-yellow-600 flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">🏠</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">HomePlate</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Admin Panel</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <AddMemberDialog />
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Members
              </h2>
              <p className="text-muted-foreground">
                Manage your loyal customers and track their engagement.
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="bg-card border border-border rounded-xl shadow-md overflow-hidden transition-all">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground animate-pulse font-medium">Loading members...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[250px] font-bold">Member</TableHead>
                  <TableHead className="font-bold">Contact</TableHead>
                  <TableHead className="font-bold">Loyalty Points</TableHead>
                  <TableHead className="font-bold">Tier</TableHead>
                  <TableHead className="font-bold">Join Date</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm ring-1 ring-primary/20">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground group-hover:text-primary transition-colors">{member.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {member.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                        <span className="font-bold text-foreground tabular-nums">{member.loyaltyPoints.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-semibold shadow-sm ${getTierColor(member.tier)}`}>
                        {member.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.joinDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <AddPointsDialog member={member} onPointsAdded={(pts) => addPointsMutation.mutate({ id: member.id, points: pts })} />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted group-hover:opacity-100 opacity-0 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 shadow-lg ring-1 ring-border">
                            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                              <Edit2 className="h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DeleteMemberDialog
                              memberName={member.name}
                              onConfirm={() => deleteMemberMutation.mutate(member.id)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-20 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-background">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No members found</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                {searchTerm ? `We couldn't find any results matching "${searchTerm}". Try a different name or email.` : "Build your community! Start by adding your first loyal customer to the platform."}
              </p>
              {!searchTerm && <AddMemberDialog />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added successfully");
      setOpen(false);
      setFormData({ name: "", email: "", phone: "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMemberMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-bold">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-xl overflow-hidden border-none shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Add New Member</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a customer to your platform to start tracking points and loyalty.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Michael Brown"
                className="rounded-lg border-muted-foreground/20 focus:ring-primary shadow-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="michael@example.com"
                className="rounded-lg border-muted-foreground/20 focus:ring-primary shadow-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground">Phone Number (Optional)</Label>
              <Input
                id="phone"
                placeholder="555-123-4567"
                className="rounded-lg border-muted-foreground/20 focus:ring-primary shadow-sm"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t border-border mt-2">
            <Button type="button" variant="ghost" className="font-semibold" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold shadow-md" disabled={createMemberMutation.isPending}>
              {createMemberMutation.isPending ? "Processing..." : "Create Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPointsDialog({ member, onPointsAdded }: { member: Member; onPointsAdded: (pts: number) => void }) {
  const [points, setPoints] = useState<string>("100");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 font-semibold shadow-sm hover:bg-yellow-500/10 hover:text-yellow-600 hover:border-yellow-500/30 transition-all border-dashed">
          <Star className="h-3.5 w-3.5 fill-current" />
          Add Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[320px] rounded-xl border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0 text-center">
          <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-yellow-600 fill-yellow-500/20" />
          </div>
          <DialogTitle>Reward Points</DialogTitle>
          <DialogDescription>
            Add points to <span className="font-bold text-foreground">{member.name}</span>'s balance.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Input
                type="number"
                className="text-3xl font-bold h-16 w-32 text-center pr-2 rounded-xl border-2 border-primary/20 focus:border-primary transition-all shadow-inner tabular-nums"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min="1"
              />
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-widest">
                PTS
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 500].map((val) => (
              <Button key={val} variant="secondary" size="sm" className="h-8 font-black text-xs" onClick={() => setPoints(val.toString())}>
                +{val}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter className="p-4 pt-0">
          <Button
            className="w-full font-bold shadow-lg"
            onClick={() => {
              const pts = parseInt(points);
              if (pts > 0) {
                onPointsAdded(pts);
                setOpen(false);
              }
            }}
          >
            Confirm Reward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMemberDialog({ memberName, onConfirm }: { memberName: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="flex items-center gap-2 p-2 text-sm text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer transition-colors focus:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
          Delete Member
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <span className="font-bold text-foreground">{memberName}</span>'s profile.
            This action cannot be undone and all loyalty data will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="p-6 bg-muted/30 border-t border-border mt-4 -mx-6 -mb-6">
          <AlertDialogCancel className="font-semibold bg-transparent border-none hover:bg-muted">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg"
          >
            Delete Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
