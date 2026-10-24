import mongoose from "mongoose";

const societyMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    role: {
      type: String,
      enum: ["resident", "secretary", "security", "superadmin"],
      required: true,
    },
    residentType: {
      type: String,
      enum: ["Owner", "Tenant", "FamilyMember"],
      default: "Owner",
    },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat" },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    isOwner: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Active", "Pending", "Inactive", "Suspended", "Rejected"],
      default: "Pending",
      index: true,
    },
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" },
    approvalNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound unique index ensuring a user has only one membership per society
societyMembershipSchema.index({ userId: 1, societyId: 1 }, { unique: true });
societyMembershipSchema.index({ societyId: 1, role: 1 });
societyMembershipSchema.index({ societyId: 1, status: 1 });

export const SocietyMembership = mongoose.model("SocietyMembership", societyMembershipSchema);
