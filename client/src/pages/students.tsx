import { useState } from "react";
import { useStudents, useCreateStudent, useDeleteStudent } from "@/hooks/use-students";
import { format } from "date-fns";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, User } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const { data: students, isLoading } = useStudents();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const deleteMutation = useDeleteStudent();
  const { toast } = useToast();

  const filtered = students?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to remove this student?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => toast({ title: "Student removed" })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage enrolled students</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or reg no..." 
              className="pl-9 bg-card border-border/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Register Student</DialogTitle>
              </DialogHeader>
              <StudentForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold w-[100px]">Reg No</TableHead>
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
            ) : (
              filtered?.map((student) => (
                <TableRow key={student.id} className="hover:bg-accent/30">
                  <TableCell className="font-medium text-xs text-muted-foreground">{student.enrollmentNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{student.phone}</div>
                    <div className="text-xs text-muted-foreground">P: {student.parentPhone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {student.createdAt ? format(new Date(student.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleDelete(student.id)}>
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

function StudentForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateStudent();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      enrollmentNo: `BSC${Math.floor(1000 + Math.random() * 9000)}`, // Auto generate for simplicity
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string,
      parentPhone: formData.get("parentPhone") as string,
      address: formData.get("address") as string || null,
      status: "Active",
    }, {
      onSuccess: () => {
        toast({ title: "Student registered successfully" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Student Phone *</Label>
          <Input id="phone" name="phone" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Parent Phone *</Label>
          <Input id="parentPhone" name="parentPhone" required className="rounded-xl" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" className="rounded-xl" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" className="rounded-xl" />
        </div>
      </div>
      <Button type="submit" className="w-full rounded-xl mt-2" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Registering..." : "Register Student"}
      </Button>
    </form>
  );
}
