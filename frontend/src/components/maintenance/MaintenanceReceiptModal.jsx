import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, Building2, Calendar, FileText, CreditCard } from "lucide-react";

export function MaintenanceReceiptModal({ isOpen, onClose, receiptData }) {
  if (!isOpen || !receiptData) return null;

  const societyName = receiptData.societyName || "Harmony Society";
  const societyReg = receiptData.registrationNumber || "REG-2026-SOC";
  const societyAddress = receiptData.societyAddress || "Main Avenue, Mumbai, Maharashtra 400001";
  const receiptNo = receiptData.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`;
  const dateFormatted = receiptData.paymentDate
    ? new Date(receiptData.paymentDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");
  const amount = Number(receiptData.amount || 0);
  const remaining = Number(receiptData.remainingBalance ?? 0);
  const payerName = receiptData.payerName || receiptData.owner || "Resident";
  const flatDisplay = receiptData.flat || `${receiptData.wing || ""}-${receiptData.flatNumber || ""}`;
  const period = receiptData.billingPeriod || "Current Month";
  const method = receiptData.paymentMethod || "Cash";
  const txnId = receiptData.providerTransactionId || receiptData.transactionId || receiptNo;
  const recordedBy = receiptData.recordedByName || "Society Management";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        <div id="maintenance-receipt" className="p-6 sm:p-8 space-y-6 bg-background text-foreground">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Building2 className="size-4" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{societyName}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{societyAddress}</p>
              <p className="text-[11px] text-muted-foreground">Reg No: {societyReg}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" /> PAID RECEIPT
              </span>
              <p className="text-xs font-mono font-bold mt-1.5 text-foreground">{receiptNo}</p>
              <p className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="size-3" /> {dateFormatted}
              </p>
            </div>
          </div>

          {/* Resident & Flat Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border/80 bg-muted/20 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block">Received From:</span>
              <span className="font-bold text-foreground text-sm block mt-0.5">{payerName}</span>
              <span className="text-muted-foreground block mt-0.5">Flat: <strong className="text-foreground">{flatDisplay}</strong></span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-muted-foreground block">Billing Period:</span>
              <span className="font-bold text-foreground text-sm block mt-0.5">{period}</span>
              <span className="text-muted-foreground block mt-0.5">Payment Mode: <strong className="text-foreground">{method}</strong></span>
            </div>
          </div>

          {/* Payment Breakdown Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground px-2 py-1.5 border-b border-border">
              <span>Description</span>
              <span>Amount (₹)</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 px-2">
              <span className="text-foreground">Society Maintenance Contribution ({period})</span>
              <span className="font-semibold text-foreground">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-2 px-2 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Remaining Dues for this Period</span>
              <span className={remaining > 0 ? "font-bold text-amber-500" : "font-semibold text-emerald-500"}>
                {remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "NIL (Fully Settled)"}
              </span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Total Paid</span>
              <p className="text-2xl font-black text-foreground mt-0.5">₹{amount.toLocaleString("en-IN")}</p>
            </div>
            <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
              <p className="flex items-center justify-end gap-1 font-mono">
                <CreditCard className="size-3" /> Ref: {txnId}
              </p>
              <p>Handled by: {recordedBy}</p>
            </div>
          </div>

          {/* Footer & Signature Stamp */}
          <div className="pt-2 flex items-end justify-between text-[11px] text-muted-foreground border-t border-border">
            <div className="space-y-0.5 max-w-[280px]">
              <p className="text-[10px]">This is a system-generated computer receipt issued by Harmony Society Management.</p>
            </div>
            <div className="text-center">
              <div className="w-28 border-b border-dashed border-foreground/40 mb-1"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button size="sm" onClick={handlePrint} className="text-xs font-semibold gap-1.5">
            <Printer className="size-3.5" /> Print / Save PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
