import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["resident", "secretary", "security"],
      required: true,
    },
    residentType: {
      type: String,
      enum: ["Owner", "Tenant", "FamilyMember"],
      default: "Tenant",
    },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    recipientEmail: { type: String, lowercase: true, trim: true },
    recipientPhone: { type: String, trim: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

invitationSchema.index({ societyId: 1, role: 1 });


export const Invitation = mongoose.model("Invitation", invitationSchema);
