import mongoose from "mongoose";

const breakdownItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const maintenanceBillSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    billingPeriod: { type: String, required: true, trim: true }, // Format: "YYYY-MM", e.g. "2026-10"
    dueDate: { type: Date, required: true },
    baseAmount: { type: Number, required: true, min: 0 },
    breakdown: [breakdownItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Overdue", "Cancelled"],
      default: "Unpaid",
      index: true,
    },
    lastPaymentDate: { type: Date },
    lastPaymentMethod: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Compound unique index preventing duplicate billing periods for the same flat in a society
maintenanceBillSchema.index({ societyId: 1, flatId: 1, billingPeriod: 1 }, { unique: true });
maintenanceBillSchema.index({ societyId: 1, status: 1 });

export const MaintenanceBill = mongoose.model("MaintenanceBill", maintenanceBillSchema);
