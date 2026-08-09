import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSociety } from "@/contexts/SocietyContext";
import { 
  Building2, MapPin, Users, Phone, Clock, AlertCircle, 
  CheckCircle2, ShieldAlert, Wrench, ArrowRight, Activity 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from "recharts";

export const Route = createFileRoute("/societies/$societyId")({
  component: SocietyDetailsPage,
});

function SocietyDetailsPage() {
  const { societyId } = Route.useParams();
  const { availableSocieties, selectSociety } = useSociety();
  const navigate = useNavigate();

  const society = availableSocieties.find(s => s.id === societyId);

  if (!society) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Society Not Found</h1>
        <Button onClick={() => navigate({ to: "/select-society" })} className="mt-4">
          Back to Selection
        </Button>
      </div>
    );
  }

  const handleContinue = () => {
    selectSociety(society);
    navigate({ to: "/login" });
  };

  const getStatusBadge = () => {
    switch(society.status) {
      case 'Active': return <Badge className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle2 className="size-3 mr-1" /> Active</Badge>;
      case 'Under Maintenance': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white"><Wrench className="size-3 mr-1" /> Maintenance</Badge>;
      case 'Inactive': return <Badge variant="secondary" className="text-muted-foreground"><AlertCircle className="size-3 mr-1" /> Inactive</Badge>;
      case 'Suspended': return <Badge variant="destructive"><ShieldAlert className="size-3 mr-1" /> Suspended</Badge>;
    }
  };

  // Mock analytics data
  const chartData = [
    { name: 'Mon', visitors: 120, complaints: 12 },
    { name: 'Tue', visitors: 132, complaints: 8 },
    { name: 'Wed', visitors: 101, complaints: 15 },
    { name: 'Thu', visitors: 145, complaints: 5 },
    { name: 'Fri', visitors: 180, complaints: 18 },
    { name: 'Sat', visitors: 250, complaints: 25 },
    { name: 'Sun', visitors: 280, complaints: 10 },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Banner & Header */}
      <div className="relative h-64 md:h-80 w-full">
        <img src={society.coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute top-4 left-4 z-10">
          <Button variant="outline" className="bg-background/80 backdrop-blur-md hover:bg-background" onClick={() => navigate({ to: "/select-society" })}>
            Back to Selection
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-6">
            <div className="size-32 md:size-40 rounded-2xl bg-background p-2 shadow-xl border border-border shrink-0">
              <img src={society.logo} alt="Logo" className="size-full rounded-xl object-cover" />
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{society.name}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" /> {society.address}, {society.city}, {society.state} - {society.pinCode}
              </p>
            </div>
          </div>

          <div className="pb-2 w-full md:w-auto flex flex-col md:flex-row gap-3">
            <Button 
              variant="outline"
              size="lg" 
              className="w-full md:w-auto text-lg h-14 px-8" 
              onClick={() => navigate({ to: `/societies/${society.id}/edit` })}
            >
              <Wrench className="mr-2 size-5" /> Edit Society
            </Button>
            <Button 
              size="lg" 
              className="w-full md:w-auto shadow-lg hover:shadow-xl text-lg h-14 px-8" 
              onClick={handleContinue}
              disabled={society.status === 'Inactive' || society.status === 'Suspended'}
            >
              Continue to Login <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Info & Settings */}
          <div className="lg:col-span-1 space-y-8">
            <SurfaceCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Building2 className="text-primary size-5" /> Society Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Registration Number</p>
                  <p className="font-medium text-foreground">{society.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Secretary Name</p>
                  <p className="font-medium text-foreground">{society.secretaryName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Emergency Contact</p>
                  <p className="font-medium text-red-500 flex items-center gap-2">
                    <Phone className="size-4" /> {society.emergencyContact}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Office Timings</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" /> {society.officeTiming}
                  </p>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-2">
                <Users className="text-primary size-5" /> Scale & Capacity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <p className="text-2xl font-bold text-foreground">{society.wings.length}</p>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Total Wings</p>
                  <p className="text-xs text-muted-foreground mt-1">{society.wings.map(w => w.name).join(", ")}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <p className="text-2xl font-bold text-foreground">{society.totalFlats}</p>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Total Flats</p>
                </div>
                <div className="col-span-2 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{society.totalResidents}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 font-semibold uppercase">Total Residents</p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          {/* Right Column: Analytics & Amenities */}
          <div className="lg:col-span-2 space-y-8">
            <SurfaceCard className="p-6">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Activity className="text-primary size-5" /> Live Analytics Snapshot
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Occupied Flats", val: Math.floor(society.totalFlats * 0.85), color: "text-green-500" },
                  { label: "Vacant Flats", val: Math.ceil(society.totalFlats * 0.15), color: "text-amber-500" },
                  { label: "Security Staff", val: "12", color: "text-blue-500" },
                  { label: "Maint. Staff", val: "18", color: "text-purple-500" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="h-64 w-full">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Weekly Visitor & Complaint Flow</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <RechartsTooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="visitors" name="Visitors" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="complaints" name="Complaints" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-border pb-2">
                Premium Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {society.amenities.map(amenity => (
                  <Badge key={amenity} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </SurfaceCard>
          </div>
          
        </div>
      </div>
    </div>
  );
}
