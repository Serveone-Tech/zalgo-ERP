import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import { CreditCard, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FeePayment { id: number; amountPaid: number; paymentDate: string; paymentMode: string; receiptNo: string }
interface FeeInstallment { id: number; amount: number; dueDate: string; paidDate: string | null; status: string }
interface FeesResponse { payments: FeePayment[]; installments: FeeInstallment[] }

export default function StudentFeesPage() {
  const { fmt } = useCurrency();
  const { data, isLoading } = useQuery<FeesResponse>({ queryKey: ["/api/student-portal/fees"] });
  const payments = data?.payments ?? [];
  const installments = data?.installments ?? [];
  const totalPaid = payments.reduce((s, f) => s + f.amountPaid, 0);
  const pendingInstallments = installments.filter(i => i.status !== "paid" && i.status !== "Paid");
  const totalPending = pendingInstallments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Fee Records</h1>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4"><CheckCircle2 className="w-4 h-4 text-green-500 mb-2" /><p className="text-2xl font-bold">{fmt(totalPaid)}</p><p className="text-xs text-muted-foreground mt-0.5">Total Paid</p></div>
        <div className="rounded-xl border bg-card p-4"><Clock className="w-4 h-4 text-amber-500 mb-2" /><p className="text-2xl font-bold">{fmt(totalPending)}</p><p className="text-xs text-muted-foreground mt-0.5">Pending</p></div>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div> : (
        <>
          {payments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payments</h2>
              {payments.map(f => (
                <div key={f.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold">{fmt(f.amountPaid)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.paymentDate ? format(new Date(f.paymentDate), "dd MMM yyyy") : "—"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {f.paymentMode && <span>{f.paymentMode}</span>}
                        {f.receiptNo && <span>Receipt: {f.receiptNo}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">Paid</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingInstallments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming Due</h2>
              {pendingInstallments.map(i => (
                <div key={i.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-semibold">{fmt(i.amount)}</p><p className="text-xs text-muted-foreground mt-0.5">Due: {format(new Date(i.dueDate), "dd MMM yyyy")}</p></div>
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {payments.length === 0 && pendingInstallments.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No fee records yet</div>}
        </>
      )}
    </div>
  );
}
