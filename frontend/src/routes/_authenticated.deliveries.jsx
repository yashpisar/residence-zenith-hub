import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  User,
  Truck,
  Download,
  RefreshCw,
  AlertTriangle,
  X,
  Camera,
  Upload,
  Check,
  Eye,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { communityApi, fileApi } from "@/services/api";
import { socketService } from "@/services/socket.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.startsWith("data:")) return fileUrl;
  if (fileUrl.startsWith("/api/v1/")) return `${API_BASE.replace("/api/v1", "")}${fileUrl}`;
  return `${API_BASE.replace("/api/v1", "")}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries – Harmony" },
      { name: "description", content: "Parcels held at the gate with resident pickup and handover logs." },
    ],
  }),
  component: DeliveriesPage,
});

const COURIER_COMPANIES = [
  "Amazon",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Blinkit",
  "Zepto",
  "BlueDart",
  "DTDC",
  "Delhivery",
  "FedEx",
  "DHL",
  "India Post",
  "Other",
];

const DELIVERY_TYPES = ["Parcel", "Food", "Grocery", "Documents", "Medicine", "Other"];

function DeliveriesPage() {
  const { user } = useAuth();
  const isGuard = user?.role === "security" || user?.role === "secretary" || user?.role === "superadmin";

  const [deliveries, setDeliveries] = useState([]);
  const [flats, setFlats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [handoverModalDelivery, setHandoverModalDelivery] = useState(null);
  const [handoverRecipient, setHandoverRecipient] = useState("");
  const [isHandingOver, setIsHandingOver] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await communityApi.getDeliveries(params);
      const list = res?.data ?? res ?? [];
      setDeliveries(Array.isArray(list) ? list : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load deliveries.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Load flats list for the registration modal
  useEffect(() => {
    communityApi.getFlats()
      .then((res) => {
        const list = res?.data ?? res ?? [];
        if (Array.isArray(list)) setFlats(list);
      })
      .catch(() => {});
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const handleRefresh = () => {
      fetchDeliveries();
    };
    socketService.on("delivery:received", handleRefresh);
    socketService.on("delivery:collected", handleRefresh);
    return () => {
      socketService.off("delivery:received", handleRefresh);
      socketService.off("delivery:collected", handleRefresh);
    };
  }, [fetchDeliveries]);

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!handoverModalDelivery) return;

    const dId = handoverModalDelivery.id || handoverModalDelivery._id;
    setIsHandingOver(true);
    try {
      await communityApi.collectDelivery(dId, {
        collectedBy: handoverRecipient.trim() || handoverModalDelivery.recipientName || "Resident",
      });
      toast.success("Parcel marked as handed over to resident.");
      setHandoverModalDelivery(null);
      setHandoverRecipient("");
      fetchDeliveries();
    } catch (err) {
      toast.error(err.message || "Failed to record handover.");
    } finally {
      setIsHandingOver(false);
    }
  };

  const exportExcel = () => {
    if (deliveries.length === 0) {
      toast.error("No deliveries to export.");
      return;
    }
    const rows = deliveries.map((d) => ({
      ID: d.id || d._id,
      Courier: d.courierCompany,
      Flat: d.flat || `${d.wing || ""}-${d.flatNumber || ""}`,
      Recipient: d.recipientName,
      Type: d.deliveryType || "Parcel",
      TrackingNumber: d.trackingNumber || "—",
      Arrived: d.receivedAt ? new Date(d.receivedAt).toLocaleString() : "—",
      Status: d.status,
      HandedOverTo: d.collectedBy || "—",
      HandoverTime: d.collectedAt ? new Date(d.collectedAt).toLocaleString() : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deliveries");
    XLSX.writeFile(wb, "Deliveries_Log.xlsx");
    toast.success("Excel report exported.");
  };

  const exportPDF = () => {
    if (deliveries.length === 0) {
      toast.error("No deliveries to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Delivery Register - Harmony Society", 14, 15);
    const tableData = deliveries.map((d) => [
      d.id ? d.id.slice(-6) : "—",
      d.courierCompany,
      d.flat || `${d.wing || ""}-${d.flatNumber || ""}`,
      d.recipientName,
      d.trackingNumber || "—",
      d.status,
      d.receivedAt ? new Date(d.receivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    ]);

    doc.autoTable({
      head: [["ID", "Courier", "Flat", "Recipient", "Tracking #", "Status", "Arrived"]],
      body: tableData,
      startY: 20,
    });

    doc.save("Deliveries_Report.pdf");
    toast.success("PDF report exported.");
  };

  // Metrics
  const totalWaiting = deliveries.filter((d) => d.status === "Waiting for Pickup").length;
  const totalCollected = deliveries.filter((d) => d.status === "Collected").length;

  return (
    <>
      <PageHeader
        icon={Package}
        title="Delivery Management"
        description="Gate parcel holding, courier tracking, and resident handover logs."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDeliveries} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <Download className="mr-2 size-4" /> Excel
            </Button>
            {isGuard && (
              <Button size="sm" onClick={() => setShowRecordModal(true)} className="font-semibold">
                <Plus className="mr-1.5 size-4" /> Record Delivery
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            index={0}
            label="Total Deliveries Logged"
            value={deliveries.length}
            icon={Package}
            tone="primary"
          />
          <StatCard
            index={1}
            label="Waiting for Pickup"
            value={totalWaiting}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            index={2}
            label="Handed Over to Residents"
            value={totalCollected}
            icon={CheckCircle2}
            tone="success"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient, courier, flat, tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md bg-card"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Waiting for Pickup">Waiting for Pickup</SelectItem>
                <SelectItem value="Collected">Collected</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading deliveries from MongoDB…</span>
          </div>
        )}

        {/* Error state */}
        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchDeliveries}>
              <RefreshCw className="mr-2 size-4" /> Retry
            </Button>
          </div>
        )}

        {/* Deliveries Table */}
        {!isLoading && !fetchError && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Courier / Company</th>
                    <th className="px-6 py-4 font-semibold">Flat & Recipient</th>
                    <th className="px-6 py-4 font-semibold">Tracking #</th>
                    <th className="px-6 py-4 font-semibold">Arrived At</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.length > 0 ? (
                    deliveries.map((d) => {
                      const dId = d.id || d._id;
                      const isWaiting = d.status === "Waiting for Pickup";
                      const pkgPhoto = getFileUrl(d.packagePhoto);

                      return (
                        <tr
                          key={dId}
                          onClick={() => setSelectedDelivery(d)}
                          className="hover:bg-muted/30 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 font-bold overflow-hidden">
                                {pkgPhoto ? (
                                  <img src={pkgPhoto} alt="Package" className="size-full object-cover" />
                                ) : (
                                  <Truck className="size-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-foreground block group-hover:text-primary transition-colors">
                                  {d.courierCompany}
                                </span>
                                <span className="text-xs text-muted-foreground">{d.deliveryType || "Parcel"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                Flat {d.flat || `${d.wing || ""}-${d.flatNumber || ""}`}
                              </span>
                              <span className="text-xs text-muted-foreground">{d.recipientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-muted-foreground">
                              {d.trackingNumber || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className="text-foreground">{formatDate(d.receivedAt || d.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                                d.status === "Waiting for Pickup"
                                  ? "bg-amber-100 text-amber-700"
                                  : d.status === "Collected"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isWaiting && isGuard && (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                                  onClick={() => {
                                    setHandoverModalDelivery(d);
                                    setHandoverRecipient(d.recipientName || "");
                                  }}
                                >
                                  <Check className="size-3.5 mr-1" /> Handover
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => setSelectedDelivery(d)}
                              >
                                Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No delivery records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Delivery Modal */}
      {showRecordModal && (
        <RecordDeliveryModal
          flats={flats}
          onClose={() => setShowRecordModal(false)}
          onRecorded={(newDelivery) => {
            setDeliveries((prev) => [newDelivery, ...prev]);
            setShowRecordModal(false);
          }}
        />
      )}

      {/* Details Modal */}
      {selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
          onHandover={() => {
            setHandoverModalDelivery(selectedDelivery);
            setHandoverRecipient(selectedDelivery.recipientName || "");
            setSelectedDelivery(null);
          }}
        />
      )}

      {/* Handover Confirmation Modal */}
      {handoverModalDelivery && (
        <Dialog open={true} onOpenChange={() => setHandoverModalDelivery(null)}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Confirm Package Handover</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Mark package as collected by resident. This updates the status permanently in MongoDB.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleHandoverSubmit} className="space-y-4 pt-2">
              <div className="bg-muted/40 p-3 rounded-lg border border-border text-sm space-y-1">
                <p className="font-semibold text-foreground">
                  {handoverModalDelivery.courierCompany} Parcel
                </p>
                <p className="text-xs text-muted-foreground">
                  Flat {handoverModalDelivery.flat || `${handoverModalDelivery.wing}-${handoverModalDelivery.flatNumber}`} • Tracking #{handoverModalDelivery.trackingNumber || "None"}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Collected By (Recipient Name) <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={handoverRecipient}
                  onChange={(e) => setHandoverRecipient(e.target.value)}
                  placeholder="e.g. Resident Name / Self / Family Member"
                  className="bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setHandoverModalDelivery(null)}
                  disabled={isHandingOver}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isHandingOver} className="font-bold">
                  {isHandingOver ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" /> Recording…
                    </>
                  ) : (
                    <>
                      <Check className="size-4 mr-1.5" /> Confirm Handover
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ── Record Delivery Modal ────────────────────────────────────────────────────
function RecordDeliveryModal({ flats, onClose, onRecorded }) {
  const [selectedWing, setSelectedWing] = useState("A");
  const [selectedFlatNumber, setSelectedFlatNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [courierCompany, setCourierCompany] = useState(COURIER_COMPANIES[0]);
  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [parcelDetails, setParcelDetails] = useState("");
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState("");
  const [packagePhoto, setPackagePhoto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-fill recipient when flat selected
  const handleFlatChange = (wing, flatNum) => {
    setSelectedWing(wing);
    setSelectedFlatNumber(flatNum);
    const match = flats.find((f) => f.wing === wing && f.flatNumber === flatNum);
    if (match) {
      setRecipientName(match.residentName || match.ownerName || "");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackagePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlatNumber.trim()) {
      toast.error("Flat number is required.");
      return;
    }
    if (!courierCompany.trim()) {
      toast.error("Courier company is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = packagePhoto;
      if (finalPhotoUrl && finalPhotoUrl.startsWith("data:image/")) {
        try {
          const uploadRes = await fileApi.uploadBase64(finalPhotoUrl, `${courierCompany}_package.jpg`);
          finalPhotoUrl = uploadRes?.data?.fileUrl || uploadRes?.fileUrl || finalPhotoUrl;
        } catch {}
      }

      const payload = {
        wing: selectedWing,
        flatNumber: selectedFlatNumber.trim(),
        recipientName: recipientName.trim(),
        courierCompany: courierCompany.trim(),
        deliveryType,
        trackingNumber: trackingNumber.trim(),
        parcelDetails: parcelDetails.trim(),
        deliveryPersonName: deliveryPersonName.trim(),
        deliveryPersonPhone: deliveryPersonPhone.trim(),
        packagePhoto: finalPhotoUrl || "",
      };

      const res = await communityApi.createDelivery(payload);
      const saved = res?.data ?? res;
      toast.success("Delivery registered and saved to MongoDB!");
      onRecorded(saved);
    } catch (err) {
      toast.error(err.message || "Failed to record delivery.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wings = Array.from(new Set(flats.map((f) => f.wing))).filter(Boolean);
  if (!wings.includes("A")) wings.unshift("A");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" /> Record New Delivery
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Log incoming courier parcels, food, or deliveries at the gate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Courier & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Courier / Company <span className="text-destructive">*</span>
              </label>
              <select
                value={courierCompany}
                onChange={(e) => setCourierCompany(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/25"
              >
                {COURIER_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Delivery Type
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/25"
              >
                {DELIVERY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Flat & Recipient */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Flat <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedWing}
                  onChange={(e) => handleFlatChange(e.target.value, selectedFlatNumber)}
                  className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:ring-2 focus:ring-primary/25"
                >
                  {wings.map((w) => (
                    <option key={w} value={w}>W-{w}</option>
                  ))}
                </select>
                <Input
                  required
                  value={selectedFlatNumber}
                  onChange={(e) => handleFlatChange(selectedWing, e.target.value)}
                  placeholder="e.g. 101"
                  className="h-10 bg-background"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Recipient Name
              </label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Resident full name"
                className="h-10 bg-background"
              />
            </div>
          </div>

          {/* Tracking & Parcel details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Tracking / Waybill #
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Optional tracking code"
                className="h-10 bg-background font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Parcel Details
              </label>
              <Input
                value={parcelDetails}
                onChange={(e) => setParcelDetails(e.target.value)}
                placeholder="e.g. 1 Box, Flipkart envelope"
                className="h-10 bg-background"
              />
            </div>
          </div>

          {/* Delivery Person Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Delivery Agent Name
              </label>
              <Input
                value={deliveryPersonName}
                onChange={(e) => setDeliveryPersonName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="h-10 bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
                Agent Mobile Number
              </label>
              <Input
                value={deliveryPersonPhone}
                onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                placeholder="10-digit phone"
                className="h-10 bg-background"
              />
            </div>
          </div>

          {/* Package Photo Upload */}
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">
              Package Photo (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer bg-background/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {packagePhoto ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={packagePhoto} alt="Package" className="h-16 w-24 object-cover rounded-lg border border-border" />
                  <span className="text-xs text-primary font-medium hover:underline">Click to change photo</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="size-6 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">Click to upload or take parcel photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Package className="size-4 mr-1.5" /> Record Delivery
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delivery Details Modal ───────────────────────────────────────────────────
function DeliveryDetailsModal({ delivery, onClose, onHandover }) {
  if (!delivery) return null;
  const pkgPhoto = getFileUrl(delivery.packagePhoto);
  const personPhoto = getFileUrl(delivery.deliveryPersonPhoto);
  const isWaiting = delivery.status === "Waiting for Pickup";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Truck className="size-5 text-primary" /> {delivery.courierCompany}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {delivery.deliveryType || "Parcel"} • Tracking #{delivery.trackingNumber || "None"}
              </DialogDescription>
            </div>
            <StatusBadge value={delivery.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Flat & Recipient */}
          <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border text-sm">
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Destination Flat</p>
              <p className="font-bold text-foreground mt-0.5">
                Flat {delivery.flat || `${delivery.wing || ""}-${delivery.flatNumber || ""}`}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Recipient</p>
              <p className="font-bold text-foreground mt-0.5">{delivery.recipientName}</p>
            </div>
          </div>

          {/* Agent info */}
          {(delivery.deliveryPersonName || delivery.deliveryPersonPhone) && (
            <div className="p-3 bg-muted/20 rounded-xl border border-border text-xs space-y-1">
              <p className="font-semibold text-muted-foreground uppercase text-[10px]">Delivery Agent</p>
              <p className="text-foreground font-medium">
                {delivery.deliveryPersonName || "Agent"} {delivery.deliveryPersonPhone && `(${delivery.deliveryPersonPhone})`}
              </p>
            </div>
          )}

          {/* Time logs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Arrived At Gate</p>
              <p className="font-bold text-foreground mt-0.5">{formatDate(delivery.receivedAt || delivery.createdAt)}</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border border-border">
              <p className="text-muted-foreground font-semibold uppercase text-[10px]">Handed Over</p>
              <p className="font-bold text-foreground mt-0.5">
                {delivery.collectedAt ? formatDate(delivery.collectedAt) : "Pending Pickup"}
              </p>
              {delivery.collectedBy && (
                <p className="text-[11px] text-primary font-medium mt-0.5">To: {delivery.collectedBy}</p>
              )}
            </div>
          </div>

          {/* Photos */}
          {pkgPhoto && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Package Photo</p>
              <a href={pkgPhoto} target="_blank" rel="noopener noreferrer">
                <img
                  src={pkgPhoto}
                  alt="Package"
                  className="h-44 w-full object-cover rounded-xl border border-border hover:opacity-95 transition-opacity"
                />
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isWaiting && (
              <Button onClick={onHandover} className="font-bold">
                <Check className="size-4 mr-1.5" /> Handover to Resident
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
