import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reporterName: { type: String, trim: true },
    reporterPhone: { type: String, trim: true },
    alertType: {
      type: String,
      enum: ["Fire", "Medical", "Security Breach", "Lift Emergency", "Gas Leak", "Other"],
      required: true,
      index: true,
    },
    location: { type: String, required: true, trim: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["Critical", "High"],
      default: "Critical",
    },
    status: {
      type: String,
      enum: ["Active", "Responding", "Resolved", "False Alarm"],
      default: "Active",
      index: true,
    },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ societyId: 1, status: 1 });

export const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);
