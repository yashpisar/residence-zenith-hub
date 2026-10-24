import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    visitorName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photographUrl: { type: String, default: "" },
    idProofPhoto: { type: String, default: "" },
    idType: { type: String, default: "" },
    idNumber: { type: String, default: "" },
    purpose: {
      type: String,
      default: "Guest",
    },
    vehicleNumber: { type: String, trim: true, default: "" },
    numberOfVisitors: { type: Number, default: 1 },
    notes: { type: String, default: "" },
    expectedTime: { type: Date },
    entryTime: { type: Date, index: true },
    exitTime: { type: Date },
    registeredBy: {
      type: String,
      enum: ["resident", "guard"],
      default: "guard",
    },
    guardId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, default: "" },
    passToken: { type: String, index: true },
  },
  { timestamps: true }
);

visitorSchema.index({ societyId: 1, approvalStatus: 1, createdAt: -1 });
visitorSchema.index({ societyId: 1, entryTime: -1 });

export const Visitor = mongoose.model("Visitor", visitorSchema);
