import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { financeApi } from "@/services/api";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  History,
  Layers,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { MaintenanceReceiptModal } from "./MaintenanceReceiptModal";

export function MaintenanceDetailsModal({
  isOpen,
  onClose,
  billId,
  initialBill,
  onRecordPaymentClick,
  onBillUpdated,
}) {
  const [bill, setBill] = useState(initialBill || null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (isOpen && (billId || initialBill?.id || initialBill?._id)) {
      const targetId = billId || initialBill?.id || initialBill?._id;
      if (initialBill) setBill(initialBill);
      setIsLoading(true);
      financeApi
        .getBillById(targetId)
        .then((res) => {
          const data = res?.data || res;
          if (data) setBill(data);
        })
        .catch((err) => {
          console.warn("[MaintenanceDetails] Fetch error:", err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setBill(null);
    }
  }, [isOpen, billId, initialBill]);

  if (!isOpen) return null;

  const flatDisplay =
    bill?.flat || `${bill?.wing || bill?.flatId?.wing || ""}-${bill?.flatNumber || bill?.flatId?.flatNumber || ""}`;
  const ownerName =
    bill?.owner || bill?.ownerName || bill?.flatId?.ownerName || bill?.residentId?.name || "Resident";
  const contactPhone =
    bill?.contactPhone || bill?.flatId?.ownerPhone || bill?.residentId?.phone || "—";
  const residentEmail =
    bill?.residentEmail || bill?.flatId?.ownerEmail || bill?.residentId?.email || "—";
  const societyName =
    bill?.societyId?.name || "Harmony Heights";
  const billingPeriod = bill?.billingPeriod || "Current Month";

  const totalAmount = Number(bill?.totalAmount || 0);
  const paidAmount = Number(bill?.paidAmount || 0);
  const outstandingBalance = Math.max(0, totalAmount - paidAmount);
  const status = bill?.status || "Unpaid";

  const dueDateFormatted = bill?.dueDate
    ? new Date(bill.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const breakdown = Array.isArray(bill?.breakdown) && bill.breakdown.length > 0
    ? bill.breakdown
    : [{ label: "Base Maintenance", amount: totalAmount }];

  const payments = Array.isArray(bill?.payments) ? bill.payments : [];
  const previousBills = Array.isArray(bill?.previousBills) ? bill.previousBills : [];

  const handleOpenReceipt = (pmt) => {
    setSelectedReceipt({
      ...pmt,
      societyName,
      registrationNumber: bill?.societyId?.registrationNumber,
      societyAddress: bill?.societyId?.address?.street || bill?.societyId?.address || "Society Avenue, Mumbai",
      payerName: pmt?.payerId?.name || ownerName,
      flat: flatDisplay,
      billingPeriod,
      remainingBalance: outstandingBalance,
      recordedByName: pmt?.recordedBy?.name || "Society Secretary",
    });
    setIsReceiptOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col bg-card border-border shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 sm:p-6 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {billingPeriod}
                  </span>
                  <StatusBadge value={status} />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  Flat {flatDisplay} Maintenance
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {societyName} • Owner: <span className="font-semibold text-foreground">{ownerName}</span>
                </DialogDescription>
              </div>

              {outstandingBalance > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    onRecordPaymentClick?.(bill);
                  }}
                  className="text-xs font-semibold gap-1.5 shadow-md shadow-primary/20"
                >
                  <PlusCircle className="size-4" /> Record Payment
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)] p-5 sm:p-6 space-y-6">
            <div className="space-y-6">
              {/* Resident Contact & Info Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">Resident / Owner</span>
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                    <User className="size-3.5 text-primary" /> {ownerName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">Contact Phone</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="size-3.5 text-primary" /> {contactPhone}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">Payment Due Date</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="size-3.5 text-primary" /> {dueDateFormatted}
                  </span>
                </div>
              </div>

              {/* Financial Calculation Banner (Total Payable - Total Paid = Outstanding) */}
              <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-primary" /> Financial Summary & Balance Calculation
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block font-medium">Total Amount Payable</span>
                    <span className="text-lg sm:text-xl font-bold text-foreground mt-0.5 block">
                      ₹{totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground block font-medium">Total Amount Paid</span>
                    <span className="text-lg sm:text-xl font-bold text-emerald-500 mt-0.5 block">
                      ₹{paidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${
                    outstandingBalance > 0
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-500"
                      : "border-emerald-500/30 bg-emerald-500/5 text-emerald-500"
                  }`}>
                    <span className="text-[11px] font-bold block">Outstanding Balance</span>
                    <span className="text-lg sm:text-xl font-black mt-0.5 block">
                      {outstandingBalance > 0 ? `₹${outstandingBalance.toLocaleString("en-IN")}` : "₹0 (Cleared)"}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center font-mono pt-1">
                  Calculation: ₹{totalAmount.toLocaleString("en-IN")} (Payable) − ₹{paidAmount.toLocaleString("en-IN")} (Paid) = <strong className="text-foreground">₹{outstandingBalance.toLocaleString("en-IN")}</strong>
                </p>
              </div>

              {/* Charge Breakdown */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Monthly Maintenance Charge Breakdown
                </h4>
                <div className="space-y-1.5 divide-y divide-border/40">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs font-bold text-foreground pt-2">
                    <span>Total Bill for {billingPeriod}</span>
                    <span className="text-primary text-sm font-black">₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Payment Transaction History */}
              <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-primary" /> Payment Transactions ({payments.length})
                  </h4>
                  {outstandingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => onRecordPaymentClick?.(bill)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      + Record New Payment
                    </button>
                  )}
                </div>

                {payments.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                    <AlertCircle className="size-6 text-muted-foreground mx-auto mb-1 opacity-40" />
                    No payments have been recorded for this bill yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Receipt / Ref #</th>
                          <th className="py-2 px-3">Recorded By</th>
                          <th className="py-2 px-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {payments.map((p, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-500">
                              ₹{Number(p.amount).toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-foreground border border-border">
                                {p.paymentMethod || "Cash"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-[140px]">
                              {p.receiptNumber || p.providerTransactionId || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {p.recordedBy?.name || "Secretary"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReceipt(p)}
                                className="h-7 text-[11px] text-primary px-2 hover:bg-primary/10 gap-1"
                              >
                                <Printer className="size-3" /> View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Previous Months' Records */}
              {previousBills.length > 0 && (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="size-3.5 text-primary" /> Previous Months' Maintenance History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Period</th>
                          <th className="py-2 px-3">Total Payable</th>
                          <th className="py-2 px-3">Amount Paid</th>
                          <th className="py-2 px-3">Balance</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {previousBills.map((prev, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="py-2 px-3 font-semibold text-foreground">{prev.billingPeriod}</td>
                            <td className="py-2 px-3">₹{Number(prev.totalAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2 px-3 text-emerald-500 font-semibold">₹{Number(prev.paidAmount || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2 px-3 text-muted-foreground">₹{Number(prev.outstandingBalance || 0).toLocaleString("en-IN")}</td>
                            <td className="py-2 px-3">
                              <StatusBadge value={prev.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Controls */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Back to Table
            </Button>
            {outstandingBalance > 0 && (
              <Button
                size="sm"
                onClick={() => onRecordPaymentClick?.(bill)}
                className="text-xs font-semibold gap-1.5"
              >
                <DollarSign className="size-3.5" /> Record Payment
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Receipt Modal */}
      <MaintenanceReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={selectedReceipt}
      />
    </>
  );
}
