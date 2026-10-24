import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Search,
  X,
  Users,
  Phone,
  Mail,
  ChevronRight,
  Home,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Save,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { communityApi } from "@/services/api";

export const Route = createFileRoute("/_authenticated/flats")({
  component: Page,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function occupancyColor(status) {
  switch (status) {
    case "Occupied": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "Vacant": return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    case "Under Maintenance": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

function occupancyIcon(status) {
  switch (status) {
    case "Occupied": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "Vacant": return <Home className="h-3.5 w-3.5" />;
    case "Under Maintenance": return <AlertTriangle className="h-3.5 w-3.5" />;
    default: return null;
  }
}

function StatBadge({ count, label, color }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border px-5 py-4 ${color}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="mt-0.5 text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}

// ─── Flat Detail Modal ─────────────────────────────────────────────────────────

const OCCUPANCY_STATUSES = ["Occupied", "Vacant", "Under Maintenance"];

function FlatDetailModal({ flat, onClose, onOccupancyUpdated }) {
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(flat?.occupancyStatus || "Vacant");
  const [saveMsg, setSaveMsg] = useState(null);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    if (flat) {
      setSelectedStatus(flat.occupancyStatus || "Vacant");
      setSaveMsg(null);
      setSaveErr(null);
    }
  }, [flat]);

  if (!flat) return null;

  const isDirty = selectedStatus !== flat.occupancyStatus;

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const res = await communityApi.updateFlatOccupancy(flat._id || flat.id, { occupancyStatus: selectedStatus });
      setSaveMsg(res?.message || `Flat marked as ${selectedStatus}`);
      onOccupancyUpdated({ ...(res?.data || flat), occupancyStatus: selectedStatus });
    } catch (err) {
      setSaveErr(err?.message || "Failed to update occupancy");
    } finally {
      setSaving(false);
    }
  };

  const residents = flat.residentIds || [];
  const owner = flat.ownerId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0F1923] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0F1923] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/30">
              <Building2 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">{flat.flatNumber}</h2>
              <p className="text-xs text-muted-foreground">Wing {flat.wing} · Floor {flat.floor}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Flat Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Flat Number", value: flat.flatNumber },
              { label: "Wing", value: `Wing ${flat.wing}` },
              { label: "Floor", value: `Floor ${flat.floor}` },
              { label: "Intercom", value: flat.intercomNumber || "Not assigned" },
              { label: "Owner Name", value: owner?.name || flat.ownerName || "—" },
              { label: "Owner Phone", value: owner?.phone || flat.ownerPhone || "—" },
              { label: "Owner Email", value: owner?.email || flat.ownerEmail || "—" },
              { label: "Maintenance (₹/mo)", value: flat.maintenanceAmount ? `₹${flat.maintenanceAmount.toLocaleString("en-IN")}` : "Not set" },
              { label: "Total Residents", value: flat.totalResidents ?? residents.length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-medium text-foreground truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Current Status Badge */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Current Status</p>
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${occupancyColor(flat.occupancyStatus)}`}>
              {occupancyIcon(flat.occupancyStatus)}
              {flat.occupancyStatus}
            </div>
          </div>

          {/* Residents List */}
          {residents.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Residents ({residents.length})</p>
              <div className="space-y-2">
                {residents.map((r, i) => (
                  <div key={r._id || i} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/8 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-sm font-bold">
                      {(r.name || "R")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.name || "Unknown"}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {r.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{r.email}</span>}
                        {r.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{r.phone}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{r.role || "resident"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Occupancy Update (Secretary only) */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Update Occupancy Status</p>
              <p className="text-xs text-muted-foreground">Changing occupancy affects maintenance records and society statistics.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {OCCUPANCY_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSelectedStatus(s); setSaveMsg(null); setSaveErr(null); }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedStatus === s
                      ? occupancyColor(s) + " ring-2 ring-offset-1 ring-offset-[#0F1923]"
                      : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground"
                  }`}
                >
                  {occupancyIcon(s)}
                  {s}
                </button>
              ))}
            </div>

            {saveMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {saveMsg}
              </div>
            )}
            {saveErr && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-2.5 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {saveErr}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Status"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Page() {
  const { user } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [wingFilter, setWingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [loadingFlatId, setLoadingFlatId] = useState(null);

  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (wingFilter !== "All") params.wing = wingFilter;
      if (statusFilter !== "All") params.status = statusFilter;
      const res = await communityApi.getFlats(params);
      setFlats(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.message || "Failed to load flats");
    } finally {
      setLoading(false);
    }
  }, [wingFilter, statusFilter]);

  useEffect(() => { fetchFlats(); }, [fetchFlats]);

  const wings = ["All", ...Array.from(new Set(flats.map((f) => f.wing))).sort()];

  const filtered = flats.filter((f) => {
    const term = searchTerm.toLowerCase();
    const name = (f.ownerName || f.residentIds?.[0]?.name || "").toLowerCase();
    const flatNum = (f.flatNumber || "").toLowerCase();
    const wing = (f.wing || "").toLowerCase();
    return !term || wing.includes(term) || flatNum.includes(term) || name.includes(term);
  });

  const stats = {
    total: flats.length,
    occupied: flats.filter((f) => f.occupancyStatus === "Occupied").length,
    vacant: flats.filter((f) => f.occupancyStatus === "Vacant").length,
    maintenance: flats.filter((f) => f.occupancyStatus === "Under Maintenance").length,
  };

  const openFlatDetail = async (flat) => {
    if (!isSecretary) return;
    setLoadingFlatId(flat._id || flat.id);
    try {
      const res = await communityApi.getFlatById(flat._id || flat.id);
      setSelectedFlat(res?.data || flat);
    } catch {
      setSelectedFlat(flat); // Fall back to list data
    } finally {
      setLoadingFlatId(null);
    }
  };

  const handleOccupancyUpdated = (updatedFlat) => {
    setFlats((prev) =>
      prev.map((f) =>
        (f._id || f.id) === (updatedFlat._id || updatedFlat.id) ? { ...f, ...updatedFlat } : f
      )
    );
    setSelectedFlat(updatedFlat);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Flats Overview"
        description="Occupancy status, owner info, and resident details for every flat in your society."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge count={stats.total} label="Total Flats" color="bg-blue-500/10 border-blue-500/25 text-blue-400" />
        <StatBadge count={stats.occupied} label="Occupied" color="bg-emerald-500/10 border-emerald-500/25 text-emerald-400" />
        <StatBadge count={stats.vacant} label="Vacant" color="bg-slate-500/10 border-slate-500/25 text-slate-400" />
        <StatBadge count={stats.maintenance} label="Maintenance" color="bg-amber-500/10 border-amber-500/25 text-amber-400" />
      </div>

      <SurfaceCard className="p-4 sm:p-6">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by wing, flat number or occupant…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Wing filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {wings.map((w) => (
              <button
                key={w}
                onClick={() => setWingFilter(w)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  wingFilter === w
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground"
                }`}
              >
                {w === "All" ? "All Wings" : `Wing ${w}`}
              </button>
            ))}
          </div>

          {/* Occupancy filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {["All", "Occupied", "Vacant", "Under Maintenance"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  statusFilter === s
                    ? "bg-teal-600 text-white border-teal-600"
                    : "border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={fetchFlats} className="gap-2 flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading flats…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchFlats}>Retry</Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/8">
                <tr>
                  <th className="px-4 py-3 font-medium">Wing</th>
                  <th className="px-4 py-3 font-medium">Flat</th>
                  <th className="px-4 py-3 font-medium">Floor</th>
                  <th className="px-4 py-3 font-medium">Occupant / Owner</th>
                  <th className="px-4 py-3 font-medium">Residents</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isSecretary && <th className="px-4 py-3 font-medium">Details</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((flat) => {
                  const fid = flat._id || flat.id;
                  const isLoading = loadingFlatId === fid;
                  const occupantName =
                    flat.ownerName ||
                    flat.ownerId?.name ||
                    flat.residentIds?.[0]?.name ||
                    flat.residentName ||
                    null;

                  return (
                    <tr
                      key={fid}
                      onClick={() => isSecretary && openFlatDetail(flat)}
                      className={`transition-colors ${
                        isSecretary
                          ? "cursor-pointer hover:bg-teal-500/5 hover:border-teal-500/20"
                          : ""
                      } ${isLoading ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">{flat.wing}</td>
                      <td className="px-4 py-3 font-medium text-teal-400">{flat.flatNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">Floor {flat.floor}</td>
                      <td className="px-4 py-3">
                        {occupantName ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {occupantName[0].toUpperCase()}
                            </div>
                            <span className="text-foreground">{occupantName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {flat.totalResidents ?? (flat.residentIds?.length || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${occupancyColor(flat.occupancyStatus)}`}>
                          {occupancyIcon(flat.occupancyStatus)}
                          {flat.occupancyStatus || "Unknown"}
                        </span>
                      </td>
                      {isSecretary && (
                        <td className="px-4 py-3">
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin text-teal-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-teal-400" />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isSecretary ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 opacity-30" />
                        <p>No flats found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground text-right">
            Showing {filtered.length} of {flats.length} flats
            {isSecretary && " · Click any row to view details & update status"}
          </p>
        )}
      </SurfaceCard>

      {/* Flat Detail Modal */}
      {selectedFlat && (
        <FlatDetailModal
          flat={selectedFlat}
          onClose={() => setSelectedFlat(null)}
          onOccupancyUpdated={handleOccupancyUpdated}
        />
      )}
    </div>
  );
}
