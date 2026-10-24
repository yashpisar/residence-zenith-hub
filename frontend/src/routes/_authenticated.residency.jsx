import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Landmark,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Home,
  Users,
  LayoutGrid,
  Layers,
  BadgeCheck,
  ChevronRight,
  Sparkles,
  Edit3,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { societyApi } from "@/services/api";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/residency")({
  component: Page,
});

// ─── Helper components ─────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color = "text-foreground" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/8 px-5 py-5 text-center">
      <span className={`text-3xl font-extrabold ${color}`}>{value ?? "—"}</span>
      <span className="mt-1 text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Page() {
  const { user } = useAuth();
  const { selectedSociety } = useSociety();
  const [society, setSociety] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = selectedSociety?._id || selectedSociety?.id || user?.societyId;
      if (!targetId) throw new Error("No society linked to your account.");

      const [socRes, statsRes] = await Promise.all([
        societyApi.getById(targetId),
        societyApi.getStats(targetId),
      ]);

      setSociety(socRes?.data || socRes);
      setStats(statsRes?.data || statsRes);
    } catch (err) {
      setError(err?.message || "Failed to load society details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedSociety]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-400" />
        <p className="text-sm">Loading society details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const s = society || {};
  const amenities = Array.isArray(s.amenities) ? s.amenities : [];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        icon={Landmark}
        title="Residency Details"
        description="Complete information about your society — address, office timings, wings, and amenities."
        actions={
          isSecretary && (
            <Link to={`/societies/${s._id || s.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Society
              </Button>
            </Link>
          )
        }
      />

      {/* Cover Image */}
      {s.coverImage && (
        <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <img
            src={s.coverImage}
            alt={s.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-5 flex items-center gap-3">
            {s.logo && (
              <img
                src={s.logo}
                alt="logo"
                className="h-12 w-12 rounded-xl border-2 border-white/30 object-cover shadow-lg"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{s.name}</h2>
              <p className="text-sm text-white/70">{s.city}, {s.state}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock
          label="Total Flats"
          value={stats?.totalFlats ?? s.totalFlats}
          color="text-blue-400"
        />
        <StatBlock
          label="Occupied"
          value={stats?.occupiedFlats ?? s.occupiedFlats}
          color="text-emerald-400"
        />
        <StatBlock
          label="Vacant"
          value={stats?.vacantFlats ?? s.vacantFlats}
          color="text-slate-300"
        />
        <StatBlock
          label="Total Residents"
          value={stats?.totalResidents ?? s.totalResidents}
          color="text-teal-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Society Information */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Society Information</h3>
          </div>
          <div className="space-y-0">
            <InfoRow icon={BadgeCheck} label="Society Name" value={s.name} />
            <InfoRow icon={Layers} label="Registration Number" value={s.registrationNumber} />
            <InfoRow icon={LayoutGrid} label="Society Type" value={s.type} />
            <InfoRow icon={CheckCircle2} label="Status" value={s.status} />
            {s.description && (
              <div className="py-3 border-b border-white/5">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{s.description}</p>
              </div>
            )}
          </div>
        </SurfaceCard>

        {/* Location */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Location & Contact</h3>
          </div>
          <div className="space-y-0">
            <InfoRow icon={MapPin} label="Address" value={s.address} />
            <InfoRow icon={MapPin} label="City" value={s.city} />
            <InfoRow icon={MapPin} label="State" value={s.state} />
            <InfoRow icon={MapPin} label="PIN Code" value={s.pinCode} />
            <InfoRow icon={Clock} label="Office Timings" value={s.officeTiming} />
            <InfoRow icon={Phone} label="Emergency Contact" value={s.emergencyContact} />
          </div>
        </SurfaceCard>

        {/* Secretary Details */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Secretary Details</h3>
          </div>
          <div className="space-y-0">
            <InfoRow icon={Users} label="Secretary Name" value={s.secretaryName} />
            <InfoRow icon={Phone} label="Secretary Mobile" value={s.secretaryMobile} />
            <InfoRow icon={Mail} label="Secretary Email" value={s.secretaryEmail} />
          </div>
        </SurfaceCard>

        {/* Wings */}
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Wings & Floors</h3>
          </div>
          {Array.isArray(s.wings) && s.wings.length > 0 ? (
            <div className="space-y-2">
              {s.wings.map((wing, i) => (
                <div
                  key={wing.id || i}
                  className="flex items-center justify-between rounded-xl bg-white/5 border border-white/8 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 font-bold text-sm">
                      {wing.name}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Wing {wing.name}</p>
                      <p className="text-xs text-muted-foreground">{wing.totalFlats} flats</p>
                    </div>
                  </div>
                  <Link to="/flats">
                    <button className="flex items-center gap-1 rounded-lg border border-white/12 px-3 py-1.5 text-xs text-muted-foreground hover:text-teal-400 hover:border-teal-500/30 transition-colors">
                      View Flats <ChevronRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No wings configured.</p>
          )}
        </SurfaceCard>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Amenities ({amenities.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                {a}
              </span>
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Quick Links */}
      {isSecretary && (
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="h-5 w-5 text-teal-400" />
            <h3 className="font-semibold text-foreground">Quick Links</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "View All Flats", to: "/flats", icon: Building2, color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
              { label: "Residents", to: "/residents", icon: Users, color: "text-purple-400 bg-purple-500/10 border-purple-500/25" },
              { label: "Maintenance", to: "/maintenance", icon: Layers, color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
              { label: "Complaints", to: "/complaints", icon: AlertTriangle, color: "text-red-400 bg-red-500/10 border-red-500/25" },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to}>
                <button className={`w-full flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:scale-[1.03] hover:shadow-lg ${color}`}>
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
