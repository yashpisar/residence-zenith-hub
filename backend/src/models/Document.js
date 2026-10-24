import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Society Rules", "Meeting Minutes", "Notices", "Financial Documents", "Other"],
      default: "Other",
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "application/pdf" },
    fileSize: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploaderName: { type: String, trim: true },
    accessLevel: {
      type: String,
      enum: ["public_to_society", "secretary_only"],
      default: "public_to_society",
      index: true,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

documentSchema.index({ societyId: 1, category: 1 });

export const Document = mongoose.model("Document", documentSchema);
