import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Search, Filter, Download, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

const mockResidentPayments = [
  { id: "PAY-1042", month: "Oct 2026", amount: 4500, dueDate: "2026-10-05", paymentDate: "2026-10-01", status: "Paid", method: "UPI", receipt: "RCPT-881" },
  { id: "PAY-0941", month: "Sep 2026", amount: 4500, dueDate: "2026-09-05", paymentDate: "2026-09-04", status: "Paid", method: "Credit Card", receipt: "RCPT-772" },
  { id: "PAY-0820", month: "Aug 2026", amount: 4500, dueDate: "2026-08-05", paymentDate: "2026-08-05", status: "Paid", method: "Bank Transfer", receipt: "RCPT-663" },
];

const mockAllPayments = [
  { id: "PAY-1045", flat: "A-101", month: "Oct 2026", amount: 4500, status: "Paid", date: "2026-10-03", method: "UPI" },
  { id: "PAY-1046", flat: "B-204", month: "Oct 2026", amount: 5200, status: "Pending", date: "-", method: "-" },
  { id: "PAY-1047", flat: "C-302", month: "Oct 2026", amount: 4500, status: "Overdue", date: "-", method: "-" },
  { id: "PAY-1048", flat: "A-405", month: "Oct 2026", amount: 4500, status: "Paid", date: "2026-10-01", method: "UPI" },
];

function PaymentsPage() {
  const { user } = useAuth();
  const role = user?.role || "resident";

  return (
    <>
      <PageHeader
        icon={Receipt}
        title={role === "secretary" ? "All Payments" : "My Payments"}
        description={role === "secretary" ? "Track society-wide payments, dues, and reconciliation." : "View your payment history, current dues, and download receipts."}
      />
      
      {role === "secretary" ? <SecretaryPaymentsView /> : <ResidentPaymentsView />}
    </>
  );
}

function ResidentPaymentsView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="p-6">
          <p className="text-sm font-medium text-muted-foreground">Total Paid (2026)</p>
          <p className="text-3xl font-bold mt-2">₹40,500</p>
        </SurfaceCard>
        <SurfaceCard className="p-6 border-destructive/50 bg-destructive/5">
          <p className="text-sm font-medium text-destructive">Current Due</p>
          <p className="text-3xl font-bold mt-2">₹0</p>
        </SurfaceCard>
        <SurfaceCard className="p-6 flex flex-col justify-center items-center">
          <Button className="w-full gap-2">
            <ArrowUpRight className="w-4 h-4" />
            Make a Payment
          </Button>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Payment History</h3>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Payment Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockResidentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.id}</td>
                  <td className="px-4 py-3">{p.month}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3">{p.dueDate}</td>
                  <td className="px-4 py-3">{p.paymentDate}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.method}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-8 text-primary">
                      {p.receipt}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}

function SecretaryPaymentsView() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SurfaceCard className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold mt-1">₹4.2L</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Pending Dues</p>
          <p className="text-2xl font-bold mt-1">₹85,000</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold mt-1 text-destructive">₹12,500</p>
        </SurfaceCard>
        <SurfaceCard className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Flats Paid</p>
          <p className="text-2xl font-bold mt-1">92 / 120</p>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="font-semibold">Society Payments</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search flat or ID..."
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Flat</th>
                <th className="px-4 py-3 font-medium">Payment ID</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockAllPayments.map((p, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.flat}</td>
                  <td className="px-4 py-3">{p.id}</td>
                  <td className="px-4 py-3">{p.month}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Paid' ? 'bg-green-500/10 text-green-600' :
                      p.status === 'Pending' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.date}</td>
                  <td className="px-4 py-3">{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
