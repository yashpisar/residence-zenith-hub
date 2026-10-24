import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceBill", index: true },
    payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Net Banking", "Bank Transfer", "Cash", "Cheque", "Other", "Demo"],
      default: "Cash",
    },
    paymentDate: { type: Date, default: Date.now },
    provider: {
      type: String,
      enum: ["Demo", "Razorpay"],
      default: "Demo",
    },
    providerOrderId: { type: String, trim: true },
    providerTransactionId: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Successful", "Failed", "Refunded"],
      default: "Pending",
      index: true,
    },
    idempotencyKey: { type: String, trim: true },
    verifiedAt: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If cash recorded by secretary
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Sparse unique indexes to allow null/absent fields without collision
paymentSchema.index({ providerTransactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
paymentSchema.index({ societyId: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);
