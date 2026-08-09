import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSociety, Society } from "@/contexts/SocietyContext";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Shield, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/dashboard")({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { availableSocieties, deleteSociety } = useSociety();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredSocieties = availableSocieties.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.registrationNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) {
      deleteSociety(id);
      toast.success(`${name} has been deleted.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return "bg-green-500/10 text-green-600 border-green-500/20";
      case 'Under Maintenance': return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case 'Suspended': return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <>
      <PageHeader
        icon={Shield}
        title="Super Admin Control Panel"
        description="Global management of all registered societies."
        actions={
          <Button onClick={() => navigate({ to: "/societies/new" })} className="shadow-lg">
            <Plus className="mr-2 size-4" /> Register New Society
          </Button>
        }
      />

      <div className="mt-6">
        <SurfaceCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or registration number..."
                className="pl-9 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Total Societies: <span className="text-foreground">{availableSocieties.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Society</th>
                  <th className="px-6 py-4 font-semibold">Registration</th>
                  <th className="px-6 py-4 font-semibold">Secretary</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSocieties.map(society => (
                  <tr key={society.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={society.logo} alt="logo" className="size-10 rounded-lg object-cover border border-border" />
                        <div>
                          <p className="font-bold text-foreground">{society.name}</p>
                          <p className="text-xs text-muted-foreground">{society.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{society.registrationNumber}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{society.secretaryName}</p>
                      <p className="text-xs text-muted-foreground">{society.secretaryMobile}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(society.status)}`}>
                        {society.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate({ to: `/societies/${society.id}/edit` })}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {/* Manage Features */}}>
                          <Settings2 className="size-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(society.id, society.name)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSocieties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No societies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
