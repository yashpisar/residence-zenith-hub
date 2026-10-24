import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  ShieldCheck,
  UserPlus,
  Building2,
  Phone,
  Car,
  User,
  CheckCircle2,
  RefreshCw,
  Printer,
  X,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/guard/CameraCapture";
import { VisitorPass } from "@/components/guard/VisitorPass";
import { visitorApi, communityApi, fileApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/visitors/new")({
  head: () => ({
    meta: [
      { title: "Log New Visitor – Harmony" },
      { name: "description", content: "Register a gate visitor and save entry record to MongoDB." },
    ],
  }),
  component: NewVisitor,
});

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25";

const PURPOSES = ["Guest", "Delivery", "Domestic help", "Service", "Cab", "Maintenance", "Other"];
const ID_TYPES = ["None", "Aadhaar", "Driving License", "Voter ID", "PAN Card", "Work ID"];

function NewVisitor() {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [selectedWing, setSelectedWing] = useState("A");
  const [selectedFlatNumber, setSelectedFlatNumber] = useState("");
  const [residentInfo, setResidentInfo] = useState("");

  const [formData, setFormData] = useState({
    visitorName: "",
    phone: "",
    purpose: PURPOSES[0],
    vehicleNumber: "",
    numberOfVisitors: "1",
    idType: "None",
    idNumber: "",
    notes: "",
    photographUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedVisitor, setSubmittedVisitor] = useState(null);

  // Load flats for quick matching
  useEffect(() => {
    communityApi.getFlats()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setFlats(list);
          if (list.length > 0 && !selectedFlatNumber) {
            const first = list[0];
            setSelectedWing(first.wing || "A");
            setSelectedFlatNumber(first.flatNumber || "");
            setResidentInfo(first.residentName || first.ownerName || "");
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update resident info when wing or flat changes
  const handleFlatChange = (wing, flatNum) => {
    setSelectedWing(wing);
    setSelectedFlatNumber(flatNum);
    const match = flats.find((f) => f.wing === wing && f.flatNumber === flatNum);
    if (match) {
      setResidentInfo(match.residentName || match.ownerName || "Resident");
    } else {
      setResidentInfo("");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCapturePhoto = (photoData) => {
    setFormData((prev) => ({ ...prev, photographUrl: photoData }));
  };

  const handleRegister = async (immediateEntry = false) => {
    if (!formData.visitorName.trim()) {
      toast.error("Visitor full name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Visitor contact phone number is required.");
      return;
    }
    if (!selectedFlatNumber.trim()) {
      toast.error("Please specify which flat is being visited.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = formData.photographUrl;
      // If photo is captured as base64, save it through file upload
      if (finalPhotoUrl && finalPhotoUrl.startsWith("data:image/")) {
        try {
          const uploadRes = await fileApi.uploadBase64(finalPhotoUrl, `${formData.visitorName.replace(/\s+/g, "_")}_visitor.jpg`);
          finalPhotoUrl = uploadRes?.data?.fileUrl || uploadRes?.fileUrl || finalPhotoUrl;
        } catch {
          // If upload fails, backend saveBase64Image will still process it
        }
      }

      const payload = {
        visitorName: formData.visitorName.trim(),
        phone: formData.phone.trim(),
        purpose: formData.purpose,
        wing: selectedWing,
        flatNumber: selectedFlatNumber.trim(),
        vehicleNumber: formData.vehicleNumber.trim(),
        numberOfVisitors: Number(formData.numberOfVisitors) || 1,
        idType: formData.idType !== "None" ? formData.idType : "",
        idNumber: formData.idNumber.trim(),
        notes: formData.notes.trim(),
        photographUrl: finalPhotoUrl || "",
        immediateEntry,
      };

      const res = await visitorApi.register(payload);
      const savedVisitor = res?.data ?? res;

      toast.success(
        immediateEntry
          ? "Visitor checked in successfully! Entry logged to database."
          : `Approval request sent to Flat ${selectedWing}-${selectedFlatNumber}.`
      );

      setSubmittedVisitor({
        ...savedVisitor,
        id: savedVisitor.id || savedVisitor._id,
        visitorName: savedVisitor.visitorName || formData.visitorName,
        wing: selectedWing,
        flatNumber: selectedFlatNumber,
        purpose: formData.purpose,
      });
    } catch (err) {
      toast.error(err.message || "Failed to register visitor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedVisitor(null);
    setFormData({
      visitorName: "",
      phone: "",
      purpose: PURPOSES[0],
      vehicleNumber: "",
      numberOfVisitors: "1",
      idType: "None",
      idNumber: "",
      notes: "",
      photographUrl: "",
    });
  };

  // Unique wings from available flats
  const wings = Array.from(new Set(flats.map((f) => f.wing))).filter(Boolean);
  if (!wings.includes("A")) wings.unshift("A");

  return (
    <>
      <PageHeader
        icon={UserPlus}
        title="New visitor entry"
        description="Capture visitor details, log photo, and save entry record permanently to MongoDB."
        actions={
          submittedVisitor && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <UserPlus className="mr-2 size-4" /> Register Another Visitor
            </Button>
          )
        }
      />

      {submittedVisitor ? (
        <div className="py-6 space-y-6">
          <div className="max-w-md mx-auto text-center space-y-2">
            <div className="size-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Visitor Entry Recorded</h2>
            <p className="text-sm text-muted-foreground">
              Visitor record has been saved permanently to MongoDB. Gate pass generated below.
            </p>
          </div>

          <VisitorPass visitor={submittedVisitor} onClose={handleReset} />
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister(true);
          }}
          className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          {/* Left Column: Form Details */}
          <div className="space-y-5">
            <SurfaceCard title="Visitor Personal & Destination Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    value={formData.visitorName}
                    onChange={(e) => handleChange("visitorName", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Amit Shukla"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mobile Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    maxLength={15}
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={inputClass}
                    placeholder="10-digit mobile number"
                  />
                </div>

                {/* Flat destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Wing & Flat Number <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedWing}
                      onChange={(e) => handleFlatChange(e.target.value, selectedFlatNumber)}
                      className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/25"
                    >
                      {wings.map((w) => (
                        <option key={w} value={w}>
                          Wing {w}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      value={selectedFlatNumber}
                      onChange={(e) => handleFlatChange(selectedWing, e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 101, 202, B-704"
                    />
                  </div>
                  {residentInfo && (
                    <p className="text-xs text-primary font-medium">Resident: {residentInfo}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vehicle Number (Optional)
                  </label>
                  <input
                    value={formData.vehicleNumber}
                    onChange={(e) => handleChange("vehicleNumber", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. MH-12-AB-1234"
                  />
                </div>
              </div>

              {/* Purpose selector */}
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Purpose of visit
                </p>
                <div className="flex flex-wrap gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChange("purpose", p)}
                      className={cn(
                        "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all",
                        formData.purpose === p
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identification details */}
              <div className="mt-5 pt-4 border-t border-border grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfVisitors}
                    onChange={(e) => handleChange("numberOfVisitors", e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    ID Type
                  </label>
                  <select
                    value={formData.idType}
                    onChange={(e) => handleChange("idType", e.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/25"
                  >
                    {ID_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    ID Number
                  </label>
                  <input
                    value={formData.idNumber}
                    onChange={(e) => handleChange("idNumber", e.target.value)}
                    className={inputClass}
                    placeholder="ID card digits"
                    disabled={formData.idType === "None"}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes / Guard Remarks
                </label>
                <input
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className={inputClass}
                  placeholder="Optional security notes"
                />
              </div>
            </SurfaceCard>
          </div>

          {/* Right Column: Photo & Action Controls */}
          <div className="space-y-5">
            <SurfaceCard title="Visitor Photo Capture">
              <CameraCapture onCapture={handleCapturePhoto} label="Webcam or Photo Upload" />
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Photo is saved permanently to server storage and linked to MongoDB record.
              </p>
            </SurfaceCard>

            <SurfaceCard title="Entry Verification">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose whether to immediately check in verified visitors or request digital approval from the resident.
              </p>

              <div className="mt-4 space-y-2.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" /> Saving to MongoDB…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 mr-2" /> Allow Entry Immediately
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleRegister(false)}
                  className="w-full h-11 text-xs font-semibold"
                >
                  <ShieldCheck className="size-4 mr-2 text-primary" /> Send Approval Request to Resident
                </Button>
              </div>
            </SurfaceCard>
          </div>
        </form>
      )}
    </>
  );
}
