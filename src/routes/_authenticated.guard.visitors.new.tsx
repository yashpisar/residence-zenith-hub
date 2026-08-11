import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { UserPlus, User, Building2, Phone, Briefcase, Car, CalendarClock, Hash, FileText, MapPin, AlertTriangle } from "lucide-react";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CameraCapture } from "@/components/guard/CameraCapture";
import { VisitorPass } from "@/components/guard/VisitorPass";
import { motion, AnimatePresence } from "motion/react";

export const Route = createFileRoute("/_authenticated/guard/visitors/new")({
  component: NewVisitorRegistration,
});

// Mock frequent visitor database
const frequentVisitors: Record<string, any> = {
  "9876543210": {
    name: "Amazon Delivery",
    purpose: "Delivery",
    company: "Amazon",
    vehicleType: "2-Wheeler",
    vehicleNumber: "MH-12-AB-1234",
    idType: "Aadhaar",
  },
  "9988776655": {
    name: "John Doe",
    purpose: "Guest",
    blacklisted: true,
  }
};

function NewVisitorRegistration() {
  const { user } = useAuth();
  
  // The state structure requested
  const [formData, setFormData] = useState({
    visitorPhoto: "",
    idProofPhoto: "",
    visitorName: "",
    phoneNumber: "",
    email: "",
    gender: "Male",
    age: "",
    address: "",
    idType: "Aadhaar",
    idNumber: "",
    purpose: "Delivery",
    company: "",
    wing: "A",
    flatNumber: "",
    residentName: "",
    numberOfVisitors: "1",
    vehicleNumber: "",
    vehicleType: "None",
    expectedExitTime: "",
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "waiting" | "approved" | "rejected">("idle");
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [visitorId, setVisitorId] = useState("");

  // Auto-fill frequent visitors
  useEffect(() => {
    if (formData.phoneNumber.length === 10) {
      const match = frequentVisitors[formData.phoneNumber];
      if (match) {
        if (match.blacklisted) {
          setIsBlacklisted(true);
          toast.error("Warning: This visitor is blacklisted!");
        } else {
          setIsBlacklisted(false);
          setFormData(prev => ({
            ...prev,
            visitorName: match.name || prev.visitorName,
            purpose: match.purpose || prev.purpose,
            company: match.company || prev.company,
            vehicleType: match.vehicleType || prev.vehicleType,
            vehicleNumber: match.vehicleNumber || prev.vehicleNumber,
            idType: match.idType || prev.idType,
          }));
          toast.success("Frequent visitor details auto-filled.");
        }
      } else {
        setIsBlacklisted(false);
      }
    }
  }, [formData.phoneNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.flatNumber) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setStatus("waiting");
    
    // Emit approval request to the resident
    socketService.emit("visitor_approval_request", {
      ...formData,
      guardId: user?.id,
      timestamp: new Date().toISOString()
    });

    toast.info("Sent approval request to resident. Waiting for response...");

    // Listen for response
    const handleApproved = (data: any) => {
      if (data.visitorName === formData.visitorName || data.phoneNumber === formData.phoneNumber) {
        setStatus("approved");
        setVisitorId(data.visitorId || Math.random().toString(36).substr(2, 9));
        setIsSubmitting(false);
        cleanup();
        toast.success("Visitor Approved by Resident!");
      }
    };
    
    const handleRejected = (data: any) => {
      if (data.visitorName === formData.visitorName || data.phoneNumber === formData.phoneNumber) {
        setStatus("rejected");
        setIsSubmitting(false);
        cleanup();
        toast.error("Visitor Rejected by Resident!");
      }
    };

    const cleanup = () => {
      socketService.off("visitor_approved", handleApproved);
      socketService.off("visitor_rejected", handleRejected);
    };

    socketService.on("visitor_approved", handleApproved);
    socketService.on("visitor_rejected", handleRejected);

    // Timeout after 30 seconds
    setTimeout(() => {
      if (status === "waiting") {
        setIsSubmitting(false);
        setStatus("idle");
        cleanup();
        toast.error("Request timed out. Resident didn't respond.");
      }
    }, 30000);
  };

  const handleReset = () => {
    setFormData({
      visitorPhoto: "",
      idProofPhoto: "",
      visitorName: "",
      phoneNumber: "",
      email: "",
      gender: "Male",
      age: "",
      address: "",
      idType: "Aadhaar",
      idNumber: "",
      purpose: "Delivery",
      company: "",
      wing: "A",
      flatNumber: "",
      residentName: "",
      numberOfVisitors: "1",
      vehicleNumber: "",
      vehicleType: "None",
      expectedExitTime: "",
      remarks: "",
    });
    setStatus("idle");
    setIsBlacklisted(false);
    setShowPass(false);
  };

  if (showPass) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <VisitorPass 
          visitor={{
            id: visitorId,
            visitorName: formData.visitorName,
            visitorPhoto: formData.visitorPhoto,
            flatNumber: formData.flatNumber,
            wing: formData.wing,
            residentName: formData.residentName,
            purpose: formData.purpose,
            entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expectedExitTime: formData.expectedExitTime,
            vehicleNumber: formData.vehicleNumber
          }}
          onClose={handleReset}
        />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        icon={UserPlus}
        title="Register New Visitor"
        description="Comprehensive visitor logging with photo capture and resident approval."
      />

      <div className="mt-6 max-w-4xl mx-auto">
        <SurfaceCard className="p-0 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-border">
            
            {/* 1. Photos Section */}
            <div className="p-6 bg-muted/20">
              <h3 className="text-lg font-semibold mb-4">Identity & Proof</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <CameraCapture 
                  label="Visitor Photo (Live Capture)" 
                  onCapture={(src) => setFormData({...formData, visitorPhoto: src})} 
                />
                <CameraCapture 
                  label="ID Proof Photo" 
                  onCapture={(src) => setFormData({...formData, idProofPhoto: src})} 
                />
              </div>
            </div>

            {/* 2. Basic Info Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
              
              <AnimatePresence>
                {isBlacklisted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive flex items-center gap-3 text-destructive"
                  >
                    <AlertTriangle className="size-5 shrink-0" />
                    <p className="text-sm font-medium">This visitor has been blacklisted. Secretary override is required for entry.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="10-digit number"
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={formData.visitorName}
                      onChange={(e) => setFormData({...formData, visitorName: e.target.value})}
                      placeholder="Visitor Name"
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="input-field w-full"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Years"
                    className="input-field w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Govt ID Type</label>
                  <select
                    value={formData.idType}
                    onChange={(e) => setFormData({...formData, idType: e.target.value})}
                    className="input-field w-full"
                  >
                    <option>Aadhaar</option>
                    <option>PAN Card</option>
                    <option>Driving License</option>
                    <option>Voter ID</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Govt ID Number</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                    placeholder="ID Number"
                    className="input-field w-full"
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Location / City"
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Visit Details Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Visit Details</h3>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wing *</label>
                  <select
                    value={formData.wing}
                    onChange={(e) => setFormData({...formData, wing: e.target.value})}
                    className="input-field w-full"
                  >
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flat Number *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={formData.flatNumber}
                      onChange={(e) => setFormData({...formData, flatNumber: e.target.value})}
                      placeholder="e.g. 402"
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resident Name</label>
                  <input
                    type="text"
                    value={formData.residentName}
                    onChange={(e) => setFormData({...formData, residentName: e.target.value})}
                    placeholder="Optional"
                    className="input-field w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="input-field w-full"
                  >
                    <option>Delivery</option>
                    <option>Guest</option>
                    <option>Service</option>
                    <option>Staff</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company/Agency</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. Swiggy"
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visitor Count</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      min="1"
                      value={formData.numberOfVisitors}
                      onChange={(e) => setFormData({...formData, numberOfVisitors: e.target.value})}
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Vehicle Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Car className="size-5" /> Vehicle Details
              </h3>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="input-field w-full"
                  >
                    <option>None</option>
                    <option>2-Wheeler</option>
                    <option>4-Wheeler</option>
                    <option>Commercial</option>
                  </select>
                </div>
                {formData.vehicleType !== "None" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                      placeholder="e.g. MH-12-AB-1234"
                      className="input-field w-full"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Exit Time</label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="time"
                      value={formData.expectedExitTime}
                      onChange={(e) => setFormData({...formData, expectedExitTime: e.target.value})}
                      className="input-field pl-9 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Feedback & Submit */}
            <div className="p-6 bg-muted/10 border-t border-border">
              
              <AnimatePresence mode="wait">
                {status === "waiting" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20 mb-6"
                  >
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                      Waiting for Resident Approval for {formData.wing}-{formData.flatNumber}...
                    </p>
                  </motion.div>
                )}
                
                {status === "approved" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg bg-success/10 p-6 border border-success/30 mb-6 text-center"
                  >
                    <div className="mx-auto size-12 bg-success text-white rounded-full flex items-center justify-center mb-3">
                      <FileText className="size-6" />
                    </div>
                    <h4 className="text-lg font-bold text-success-foreground mb-1">Entry Approved</h4>
                    <p className="text-sm text-muted-foreground mb-4">Pass generated successfully. Hand over the pass to the visitor.</p>
                    <Button type="button" onClick={() => setShowPass(true)}>
                      View & Print Visitor Pass
                    </Button>
                  </motion.div>
                )}
                
                {status === "rejected" && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg bg-destructive/10 p-6 border border-destructive/30 mb-6 text-center"
                  >
                    <h4 className="text-lg font-bold text-destructive mb-1">Entry Denied</h4>
                    <p className="text-sm text-muted-foreground">The resident rejected this visitor request.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4">
                {status === "idle" ? (
                  <>
                    <Button type="button" variant="outline" onClick={handleReset} className="w-full">
                      Reset Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting || isBlacklisted} className="w-full shadow-lg">
                      Request Approval
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" onClick={handleReset} className="w-full">
                    Register Next Visitor
                  </Button>
                )}
              </div>
            </div>

          </form>
        </SurfaceCard>
      </div>

      <style>{`
        .input-field {
          display: flex;
          height: 2.5rem;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background-color: var(--background);
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          font-size: 0.875rem;
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        .input-field:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
          --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
          box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
          border-color: var(--ring);
        }
        .input-field.pl-9 {
          padding-left: 2.25rem;
        }
      `}</style>
    </>
  );
}
