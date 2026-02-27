import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

function useTransactions() {
  return useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
}

const incomeCategories = ["Fee Collection", "Donation", "Government Grant", "Book Sales", "Other Income"];
const expenseCategories = ["Salary", "Rent", "Utilities", "Stationery", "Equipment", "Marketing", "Maintenance", "Other Expense"];

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();
  const [isOpen, setIsOpen] = useState(false);
  const [txType, setTxType] = useState<"Income" | "Expense">("Income");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: "Transaction recorded successfully" });
      setIsOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      type: txType,
      category: fd.get("category"),
      amount: Number(fd.get("amount")),
      description: fd.get("description") || null,
    });
  };

  const totalIncome = transactions?.filter((t: any) => t.type === "Income").reduce((s: number, t: any) => s + t.amount, 0) || 0;
  const totalExpense = transactions?.filter((t: any) => t.type === "Expense").reduce((s: number, t: any) => s + t.amount, 0) || 0;
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Income & Expense</h1>
          <p className="text-muted-foreground text-sm mt-1">Track daily income and expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-md shadow-primary/20" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-2" /> Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="flex gap-3">
                <Button type="button" onClick={() => setTxType("Income")} className="flex-1 rounded-xl" variant={txType === "Income" ? "default" : "outline"}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Income
                </Button>
                <Button type="button" onClick={() => setTxType("Expense")} className="flex-1 rounded-xl" variant={txType === "Expense" ? "destructive" : "outline"}>
                  <TrendingDown className="w-4 h-4 mr-2" /> Expense
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <select name="category" required className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select category...</option>
                  {(txType === "Income" ? incomeCategories : expenseCategories).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input name="amount" type="number" required min="1" className="rounded-xl" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" className="rounded-xl" placeholder="Additional notes..." />
              </div>
              <Button type="submit" className={`w-full rounded-xl ${txType === "Expense" ? "bg-destructive hover:bg-destructive/90" : ""}`} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : `Record ${txType}`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{totalIncome.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Expense</p>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-destructive">₹{totalExpense.toLocaleString("en-IN")}</p>
        </div>
        <div className={`bg-card rounded-2xl p-5 border shadow-sm ${balance >= 0 ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${balance >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>₹{Math.abs(balance).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
        ) : transactions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16">
            <IndianRupee className="w-14 h-14 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No transactions recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...transactions].reverse().map((tx: any) => (
                  <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          {tx.type === "Income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <Badge variant={tx.type === "Income" ? "default" : "destructive"} className={`text-xs ${tx.type === "Income" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}`}>
                          {tx.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{tx.category}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${tx.type === "Income" ? "text-emerald-600" : "text-destructive"}`}>
                        {tx.type === "Income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.description || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.date ? new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
