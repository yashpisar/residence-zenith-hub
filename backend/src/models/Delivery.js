import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    flatId: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true, index: true },
    wing: { type: String, trim: true },
    flatNumber: { type: String, trim: true },
    recipientName: { type: String, required: true, trim: true },
    courierCompany: { type: String, required: true, trim: true }, // Amazon, Flipkart, Swiggy, Zomato, etc.
    deliveryPersonName: { type: String, trim: true, default: "" },
    deliveryPersonPhone: { type: String, trim: true, default: "" },
    deliveryPersonPhoto: { type: String, default: "" },
    packagePhoto: { type: String, default: "" },
    deliveryType: { type: String, default: "Parcel" },
    trackingNumber: { type: String, trim: true, default: "" },
    parcelDetails: { type: String, default: "" },
    notes: { type: String, default: "" },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Guard who received it
    receivedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Waiting for Pickup", "Collected", "Returned"],
      default: "Waiting for Pickup",
      index: true,
    },
    collectedAt: { type: Date },
    collectedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

deliverySchema.index({ societyId: 1, status: 1 });
deliverySchema.index({ societyId: 1, createdAt: -1 });

export const Delivery = mongoose.model("Delivery", deliverySchema);
