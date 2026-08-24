import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, UploadCloud, Plus, Trash2, Camera, MapPin, X } from "lucide-react";

export const AMENITIES_LIST = [
  "Garden",
  "Gym",
  "Club House",
  "Swimming Pool",
  "Parking",
  "Children Play Area",
  "Community Hall",
  "CCTV",
  "Fire Safety",
  "Power Backup",
  "Lift",
  "Temple",
  "Jogging Track",
  "Indoor Games",
  "Visitor Parking",
  "Security Gate",
];

export function SocietyForm({ initialData, isEdit, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    registrationNumber: initialData?.registrationNumber || "",
    type: initialData?.type || "Apartment",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    pinCode: initialData?.pinCode || "",
    secretaryName: initialData?.secretaryName || "",
    secretaryMobile: initialData?.secretaryMobile || "",
    secretaryEmail: initialData?.secretaryEmail || "",
    officeTiming: initialData?.officeTiming || "",
    emergencyContact: initialData?.emergencyContact || "",
    totalFlats: initialData?.totalFlats || 0,
    totalResidents: initialData?.totalResidents || 0,
    occupiedFlats: initialData?.occupiedFlats || 0,
    vacantFlats: initialData?.vacantFlats || 0,
    description: initialData?.description || "",
    status: initialData?.status || "Active",
  });

  const [logo, setLogo] = useState(initialData?.logo || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [wings, setWings] = useState(initialData?.wings || []);
  const [amenities, setAmenities] = useState(initialData?.amenities || []);
  const [otherAmenity, setOtherAmenity] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWing = () => {
    setWings([...wings, { id: Date.now().toString(), name: "", totalFlats: 0 }]);
    setIsDirty(true);
  };

  const updateWing = (id, field, value) => {
    setWings(wings.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
    setIsDirty(true);
  };

  const removeWing = (id) => {
    setWings(wings.filter((w) => w.id !== id));
    setIsDirty(true);
  };

  const handleAmenityToggle = (amenity) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
    setIsDirty(true);
  };

  const handleAddOtherAmenity = () => {
    if (otherAmenity.trim() && !amenities.includes(otherAmenity.trim())) {
      setAmenities([...amenities, otherAmenity.trim()]);
      setOtherAmenity("");
      setIsDirty(true);
    }
  };

  const validate = () => {
    if (!formData.name) return "Society Name is required";
    if (!formData.registrationNumber) return "Registration Number is required";
    if (!formData.city) return "City is required";
    if (!formData.secretaryEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      return "Invalid Secretary Email";
    if (!formData.secretaryMobile.match(/^\d{10}$/)) return "Mobile number must be 10 digits";
    if (!formData.pinCode.match(/^\d{6}$/)) return "PIN Code must be 6 digits";
    if (formData.totalFlats < 1) return "Total Flats must be at least 1";
    if (formData.totalResidents < 0) return "Total Residents cannot be negative";
    if (formData.occupiedFlats < 0 || formData.vacantFlats < 0)
      return "Occupied/Vacant flats cannot be negative";
    if (
      Number(formData.occupiedFlats) + Number(formData.vacantFlats) >
      Number(formData.totalFlats)
    ) {
      return "Occupied + Vacant flats cannot exceed Total Flats";
    }

    // Wings validation
    const wingNames = wings.map((w) => w.name.trim().toLowerCase());
    if (new Set(wingNames).size !== wingNames.length) {
      return "Duplicate wing names are not allowed";
    }
    if (wings.some((w) => !w.name.trim())) {
      return "All wings must have a name";
    }

    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = {
      ...formData,
      logo,
      coverImage,
      wings,
      amenities,
    };

    try {
      onSubmit(payload);
      setIsDirty(false); // Clear dirty state on successful save
    } catch (err) {
      toast.error(err.message || "Failed to save society");
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        return;
      }
    }
    onCancel();
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all fields?")) {
      setFormData({
        name: "",
        registrationNumber: "",
        type: "Apartment",
        address: "",
        city: "",
        state: "",
        pinCode: "",
        secretaryName: "",
        secretaryMobile: "",
        secretaryEmail: "",
        officeTiming: "",
        emergencyContact: "",
        totalFlats: 0,
        totalResidents: 0,
        occupiedFlats: 0,
        vacantFlats: 0,
        description: "",
        status: "Active",
      });
      setLogo("");
      setCoverImage("");
      setWings([]);
      setAmenities([]);
      setIsDirty(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Images Section */}
      <div className="space-y-6">
        <div>
          <Label>Cover Image</Label>
          <div className="mt-2 flex items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-border bg-muted/50 overflow-hidden relative group">
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Label
                    htmlFor="cover-upload"
                    className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Replace
                  </Label>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCoverImage("");
                      setIsDirty(true);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <Label
                htmlFor="cover-upload"
                className="cursor-pointer flex flex-col items-center text-muted-foreground hover:text-foreground"
              >
                <UploadCloud className="size-8 mb-2" />
                <span>Upload Cover Image</span>
              </Label>
            )}
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, setCoverImage)}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="size-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden relative group bg-muted/50">
            {logo ? (
              <>
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => {
                      setLogo("");
                      setIsDirty(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Camera className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <Label>Society Logo</Label>
            <div className="mt-2">
              <Label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Choose Image
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, setLogo)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended size: 256x256px. PNG or JPG.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Basic Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            <Building2 className="size-5" /> Basic Details
          </h3>

          <div className="space-y-2">
            <Label>Society Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Harmony Heights"
            />
          </div>

          <div className="space-y-2">
            <Label>Registration Number *</Label>
            <Input
              value={formData.registrationNumber}
              onChange={(e) => handleChange("registrationNumber", e.target.value)}
              placeholder="e.g. SOC-PUN-001"
            />
          </div>

          <div className="space-y-2">
            <Label>Society Type</Label>
            <Select value={formData.type} onValueChange={(v) => handleChange("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Residential Complex">Residential Complex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            <MapPin className="size-5" /> Location Details
          </h3>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Full street address"
              className="h-20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>PIN Code *</Label>
            <Input
              value={formData.pinCode}
              onChange={(e) => handleChange("pinCode", e.target.value)}
              maxLength={6}
            />
          </div>
        </div>

        {/* Secretary & Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Secretary & Contact Info</h3>

          <div className="space-y-2">
            <Label>Secretary Name *</Label>
            <Input
              value={formData.secretaryName}
              onChange={(e) => handleChange("secretaryName", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mobile Number *</Label>
              <Input
                value={formData.secretaryMobile}
                onChange={(e) => handleChange("secretaryMobile", e.target.value)}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={formData.secretaryEmail}
                onChange={(e) => handleChange("secretaryEmail", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Office Timing</Label>
              <Input
                value={formData.officeTiming}
                onChange={(e) => handleChange("officeTiming", e.target.value)}
                placeholder="e.g. 10 AM - 6 PM"
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact *</Label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => handleChange("emergencyContact", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Statistics & Wings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Statistics & Wings</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Flats *</Label>
              <Input
                type="number"
                value={formData.totalFlats}
                onChange={(e) => handleChange("totalFlats", Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Residents *</Label>
              <Input
                type="number"
                value={formData.totalResidents}
                onChange={(e) => handleChange("totalResidents", Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Occupied Flats *</Label>
              <Input
                type="number"
                value={formData.occupiedFlats}
                onChange={(e) => handleChange("occupiedFlats", Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Vacant Flats *</Label>
              <Input
                type="number"
                value={formData.vacantFlats}
                onChange={(e) => handleChange("vacantFlats", Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl border bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base">Wings</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddWing}>
                <Plus className="size-4 mr-1" /> Add Wing
              </Button>
            </div>

            {wings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No wings added. Click "Add Wing" to create one.
              </p>
            ) : (
              <div className="space-y-3">
                {wings.map((wing, index) => (
                  <div key={wing.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Wing Name (e.g. A)"
                        value={wing.name}
                        onChange={(e) => updateWing(wing.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Flats"
                        value={wing.totalFlats}
                        onChange={(e) => updateWing(wing.id, "totalFlats", Number(e.target.value))}
                        min={0}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => removeWing(wing.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amenities Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Amenities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {AMENITIES_LIST.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={amenities.includes(amenity)}
                onCheckedChange={() => handleAmenityToggle(amenity)}
              />
              <label
                htmlFor={`amenity-${amenity}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {amenity}
              </label>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 max-w-sm pt-2">
          <Input
            placeholder="Other Amenity..."
            value={otherAmenity}
            onChange={(e) => setOtherAmenity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOtherAmenity())}
          />
          <Button type="button" variant="secondary" onClick={handleAddOtherAmenity}>
            Add
          </Button>
        </div>

        {/* Custom Added Amenities */}
        <div className="flex flex-wrap gap-2 pt-2">
          {amenities
            .filter((a) => !AMENITIES_LIST.includes(a))
            .map((a) => (
              <div
                key={a}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
              >
                {a}
                <button
                  type="button"
                  onClick={() => handleAmenityToggle(a)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="About this society..."
          className="h-24"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
        {!isEdit && (
          <Button type="button" variant="ghost" className="mr-auto" onClick={handleReset}>
            Reset Form
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleCancelClick}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {isEdit ? "Update Society" : "Save Society"}
        </Button>
      </div>
    </div>
  );
}
