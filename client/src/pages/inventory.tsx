import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, AlertTriangle, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImportDialog, type FieldDef } from "@/components/import-dialog";
import { BranchSelect, parseBranchId } from "@/components/branch-select";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/contexts/auth";

function useInventory() {
  return useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

const INVENTORY_FIELDS: FieldDef[] = [
  { key: "itemName", label: "Item Name", required: true, sample: "Whiteboard Markers" },
  { key: "category", label: "Category", sample: "Stationery" },
  { key: "quantity", label: "Quantity", required: true, sample: "50" },
];

export default function InventoryPage() {
  const { data: items, isLoading } = useInventory();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [branchId, setBranchId] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: branches = [] } = useBranches();
  const getBranchName = (id: number | null | undefined) => branches.find(b => b.id === id)?.name ?? "—";
  const canEdit = user?.role === "admin" || user?.role === "staff";
  const canDelete = user?.role === "admin";

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    let success = 0; let failed = 0;
    for (const row of rows) {
      try {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemName: row.itemName || "", category: row.category || null, quantity: Number(row.quantity) || 0 }),
          credentials: "include",
        });
        if (res.ok) success++; else failed++;
      } catch { failed++; }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    return { success, failed };
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Item added to inventory" });
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Item updated" });
      setEditItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Item deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      itemName: fd.get("itemName"),
      category: fd.get("category") || null,
      quantity: Number(fd.get("quantity")),
      branchId: parseBranchId(branchId) ?? (user?.branchId ?? null),
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editItem.id,
      data: {
        itemName: fd.get("itemName"),
        category: fd.get("category") || null,
        quantity: Number(fd.get("quantity")),
        branchId: parseBranchId(editBranchId) ?? editItem.branchId ?? null,
      },
    });
  };

  const categories = Array.from(new Set(items?.map((i: any) => i.category).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage institute assets and stocks</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportDialog entityName="Inventory" fields={INVENTORY_FIELDS} onImport={handleBulkImport} />
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md shadow-primary/20" data-testid="button-add-item">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input name="itemName" required className="rounded-xl" placeholder="e.g. Whiteboard Markers" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input name="category" className="rounded-xl" placeholder="e.g. Stationery, Furniture..." />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input name="quantity" type="number" required min="0" className="rounded-xl" placeholder="0" />
              </div>
              <BranchSelect value={branchId} onChange={setBranchId} />
              <Button type="submit" className="w-full rounded-xl" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Items</p>
          <p className="text-2xl font-bold text-foreground mt-1">{items?.length || 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Categories</p>
          <p className="text-2xl font-bold text-foreground mt-1">{categories.length}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Low Stock</p>
          <p className="text-2xl font-bold text-destructive mt-1">{items?.filter((i: any) => i.quantity < 5).length || 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Out of Stock</p>
          <p className="text-2xl font-bold text-destructive mt-1">{items?.filter((i: any) => i.quantity === 0).length || 0}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
        ) : items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Package className="w-14 h-14 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No items in inventory</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{item.itemName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.quantity < 5 && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={`font-semibold ${item.quantity === 0 ? "text-destructive" : item.quantity < 5 ? "text-amber-600" : "text-foreground"}`}>
                          {item.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getBranchName(item.branchId)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.quantity === 0 ? "destructive" : item.quantity < 5 ? "secondary" : "default"}
                        className={item.quantity >= 5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                      >
                        {item.quantity === 0 ? "Out of Stock" : item.quantity < 5 ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => { setEditItem(item); setEditBranchId(item.branchId ? String(item.branchId) : ""); }} data-testid={`btn-edit-inventory-${item.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(item.id)} data-testid={`btn-delete-inventory-${item.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Edit — {editItem.itemName}</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input name="itemName" required className="rounded-xl" defaultValue={editItem.itemName} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input name="category" className="rounded-xl" defaultValue={editItem.category || ""} />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input name="quantity" type="number" required min="0" className="rounded-xl" defaultValue={editItem.quantity} />
              </div>
              <BranchSelect value={editBranchId} onChange={setEditBranchId} />
              <Button type="submit" className="w-full rounded-xl" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
