import { useState } from "react";
import { useTeachers, useCreateTeacher, useDeleteTeacher } from "@/hooks/use-teachers";
import { ImportDialog, type FieldDef } from "@/components/import-dialog";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GraduationCap, Trash2 } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const TEACHER_FIELDS: FieldDef[] = [
  { key: "name", label: "Teacher Name", required: true, sample: "Anil Desai" },
  { key: "email", label: "Email", sample: "anil@badamsingh.com" },
  { key: "phone", label: "Mobile", required: true, sample: "9876123450" },
  { key: "subject", label: "Subject", sample: "Physics" },
  { key: "qualification", label: "Qualification", sample: "M.Sc Physics, B.Ed" },
];

export default function TeachersPage() {
  const { data: teachers, isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deleteMutation = useDeleteTeacher();
  const { toast } = useToast();

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    let success = 0; let failed = 0;
    for (const row of rows) {
      try {
        await new Promise<void>((resolve) => {
          createTeacher.mutate({
            name: row.name || "",
            email: row.email || "",
            phone: row.phone || "",
            subject: row.subject || "",
            qualification: row.qualification || "",
            status: "Active",
          }, { onSuccess: () => { success++; resolve(); }, onError: () => { failed++; resolve(); } });
        });
      } catch { failed++; }
    }
    return { success, failed };
  };

  const handleDelete = (id: number) => {
    if(confirm("Remove this teacher from the system?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Teacher removed" })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Teachers</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage teaching staff</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ImportDialog entityName="Teachers" fields={TEACHER_FIELDS} onImport={handleBulkImport} />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">New Teacher Profile</DialogTitle>
              </DialogHeader>
              <TeacherForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
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
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : teachers?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No teachers found</TableCell></TableRow>
            ) : (
              teachers?.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border shadow-sm">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold">{teacher.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{teacher.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {teacher.subject}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{teacher.phone}</div>
                    <div className="text-xs text-muted-foreground">{teacher.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{teacher.qualification || 'N/A'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(teacher.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TeacherForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateTeacher();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      subject: formData.get("subject") as string,
      qualification: formData.get("qualification") as string || null,
      status: "Active",
    }, {
      onSuccess: () => {
        toast({ title: "Teacher added successfully" });
        onSuccess();
      }
    });
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
          <Input id="email" name="email" type="email" required className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input id="subject" name="subject" required className="rounded-xl" placeholder="e.g. Physics" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" name="qualification" className="rounded-xl" placeholder="e.g. M.Sc, B.Ed" />
        </div>
      </div>
      <Button type="submit" className="w-full rounded-xl mt-4" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Adding..." : "Add Teacher"}
      </Button>
    </form>
  );
}
