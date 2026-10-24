import { useState } from "react";
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
import { Calendar, Plus, Trash2, Building, AlertCircle, Sparkles } from "lucide-react";

export function GenerateBillsModal({ isOpen, onClose, onSuccess, currentSocietyId }) {
  // Default to next month if currently near end of month, else current month
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    return `${yr}-${mo}`;
  });

  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });

  const [baseAmount, setBaseAmount] = useState("3500");
  const [breakdown, setBreakdown] = useState([
    { label: "Base Maintenance", amount: 3000 },
    { label: "Sinking Fund", amount: 500 },
  ]);
  const [targetFlats, setTargetFlats] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalCalculated = breakdown.reduce(
    (acc, b) => acc + (Number(b.amount) || 0),
    0
  );

  const handleAddBreakdownItem = () => {
    setBreakdown((prev) => [...prev, { label: "Clubhouse / Amenities", amount: 500 }]);
  };

  const handleRemoveBreakdownItem = (index) => {
    if (breakdown.length <= 1) {
      toast.error("At least one charge component is required.");
      return;
    }
    setBreakdown((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBreakdownChange = (index, field, val) => {
    setBreakdown((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === "amount" ? Number(val) || 0 : val } : item
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!billingPeriod) {
      toast.error("Please enter a valid billing period in YYYY-MM format.");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await financeApi.generateBills({
        billingPeriod,
        dueDate,
        baseAmount: totalCalculated,
        breakdown,
        targetFlats,
        societyId: currentSocietyId,
      });

      const data = res?.data || res;
      toast.success(
        `Generated ${data.generatedCount} new maintenance bills for ${billingPeriod}!`,
        {
          description: `${data.skippedCount || 0} flats already had bills for this month.`,
        }
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to generate monthly bills.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Generate Monthly Maintenance Bills
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate monthly maintenance invoices for flats in your society.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Billing Period & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">
                Billing Period (YYYY-MM) <span className="text-destructive">*</span>
              </label>
              <input
                type="month"
                required
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">
                Payment Due Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Target Flats */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Target Units</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetFlats("all")}
                className={`py-2 px-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                  targetFlats === "all"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                All Registered Flats
              </button>
              <button
                type="button"
                onClick={() => setTargetFlats("occupied")}
                className={`py-2 px-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                  targetFlats === "occupied"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                Occupied Flats Only
              </button>
            </div>
          </div>

          {/* Breakdown Items */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground">
                Standard Charge Breakdown
              </label>
              <button
                type="button"
                onClick={handleAddBreakdownItem}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="size-3" /> Add item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={item.label}
                    onChange={(e) => handleBreakdownChange(idx, "label", e.target.value)}
                    placeholder="Fee description"
                    className="flex h-8 flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={item.amount}
                      onChange={(e) => handleBreakdownChange(idx, "amount", e.target.value)}
                      placeholder="0"
                      className="flex h-8 w-full rounded-lg border border-border bg-background pl-6 pr-2 py-1 text-xs font-semibold"
                    />
                  </div>
                  {breakdown.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveBreakdownItem(idx)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Preview */}
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <span className="font-bold text-foreground text-xs">Standard Total per Flat:</span>
              <span className="font-black text-lg text-primary">₹{totalCalculated.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/70 text-[11px] text-muted-foreground">
            <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              Flats with customized maintenance rates saved in the system will automatically be charged their specific rate. Flats that already have a bill for {billingPeriod} will be skipped safely.
            </p>
          </div>

          {/* Modal Actions */}
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
              disabled={isSubmitting || totalCalculated <= 0}
              className="text-xs font-semibold"
            >
              {isSubmitting ? "Generating..." : `Generate Bills for ${billingPeriod}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
