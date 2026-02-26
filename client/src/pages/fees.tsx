import { useState } from "react";
import { useFees, useCreateFee } from "@/hooks/use-fees";
import { useStudents } from "@/hooks/use-students";
import { useCourses } from "@/hooks/use-courses";
import { format } from "date-fns";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, CreditCard, Receipt } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function FeesPage() {
  const { data: fees, isLoading } = useFees();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Fees & Payments</h1>
          <p className="text-muted-foreground text-sm mt-1">Record and track student payments</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" /> Record Payment
              </DialogTitle>
            </DialogHeader>
            <FeeForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Receipt No</TableHead>
              <TableHead className="font-semibold">Student ID</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Mode</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : fees?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
            ) : (
              fees?.map((fee) => (
                <TableRow key={fee.id} className="hover:bg-accent/30">
                  <TableCell className="font-medium font-mono text-xs">{fee.receiptNo}</TableCell>
                  <TableCell className="text-sm">ID: {fee.studentId}</TableCell>
                  <TableCell className="font-bold text-primary">₹{fee.amountPaid.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <CreditCard className="w-3 h-3" /> {fee.paymentMode}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {fee.paymentDate ? format(new Date(fee.paymentDate), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                      {fee.status}
                    </Badge>
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

function FeeForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateFee();
  const { data: students } = useStudents();
  const { data: courses } = useCourses();
  const { toast } = useToast();

  const [studentId, setStudentId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId || !courseId) {
      toast({ title: "Please select student and course", variant: "destructive" });
      return;
    }

    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      studentId: Number(studentId),
      courseId: Number(courseId),
      amountPaid: Number(formData.get("amount")),
      paymentMode: paymentMode,
      receiptNo: `RCPT${Date.now().toString().slice(-6)}`,
      status: "Paid",
    }, {
      onSuccess: () => {
        toast({ title: "Payment recorded successfully" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Select Student *</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select student..." />
          </SelectTrigger>
          <SelectContent>
            {students?.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.enrollmentNo})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Select Course *</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select course..." />
          </SelectTrigger>
          <SelectContent>
            {courses?.map(c => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount Paid (₹) *</Label>
          <Input id="amount" name="amount" type="number" required className="rounded-xl" min="1" />
        </div>
        <div className="space-y-2">
          <Label>Payment Mode *</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Online">Online / UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full rounded-xl mt-4" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
}
