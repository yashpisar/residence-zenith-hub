import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["resident", "secretary", "security", "superadmin"],
      default: "resident",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "PendingVerification", "Inactive", "Suspended", "Disabled"],
      default: "Active",
      index: true,
    },
    avatarUrl: { type: String, default: "" },
    // Convenience references for the currently active/primary society and flat
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    wing: { type: String },
    flatNumber: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
