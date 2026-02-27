import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import type { Branch } from "@shared/schema";

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  branchId: number | null;
  isActive: boolean;
}

const ROLES = ["admin", "staff", "accountant", "teacher"];
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  staff: "bg-blue-100 text-blue-700",
  accountant: "bg-green-100 text-green-700",
  teacher: "bg-purple-100 text-purple-700",
};

const emptyForm = { name: "", email: "", password: "", role: "staff", branchId: null as number | null, isActive: true };

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: users = [], isLoading } = useQuery<SystemUser[]>({ queryKey: ["/api/auth/users"] });
  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });

  const createMut = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/auth/users", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] }); setOpen(false); toast({ title: "User created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof form> }) => apiRequest("PUT", `/api/auth/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] }); setOpen(false); toast({ title: "User updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/auth/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/auth/users"] }); toast({ title: "User deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (u: SystemUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, branchId: u.branchId, isActive: u.isActive });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const data: any = { name: form.name, role: form.role, branchId: form.branchId, isActive: form.isActive };
      if (form.password) data.password = form.password;
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage system users and their roles</p>
        </div>
        <Button data-testid="button-add-user" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {users.map(u => (
              <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                    <ShieldCheck className="w-3 h-3" /> {u.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {u.branchId ? branches.find(b => b.id === u.branchId)?.name ?? "Unknown" : "All Branches"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)} data-testid={`button-edit-user-${u.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                    {u.id !== currentUser?.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(u.id)} data-testid={`button-delete-user-${u.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && users.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input data-testid="input-user-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
              </div>
              {!editing && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Email *</Label>
                  <Input data-testid="input-user-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" required />
                </div>
              )}
              <div className="col-span-2 space-y-1.5">
                <Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
                <Input data-testid="input-user-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required={!editing} />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger data-testid="select-user-role"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={form.branchId ? String(form.branchId) : "all"} onValueChange={v => setForm(f => ({ ...f, branchId: v === "all" ? null : Number(v) }))}>
                  <SelectTrigger data-testid="select-user-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="button-save-user" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Update" : "Create"} User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
