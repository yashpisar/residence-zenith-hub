import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSociety, Society } from "@/contexts/SocietyContext";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, Search, Edit2, Shield, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/superadmin/dashboard")({
  component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
  const { availableSocieties, addSociety, updateSociety, deleteSociety } = useSociety();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSociety, setEditingSociety] = useState<Society | null>(null);

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
          <Button onClick={() => setIsAddOpen(true)} className="shadow-lg">
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
                        <Button variant="outline" size="sm" onClick={() => setEditingSociety(society)}>
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

      <SocietyFormDialog 
        isOpen={isAddOpen || !!editingSociety} 
        onClose={() => { setIsAddOpen(false); setEditingSociety(null); }}
        society={editingSociety}
        onSave={(data) => {
          if (editingSociety) {
            updateSociety(editingSociety.id, data);
            toast.success("Society updated successfully.");
          } else {
            addSociety({ ...data, id: `SOC-${Math.random().toString(36).substr(2, 6).toUpperCase()}` } as Society);
            toast.success("New society registered successfully.");
          }
          setIsAddOpen(false);
          setEditingSociety(null);
        }}
      />
    </>
  );
}

// Society Form Component for Add/Edit
function SocietyFormDialog({ isOpen, onClose, society, onSave }: any) {
  const [formData, setFormData] = useState<Partial<Society>>(
    society || {
      name: "", registrationNumber: "", type: "Apartment", address: "", city: "", state: "", pinCode: "",
      secretaryName: "", secretaryMobile: "", secretaryEmail: "", officeTiming: "", emergencyContact: "",
      totalFlats: 0, wings: ["A"], status: "Active", amenities: ["Security Gate"]
    }
  );

  // Quick reset when society prop changes
  useState(() => {
    if (society) setFormData(society);
  });

  const handleImageUpload = (e: any, field: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="text-primary size-5" /> 
            {society ? "Edit Society" : "Register New Society"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold border-b border-border pb-2">Basic Info</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Society Name</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Registration No</label>
                  <Input required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Under Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PIN Code</label>
                  <Input required value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold border-b border-border pb-2">Administration</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secretary Name</label>
                <Input required value={formData.secretaryName} onChange={e => setFormData({...formData, secretaryName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secretary Mobile</label>
                  <Input required value={formData.secretaryMobile} onChange={e => setFormData({...formData, secretaryMobile: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Flats</label>
                  <Input required type="number" value={formData.totalFlats} onChange={e => setFormData({...formData, totalFlats: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h4 className="font-semibold border-b border-border pb-2">Branding</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo Image</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Input type="file" accept="image/*" className="text-xs" onChange={(e) => handleImageUpload(e, 'logo')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cover Banner</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <Input type="file" accept="image/*" className="text-xs" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <DialogFooter className="border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="shadow-lg">Save Society</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
