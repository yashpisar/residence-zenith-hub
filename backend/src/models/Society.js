import mongoose from "mongoose";

const wingSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    totalFlats: { type: Number, default: 0 },
  },
  { _id: false }
);

const societySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["Apartment", "Gated Community", "Residential Complex", "Villa"],
      default: "Apartment",
    },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },

    secretaryName: { type: String, required: true, trim: true },
    secretaryMobile: { type: String, required: true, trim: true },
    secretaryEmail: { type: String, required: true, lowercase: true, trim: true },
    officeTiming: { type: String, default: "9:00 AM - 6:00 PM" },
    emergencyContact: { type: String, default: "1800-000-0000" },

    coverImage: { type: String, default: "" },
    logo: { type: String, default: "" },

    wings: [wingSchema],
    totalFlats: { type: Number, default: 0 },
    totalResidents: { type: Number, default: 0 },
    occupiedFlats: { type: Number, default: 0 },
    vacantFlats: { type: Number, default: 0 },

    amenities: [{ type: String, trim: true }],
    requiresResidentApproval: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Active", "Under Maintenance", "Inactive", "Suspended"],
      default: "Active",
      index: true,
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Slug generation hook
societySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

societySchema.index({ name: "text", address: "text", city: "text" });

export const Society = mongoose.model("Society", societySchema);
