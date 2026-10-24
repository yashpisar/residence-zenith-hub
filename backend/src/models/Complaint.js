import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      required: true,
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const assignedStaffSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, trim: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    complaintNumber: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", index: true },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Plumbing",
        "Electrical",
        "Sanitation",
        "Security",
        "General",
        "Elevator",
        "Civil",
        "Amenities",
        "Housekeeping",
        "Safety",
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },
    isUrgent: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Closed"],
      default: "Pending",
      index: true,
    },
    assignedStaff: assignedStaffSchema,
    images: [{ type: String }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

// Compound unique index ensuring complaintNumber is unique per society
complaintSchema.index({ societyId: 1, complaintNumber: 1 }, { unique: true });
complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, visibility: 1 });

export const Complaint = mongoose.model("Complaint", complaintSchema);
