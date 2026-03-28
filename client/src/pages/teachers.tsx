import { useState } from "react";
import {
  useTeachers,
  useCreateTeacher,
  useDeleteTeacher,
} from "@/hooks/use-teachers";
import { ImportDialog, type FieldDef } from "@/components/import-dialog";
import { useLocation, useSearch } from "wouter";
import {
  DateFilter,
  DateFilterValue,
  filterFromSearch,
  buildApiParams,
} from "@/components/date-filter";
import { usePermission } from "@/hooks/use-permission";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GraduationCap, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TEACHER_FIELDS: FieldDef[] = [
  { key: "name", label: "Teacher Name", required: true, sample: "Anil Desai" },
  { key: "email", label: "Email", sample: "anil@badamsingh.com" },
  { key: "phone", label: "Mobile", required: true, sample: "9876123450" },
  { key: "subject", label: "Subject", sample: "Physics" },
  {
    key: "qualification",
    label: "Qualification",
    sample: "M.Sc Physics, B.Ed",
  },
];

export default function TeachersPage() {
  const searchStr = useSearch();
  const { canWrite, canDelete } = usePermission("teachers");
  const [filter, setFilter] = useState<DateFilterValue>(() =>
    filterFromSearch(searchStr),
  );
  const apiParams = buildApiParams(filter);
  const { data: teachers, isLoading } = useTeachers(
    apiParams
      ? Object.fromEntries(new URLSearchParams(apiParams.slice(1)))
      : undefined,
  );
  const createTeacher = useCreateTeacher();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deleteMutation = useDeleteTeacher();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // ── Delete confirm modal state ───────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    let success = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await new Promise<void>((resolve) => {
          createTeacher.mutate(
            {
              name: row.name || "",
              email: row.email || "",
              phone: row.phone || "",
              subject: row.subject || "",
              qualification: row.qualification || "",
              status: "Active",
            },
            {
              onSuccess: () => {
                success++;
                resolve();
              },
              onError: () => {
                failed++;
                resolve();
              },
            },
          );
        });
      } catch {
        failed++;
      }
    }
    return { success, failed };
  };

  // ── Delete handler — called from modal confirm button ────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({
          title: "Teacher Deleted",
          description: `${deleteTarget.name} has been permanently removed from the system.`,
        });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({
          title: "Delete Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Teachers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage teaching staff
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateFilter value={filter} onChange={setFilter} />
          {canWrite && (
            <ImportDialog
              entityName="Teachers"
              fields={TEACHER_FIELDS}
              onImport={handleBulkImport}
            />
          )}
          {canWrite && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-md shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    New Teacher Profile
                  </DialogTitle>
                </DialogHeader>
                <TeacherForm onSuccess={() => setIsAddOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Teacher</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Qualification</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : teachers?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              teachers?.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border shadow-sm">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">
                          {teacher.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {teacher.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {teacher.subject}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{teacher.phone}</div>
                    <div className="text-xs text-muted-foreground">
                      {teacher.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {teacher.qualification || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-muted-foreground hover:text-primary"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                        data-testid={`btn-view-teacher-${teacher.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() =>
                            setDeleteTarget({
                              id: teacher.id,
                              name: teacher.name,
                            })
                          }
                          data-testid={`btn-delete-teacher-${teacher.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Delete Teacher?
              </h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTarget.name}
                </span>
                ?
                <br />
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateTeacher();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate(
      {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        subject: formData.get("subject") as string,
        qualification: (formData.get("qualification") as string) || null,
        status: "Active",
      },
      {
        onSuccess: () => {
          toast({ title: "Teacher added successfully" });
          onSuccess();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input id="name" name="name" required className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            name="subject"
            required
            className="rounded-xl"
            placeholder="e.g. Physics"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input
            id="qualification"
            name="qualification"
            className="rounded-xl"
            placeholder="e.g. M.Sc, B.Ed"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full rounded-xl mt-4"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? "Adding..." : "Add Teacher"}
      </Button>
    </form>
  );
}
