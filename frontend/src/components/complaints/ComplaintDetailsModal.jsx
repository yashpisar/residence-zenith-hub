import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  UserPlus,
  ThumbsUp,
  Image as ImageIcon,
  ZoomIn,
  X,
  ShieldAlert,
  Wrench,
  Sparkles,
  ArrowLeft,
  FileText,
  MapPin,
  ExternalLink,
  UserMinus,
  Edit3,
  HardHat,
  Plus,
} from "lucide-react";
import { complaintApi, communityApi } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Resolve image URL whether relative (/api/v1/files/...) or absolute
function resolveImageUrl(url) {
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const backendBase = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
  if (url.startsWith("/api/v1/files/")) {
    return `${backendBase}${url}`;
  }
  if (url.startsWith("/")) {
    return `${backendBase}${url}`;
  }
  return `${backendBase}/api/v1/files/${url}`;
}

export function ComplaintDetailsModal({
  complaintId,
  initialData,
  isOpen,
  onClose,
  onUpdated,
  isSecretary = false,
  startInAssignMode = false,
}) {
  const { user } = useAuth();
  const effectiveIsSecretary =
    isSecretary ||
    user?.role === "secretary" ||
    user?.role === "superadmin";

  const [complaint, setComplaint] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null); // Lightbox zoom state
  const [lightboxError, setLightboxError] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [showQuickAddStaff, setShowQuickAddStaff] = useState(false);
  const [quickStaffForm, setQuickStaffForm] = useState({
    name: "",
    phone: "",
    role: "Plumber",
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const complaintSocietyId =
    complaint?.societyId?._id ||
    complaint?.societyId?.id ||
    complaint?.societyId ||
    initialData?.societyId?._id ||
    initialData?.societyId?.id ||
    initialData?.societyId ||
    initialData?.raw?.societyId?._id ||
    initialData?.raw?.societyId ||
    user?.societyId;

  // When complaintId changes or modal opens, fetch full populated complaint from database
  useEffect(() => {
    if (isOpen && (complaintId || initialData?.id || initialData?._id)) {
      const targetId = complaintId || initialData?.rawId || initialData?._id || initialData?.id;
      if (initialData) {
        setComplaint(initialData);
      }
      if (startInAssignMode) {
        setIsAssigning(true);
      }
      setIsLoading(true);
      complaintApi
        .getById(targetId)
        .then((res) => {
          const data = res?.data || res;
          if (data) {
            setComplaint(data);
            const currentStaffId = data?.assignedStaff?.staffId?._id || data?.assignedStaff?.staffId;
            if (currentStaffId) {
              setSelectedStaffId(String(currentStaffId));
            }
          }
        })
        .catch((err) => {
          console.warn("[ComplaintDetails] Could not fetch fresh details:", err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setComplaint(null);
      setIsAssigning(false);
      setShowQuickAddStaff(false);
      setActivePhoto(null);
      setLightboxError(false);
    }
  }, [isOpen, complaintId, initialData, startInAssignMode]);

  // Fetch registered society staff for Secretary
  useEffect(() => {
    if (isOpen && effectiveIsSecretary) {
      setIsLoadingStaff(true);
      const params = complaintSocietyId ? { societyId: complaintSocietyId.toString() } : {};
      communityApi
        .getStaff(params)
        .then((res) => {
          const data = res?.data || res || [];
          const list = Array.isArray(data) ? data : [];
          setStaffList(list);
          const currentStaffId =
            complaint?.assignedStaff?.staffId?._id ||
            complaint?.assignedStaff?.staffId;
          if (currentStaffId) {
            setSelectedStaffId(String(currentStaffId));
          } else if (list.length > 0) {
            setSelectedStaffId(String(list[0].id || list[0]._id));
          }
        })
        .catch((err) => {
          console.warn("[ComplaintDetails] Error fetching staff:", err.message);
        })
        .finally(() => {
          setIsLoadingStaff(false);
        });
    }
  }, [isOpen, effectiveIsSecretary, complaintSocietyId]);

  if (!isOpen) return null;

  const currentStatus = complaint?.status || "Pending";
  const priority = complaint?.priority || "Medium";
  const category = complaint?.category || "General";
  const ticketNumber = complaint?.complaintNumber || complaint?.id || "N/A";
  const title = complaint?.title || "Complaint Details";
  const description = complaint?.description || "No description provided.";
  const wing = complaint?.wing || complaint?.createdBy?.wing || "";
  const flatNumber = complaint?.flatNumber || complaint?.createdBy?.flatNumber || "";
  const flatDisplay = wing && flatNumber ? `Wing ${wing} - Flat ${flatNumber}` : flatNumber || "Not specified";
  const residentName = complaint?.createdBy?.name || complaint?.raisedBy || "Resident";
  const residentEmail = complaint?.createdBy?.email;
  const residentPhone = complaint?.createdBy?.phone;
  const residentAvatar = complaint?.createdBy?.avatarUrl;
  const societyName = complaint?.societyName || complaint?.societyId?.name || "";
  const createdAtFormatted = complaint?.createdAt
    ? new Date(complaint.createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Recently";

  const images = Array.isArray(complaint?.images)
    ? complaint.images
    : typeof complaint?.images === "string" && complaint.images
    ? [complaint.images]
    : [];

  const assignedStaff = complaint?.assignedStaff;
  const statusHistory = Array.isArray(complaint?.statusHistory) ? complaint.statusHistory : [];
  const upvotesCount = complaint?.upvoteCount ?? (Array.isArray(complaint?.upvotes) ? complaint.upvotes.length : 0);

  // Status Change Handler
  const handleStatusChange = async (newStatus) => {
    const targetId = complaint?._id || complaint?.id || complaintId;
    setIsUpdatingStatus(true);
    try {
      await complaintApi.updateStatus(targetId, { status: newStatus });
      toast.success(`Complaint marked as "${newStatus}"`);
      // Update local state
      setComplaint((prev) => ({
        ...prev,
        status: newStatus,
        statusHistory: [
          ...(prev?.statusHistory || []),
          {
            status: newStatus,
            changedAt: new Date(),
            notes: `Status updated to ${newStatus}`,
          },
        ],
      }));
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Staff Assignment Handler (saves to MongoDB and updates complaint)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast.error("Please select a staff member to assign");
      return;
    }

    const selectedStaff = staffList.find(
      (s) => String(s.id || s._id) === String(selectedStaffId)
    );
    if (!selectedStaff) {
      toast.error("Selected staff member not found in society directory");
      return;
    }

    const targetId = complaint?._id || complaint?.id || complaintId;
    setIsSubmittingStaff(true);
    try {
      const res = await complaintApi.assignStaff(targetId, {
        staffMemberId: String(selectedStaff.id || selectedStaff._id),
        societyId: complaintSocietyId ? String(complaintSocietyId) : undefined,
      });
      const updatedData = res?.data || res;
      toast.success(`Assigned to ${selectedStaff.name} (${selectedStaff.role})`);
      setComplaint((prev) => ({
        ...prev,
        status: prev?.status === "Pending" ? "In Progress" : prev?.status,
        assignedStaff: updatedData?.assignedStaff || {
          staffId: selectedStaff.id || selectedStaff._id,
          name: selectedStaff.name,
          phone: selectedStaff.phone,
          role: selectedStaff.role,
          assignedAt: new Date(),
        },
        statusHistory: updatedData?.statusHistory || [
          ...(prev?.statusHistory || []),
          {
            status: prev?.status === "Pending" ? "In Progress" : prev?.status,
            changedAt: new Date(),
            notes: `Assigned to ${selectedStaff.name} (${selectedStaff.role})`,
          },
        ],
      }));
      setIsAssigning(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to assign staff member");
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Staff Unassign Handler
  const handleUnassignSubmit = async () => {
    if (!window.confirm("Are you sure you want to remove the assigned staff member from this complaint?")) {
      return;
    }
    const targetId = complaint?._id || complaint?.id || complaintId;
    setIsSubmittingStaff(true);
    try {
      const res = await complaintApi.unassignStaff(targetId);
      const updatedData = res?.data || res;
      toast.success("Staff assignment removed successfully");
      setComplaint((prev) => ({
        ...prev,
        assignedStaff: null,
        statusHistory: updatedData?.statusHistory || [
          ...(prev?.statusHistory || []),
          {
            status: prev?.status,
            changedAt: new Date(),
            notes: "Staff assignment removed",
          },
        ],
      }));
      setSelectedStaffId("");
      setIsAssigning(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to remove staff assignment");
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Quick Add Staff Member (for societies with 0 staff or on-the-fly)
  const handleQuickAddStaff = async (e) => {
    e.preventDefault();
    if (!quickStaffForm.name.trim()) {
      toast.error("Staff name is required");
      return;
    }
    if (!quickStaffForm.phone.trim() || quickStaffForm.phone.trim().length < 8) {
      toast.error("Valid phone number is required");
      return;
    }

    setIsSubmittingStaff(true);
    try {
      const res = await communityApi.createStaff({
        name: quickStaffForm.name.trim(),
        phone: quickStaffForm.phone.trim(),
        role: quickStaffForm.role,
        shift: "General",
        status: "On Duty",
        societyId: complaintSocietyId ? String(complaintSocietyId) : undefined,
      });
      const newStaff = res?.data || res;
      toast.success(`${newStaff.name} added to staff list`);
      const newId = (newStaff.id || newStaff._id).toString();
      setStaffList((prev) => [...prev, newStaff]);
      setSelectedStaffId(newId);
      setShowQuickAddStaff(false);
      setQuickStaffForm({ name: "", phone: "", role: "Plumber" });
    } catch (err) {
      toast.error(err.message || "Failed to add staff member");
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-3xl overflow-hidden p-0 max-h-[90vh] flex flex-col bg-card border-border shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 sm:p-6 border-b border-border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {ticketNumber}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    {category}
                  </span>
                  {complaint?.isUrgent && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-destructive/15 text-destructive border border-destructive/20 flex items-center gap-1">
                      <ShieldAlert className="size-3" /> Urgent
                    </span>
                  )}
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground pt-1">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-0.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <span>Submitted {createdAtFormatted}</span>
                  {societyName && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground/80">{societyName}</span>
                    </>
                  )}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <StatusBadge value={priority} />
                <StatusBadge value={currentStatus} />
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Body */}
          <ScrollArea className="flex-1 p-5 sm:p-6">
            <div className="space-y-6">
              {/* Resident & Unit Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden text-primary font-bold">
                    {residentAvatar ? (
                      <img src={residentAvatar} alt={residentName} className="size-full object-cover" />
                    ) : (
                      residentName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reported By
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">{residentName}</p>
                    {residentPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="size-3" /> {residentPhone}
                      </p>
                    )}
                    {residentEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="size-3" /> {residentEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
                  <div className="size-11 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Location / Unit
                    </p>
                    <p className="text-sm font-bold text-foreground">{flatDisplay}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> {societyName || "Residential Complex"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" /> Full Complaint Description
                </h4>
                <div className="rounded-xl border border-border bg-background p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed shadow-xs">
                  {description}
                </div>
              </div>

              {/* Photo Evidence Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-primary" /> Photo Evidence
                  </h4>
                  {images.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {images.length} {images.length === 1 ? "photo attached" : "photos attached"}
                    </span>
                  )}
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {images.map((imgUrl, idx) => {
                      const resolvedUrl = resolveImageUrl(imgUrl);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActivePhoto(resolvedUrl);
                            setLightboxError(false);
                          }}
                          className="group relative rounded-xl border border-border overflow-hidden bg-muted cursor-pointer aspect-video flex items-center justify-center hover:border-primary/60 transition-all shadow-xs"
                        >
                          <img
                            src={resolvedUrl}
                            alt={`Complaint photo evidence ${idx + 1}`}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = "flex";
                              }
                            }}
                          />
                          {/* Fallback in case of broken image link */}
                          <div className="hidden flex-col items-center justify-center p-4 text-center text-muted-foreground text-xs pointer-events-none">
                            <AlertCircle className="size-6 mb-1 text-muted-foreground" />
                            <span>Image file unavailable</span>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-medium text-xs backdrop-blur-xs">
                            <ZoomIn className="size-4" /> Click to enlarge
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <ImageIcon className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">
                      No photo attached to this complaint.
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment & Management Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff Assignment Card */}
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="size-3.5 text-primary" /> Assigned Staff
                    </h4>
                    {effectiveIsSecretary && !isAssigning && (
                      <div className="flex items-center gap-1">
                        {assignedStaff?.name ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold text-primary px-2 hover:bg-primary/10"
                              onClick={() => {
                                setIsAssigning(true);
                                setShowQuickAddStaff(false);
                              }}
                            >
                              <Edit3 className="size-3 mr-1" /> Reassign
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-semibold text-destructive px-2 hover:bg-destructive/10"
                              onClick={handleUnassignSubmit}
                              disabled={isSubmittingStaff}
                            >
                              <UserMinus className="size-3 mr-1" /> Remove
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold text-primary px-2 hover:bg-primary/10"
                            onClick={() => {
                              setIsAssigning(true);
                              setShowQuickAddStaff(false);
                            }}
                          >
                            <UserPlus className="size-3.5 mr-1" /> Assign Staff
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {isAssigning ? (
                    showQuickAddStaff ? (
                      /* Quick Add Staff Form */
                      <form onSubmit={handleQuickAddStaff} className="space-y-2.5 pt-1 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-foreground">Add New Staff Member</span>
                          {staffList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowQuickAddStaff(false)}
                              className="text-[11px] text-primary hover:underline"
                            >
                              Back to list
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={quickStaffForm.name}
                            onChange={(e) => setQuickStaffForm({ ...quickStaffForm, name: e.target.value })}
                            placeholder="e.g. Ramesh Pawar"
                            className="mt-1 flex h-8 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Role *</label>
                            <select
                              value={quickStaffForm.role}
                              onChange={(e) => setQuickStaffForm({ ...quickStaffForm, role: e.target.value })}
                              className="mt-1 flex h-8 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                            >
                              <option value="Plumber">Plumber</option>
                              <option value="Electrician">Electrician</option>
                              <option value="Housekeeping">Housekeeping</option>
                              <option value="Security Guard">Security Guard</option>
                              <option value="Supervisor">Supervisor</option>
                              <option value="Gardener">Gardener</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-muted-foreground">Phone *</label>
                            <input
                              type="tel"
                              required
                              value={quickStaffForm.phone}
                              onChange={(e) => setQuickStaffForm({ ...quickStaffForm, phone: e.target.value })}
                              placeholder="e.g. 9823001122"
                              className="mt-1 flex h-8 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmittingStaff}
                            className="h-8 flex-1 text-xs font-semibold"
                          >
                            {isSubmittingStaff ? "Adding..." : "Add & Select"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                              if (staffList.length === 0) {
                                setIsAssigning(false);
                              } else {
                                setShowQuickAddStaff(false);
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : staffList.length === 0 ? (
                      /* Zero Staff Alert */
                      <div className="space-y-3 py-2 text-center border-t border-border/50">
                        <AlertCircle className="size-6 text-amber-500 mx-auto" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">No staff members found</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Please add a staff member first to assign them to complaints.
                          </p>
                        </div>
                        <div className="flex gap-2 justify-center pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowQuickAddStaff(true)}
                            className="h-7 text-xs font-semibold"
                          >
                            <Plus className="size-3 mr-1" /> Add Staff Member
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAssigning(false)}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Staff Selector Form */
                      <form onSubmit={handleAssignSubmit} className="space-y-3 pt-1 border-t border-border/50">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Select Available Staff Member *
                          </label>
                          <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            required
                            className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Choose a staff member --</option>
                            {staffList.map((s) => {
                              const sId = (s.id || s._id).toString();
                              return (
                                <option key={sId} value={sId}>
                                  {s.name} — {s.role} ({s.status || "On Duty"})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Selected Staff Details Card */}
                        {(() => {
                          const selected = staffList.find((s) => (s.id || s._id).toString() === selectedStaffId);
                          if (!selected) return null;
                          return (
                            <div className="rounded-lg border border-border/70 bg-background/60 p-2.5 space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-foreground">{selected.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold border border-primary/20">
                                  {selected.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Phone className="size-3 text-primary" /> {selected.phone || "No phone"}
                              </p>
                              <div className="flex items-center gap-2 pt-0.5 text-[10px] text-muted-foreground">
                                <span>Shift: {selected.shift || "General"}</span>
                                <span>•</span>
                                <span
                                  className={
                                    selected.status === "On Duty"
                                      ? "text-emerald-500 font-semibold"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {selected.status || "On Duty"}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <button
                            type="button"
                            onClick={() => setShowQuickAddStaff(true)}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Plus className="size-3" /> Add new staff member
                          </button>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!selectedStaffId || isSubmittingStaff}
                            className="h-8 flex-1 text-xs font-semibold"
                          >
                            {isSubmittingStaff ? "Assigning..." : assignedStaff?.name ? "Confirm Reassign" : "Confirm Assignment"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setIsAssigning(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )
                  ) : assignedStaff?.name ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm">{assignedStaff.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-semibold text-[11px] border border-border">
                          {assignedStaff.role || "Staff"}
                        </span>
                      </div>
                      {assignedStaff.phone && (
                        <p className="text-muted-foreground flex items-center gap-1.5 pt-0.5">
                          <Phone className="size-3 text-primary" />
                          <a href={`tel:${assignedStaff.phone}`} className="hover:underline text-foreground">
                            {assignedStaff.phone}
                          </a>
                        </p>
                      )}
                      {assignedStaff.assignedAt && (
                        <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                          <Clock className="size-3" /> Assigned on{" "}
                          {new Date(assignedStaff.assignedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-xs text-muted-foreground">
                      No staff member currently assigned.
                    </div>
                  )}
                </div>

                {/* Community & Stats Card */}
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" /> Community Support
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <ThumbsUp className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {upvotesCount} {upvotesCount === 1 ? "Upvote" : "Upvotes"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {complaint?.visibility === "public"
                          ? "Public issue visible to all residents"
                          : "Private ticket between resident & management"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {statusHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" /> Status History Log
                  </h4>
                  <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                    {statusHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs pb-2 border-b border-border/40 last:border-0 last:pb-0"
                      >
                        <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              Status set to "{hist.status}"
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {hist.changedAt ? new Date(hist.changedAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {hist.notes && (
                            <p className="text-muted-foreground mt-0.5 text-[11px]">{hist.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              <ArrowLeft className="size-3.5 mr-1.5" /> Back to List
            </Button>

            {/* Secretary Status Actions */}
            {effectiveIsSecretary && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentStatus !== "In Progress" && currentStatus !== "Resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("In Progress")}
                    className="text-xs font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 flex-1 sm:flex-initial"
                  >
                    <RefreshCcw className="size-3.5 mr-1" /> Mark In Progress
                  </Button>
                )}
                {currentStatus !== "Resolved" && (
                  <Button
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("Resolved")}
                    className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial shadow-sm"
                  >
                    <CheckCircle2 className="size-3.5 mr-1" /> Mark Resolved
                  </Button>
                )}
                {currentStatus === "Resolved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("Closed")}
                    className="text-xs font-semibold flex-1 sm:flex-initial"
                  >
                    Close Ticket
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Lightbox Zoom Modal */}
      {activePhoto && (
        <Dialog open={!!activePhoto} onOpenChange={() => { setActivePhoto(null); setLightboxError(false); }}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center">
            <div className="w-full flex justify-between items-center p-2 text-white/90">
              <span className="text-xs font-mono font-medium">
                Photo Evidence • {ticketNumber}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activePhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                  title="Open original file in new tab"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                <button
                  onClick={() => { setActivePhoto(null); setLightboxError(false); }}
                  className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="w-full min-h-[300px] max-h-[80vh] overflow-auto flex items-center justify-center p-2">
              {lightboxError ? (
                <div className="text-center p-8 text-white/70 space-y-2">
                  <AlertCircle className="size-10 mx-auto text-amber-400" />
                  <p className="text-sm font-medium text-white">Unable to display photo preview</p>
                  <p className="text-xs text-white/60">The image may have been moved, deleted, or cannot be loaded.</p>
                  <div className="pt-2">
                    <a
                      href={activePhoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline hover:text-primary/80"
                    >
                      Attempt direct browser download / open
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={activePhoto}
                  alt="Enlarged complaint evidence"
                  className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
                  onError={() => setLightboxError(true)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
