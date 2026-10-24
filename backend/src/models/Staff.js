import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    staffId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["Security Guard", "Electrician", "Plumber", "Housekeeping", "Supervisor", "Gardener", "Other"],
      required: true,
      index: true,
    },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night", "General"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["On Duty", "Off Duty", "On Leave", "Terminated"],
      default: "On Duty",
      index: true,
    },
    assignedWing: { type: String, trim: true, default: "All" },
  },
  { timestamps: true }
);

staffSchema.index({ societyId: 1, role: 1 });
staffSchema.index({ societyId: 1, userId: 1 }, { sparse: true });
staffSchema.index({ societyId: 1, phone: 1 });

export const Staff = mongoose.model("Staff", staffSchema);
