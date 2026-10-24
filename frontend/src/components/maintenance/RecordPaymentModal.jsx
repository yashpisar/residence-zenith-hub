import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/services/api";
import { toast } from "sonner";
import {
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque", "Other"];

export function RecordPaymentModal({ isOpen, onClose, bill, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remaining balance
  const remainingBalance = Number(bill?.outstandingBalance ?? bill?.remainingBalance ?? 0);
  const totalPayable = Number(bill?.totalAmount ?? 0);
  const alreadyPaid = Number(bill?.paidAmount ?? 0);
  const flatDisplay = bill?.flat || `${bill?.wing || ""}-${bill?.flatNumber || ""}`;
  const residentName = bill?.owner || bill?.residentName || "Resident";
  const billingPeriod = bill?.billingPeriod || "Current Month";

  useEffect(() => {
    if (isOpen && bill) {
      setAmount(remainingBalance > 0 ? remainingBalance.toString() : "");
      setPaymentMethod("Cash");
      setTransactionId("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [isOpen, bill, remainingBalance]);

  if (!isOpen || !bill) return null;

  const handleAmountChange = (val) => {
    // Only numbers
    const cleaned = val.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
  };

  const setFullAmount = () => {
    setAmount(remainingBalance.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numAmount > remainingBalance) {
      toast.error(`Payment amount (₹${numAmount}) cannot exceed the remaining balance of ₹${remainingBalance}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await financeApi.recordPayment(bill.id || bill._id, {
        amount: numAmount,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paymentDate: paymentDate || new Date().toISOString(),
        notes: notes.trim() || undefined,
      });

      const updated = res?.data || res;
      toast.success(`Payment of ₹${numAmount} recorded successfully!`, {
        description: `Receipt #${updated?.receiptNumber || "Generated"}`,
      });

      onSuccess?.(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to record payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <DollarSign className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Record Maintenance Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Record an authorized offline or direct payment for this flat.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Summary Card */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Building2 className="size-4 text-primary" />
                <span>Flat {flatDisplay}</span>
                <span className="text-xs font-normal text-muted-foreground">({residentName})</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                {billingPeriod}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
              <div className="p-2 rounded-lg bg-background/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-medium">Total Bill</span>
                <span className="text-xs font-bold text-foreground">₹{totalPayable.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-2 rounded-lg bg-background/50 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-medium">Already Paid</span>
                <span className="text-xs font-bold text-emerald-500">₹{alreadyPaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="p-2 rounded-lg bg-background/50 border border-primary/20 bg-primary/5">
                <span className="text-[10px] text-primary block font-bold">Remaining Due</span>
                <span className="text-xs font-black text-primary">₹{remainingBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Amount Input with Quick Full Pay Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground flex items-center gap-1">
                Amount Received (₹) <span className="text-destructive">*</span>
              </label>
              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={setFullAmount}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Pay Full Balance (₹{remainingBalance})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="flex h-10 w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {Number(amount) > remainingBalance && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="size-3" /> Amount cannot exceed remaining balance of ₹{remainingBalance}
              </p>
            )}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Payment Method <span className="text-destructive">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Payment Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Transaction / Reference ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Reference / Transaction ID {paymentMethod !== "Cash" && "(Recommended)"}
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder={paymentMethod === "UPI" ? "e.g. UPI / UTR 123456789012" : paymentMethod === "Cheque" ? "e.g. Cheque #450291 (HDFC)" : "e.g. Bank Ref # / Receipt Slip #"}
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over at clubhouse office"
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > remainingBalance}
              className="text-xs font-semibold"
            >
              {isSubmitting ? "Recording..." : `Confirm Payment of ₹${Number(amount || 0).toLocaleString("en-IN")}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
