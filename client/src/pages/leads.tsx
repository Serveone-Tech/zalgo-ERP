import { useState } from "react";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/use-leads";
import { useCourses } from "@/hooks/use-courses";
import { ImportDialog, type FieldDef } from "@/components/import-dialog";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Trash2, Eye } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const LEAD_FIELDS: FieldDef[] = [
  { key: "studentName", label: "Student Name", required: true, sample: "Rahul Kumar" },
  { key: "parentName", label: "Parent Name", sample: "Sanjay Kumar" },
  { key: "phone", label: "Student Mobile", required: true, sample: "9876543210" },
  { key: "parentPhone", label: "Parent Mobile", sample: "9988776655" },
  { key: "address", label: "Address", sample: "123, Model Town, Delhi" },
  { key: "courseInterested", label: "Interested Course", required: true, sample: "JEE Main & Advanced" },
];

export default function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const createLead = useCreateLead();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleBulkImport = async (rows: Record<string, string>[]) => {
    let success = 0; let failed = 0;
    for (const row of rows) {
      try {
        await new Promise<void>((resolve, reject) => {
          createLead.mutate({
            studentName: row.studentName || "",
            parentName: row.parentName || "",
            phone: row.phone || "",
            parentPhone: row.parentPhone || "",
            address: row.address || "",
            courseInterested: row.courseInterested || "",
            status: "New",
          }, { onSuccess: () => { success++; resolve(); }, onError: () => { failed++; resolve(); } });
        });
      } catch { failed++; }
    }
    return { success, failed };
  };

  const filteredLeads = leads?.filter(lead => 
    lead.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Enquiries</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage prospective student leads</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search leads..." 
              className="pl-9 bg-card border-border/50 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <ImportDialog entityName="Enquiries" fields={LEAD_FIELDS} onImport={handleBulkImport} />

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Enquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">New Enquiry</DialogTitle>
              </DialogHeader>
              <LeadForm onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Student Name</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Course</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filteredLeads?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No enquiries found</TableCell></TableRow>
            ) : (
              filteredLeads?.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-accent/30">
                  <TableCell className="font-medium">{lead.studentName}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.courseInterested}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      lead.status === 'New' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                      lead.status === 'Converted' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 
                      lead.status === 'Follow-up' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                      'border-slate-200 text-slate-700 bg-slate-50'
                    }>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <LeadActions lead={lead} />
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

function LeadActions({ lead }: { lead: any }) {
  const deleteMutation = useDeleteLead();
  const updateMutation = useUpdateLead();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleDelete = () => {
    if(confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(lead.id, {
        onSuccess: () => toast({ title: "Lead deleted" })
      });
    }
  };

  const updateStatus = (status: string) => {
    updateMutation.mutate({ id: lead.id, status }, {
      onSuccess: () => toast({ title: `Status updated to ${status}` })
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => navigate(`/leads/${lead.id}`)} data-testid={`btn-view-lead-${lead.id}`}>
        <Eye className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
            <Eye className="h-4 w-4 mr-2" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus('Follow-up')}>Mark Follow-up</DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus('Converted')}>Mark Converted</DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus('Dropped')}>Mark Dropped</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateLead();
  const { data: courses } = useCourses();
  const { toast } = useToast();
  const [courseInterested, setCourseInterested] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!courseInterested) {
      toast({ title: "Please select a course", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      studentName: formData.get("studentName") as string,
      parentName: formData.get("parentName") as string,
      phone: formData.get("phone") as string,
      parentPhone: formData.get("parentPhone") as string,
      address: formData.get("address") as string,
      courseInterested,
      status: "New",
    }, {
      onSuccess: () => {
        toast({ title: "Enquiry added successfully" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Student Name *</Label>
          <Input data-testid="input-studentName" id="studentName" name="studentName" required className="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="parentName">Parent Name</Label>
            <Input data-testid="input-parentName" id="parentName" name="parentName" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Mobile</Label>
            <Input data-testid="input-parentPhone" id="parentPhone" name="parentPhone" type="tel" className="rounded-xl" placeholder="Parent mobile no." />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Student Mobile *</Label>
          <Input data-testid="input-phone" id="phone" name="phone" type="tel" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input data-testid="input-address" id="address" name="address" className="rounded-xl" placeholder="Enter address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseInterested">Interested Course *</Label>
          <Select value={courseInterested} onValueChange={setCourseInterested}>
            <SelectTrigger data-testid="select-courseInterested" className="rounded-xl">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {courses && courses.length > 0 ? (
                courses.filter(c => c.status === "Active").map(course => (
                  <SelectItem key={course.id} value={course.name}>
                    {course.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>No courses available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button data-testid="button-saveEnquiry" type="submit" className="w-full rounded-xl mt-2" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Adding..." : "Save Enquiry"}
      </Button>
    </form>
  );
}
