import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String },
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Meeting", "Maintenance", "Security", "General", "Alert", "Community"],
      default: "General",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, trim: true },
    targetAudience: {
      type: String,
      enum: ["all", "residents", "staff"],
      default: "all",
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
      index: true,
    },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

noticeSchema.index({ societyId: 1, publishedAt: -1 });

export const Notice = mongoose.model("Notice", noticeSchema);
