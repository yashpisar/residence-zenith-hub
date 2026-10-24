import mongoose from "mongoose";

const flatSchema = new mongoose.Schema(
  {
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true, index: true },
    wing: { type: String, required: true, trim: true },
    flatNumber: { type: String, required: true, trim: true },
    floor: { type: Number, required: true },
    occupancyStatus: {
      type: String,
      enum: ["Occupied", "Vacant", "Under Maintenance"],
      default: "Vacant",
      index: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ownerName: { type: String, trim: true },
    ownerPhone: { type: String, trim: true },
    ownerEmail: { type: String, lowercase: true, trim: true },
    residentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalResidents: { type: Number, default: 0 },
    intercomNumber: { type: String, trim: true },
    maintenanceAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

// Compound unique index ensuring no duplicate wing/flat combination within the same society
flatSchema.index({ societyId: 1, wing: 1, flatNumber: 1 }, { unique: true });

export const Flat = mongoose.model("Flat", flatSchema);
