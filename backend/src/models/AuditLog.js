import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    entityType: {
      type: String,
      trim: true,
      default: function () {
        return this.targetResource || "System";
      },
    },
    targetResource: { type: String, trim: true },
    entityId: {
      type: String,
      trim: true,
      default: function () {
        return this.targetId || "";
      },
    },
    targetId: { type: String, trim: true },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ societyId: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
