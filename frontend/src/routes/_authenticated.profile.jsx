import { createFileRoute } from "@tanstack/react-router";
import { UserCircle, Camera, Save, Shield, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Havenly Estates" },
      {
        name: "description",
        content: "Your flat, family members, vehicles and contact preferences.",
      },
      { property: "og:title", content: "Profile — Havenly Estates" },
      {
        property: "og:description",
        content: "Your flat, family members, vehicles and contact preferences.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const role = user?.role || "resident";
  
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully");
  };

  return (
    <>
      <PageHeader
        icon={UserCircle}
        title="Profile"
        description="Your personal information and society details."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <SurfaceCard className="flex flex-col items-center p-6 text-center">
          <div className="relative mb-6">
            <div className="flex size-32 items-center justify-center rounded-full bg-primary/10 text-primary border-4 border-background shadow-xl">
              <UserCircle className="size-20" />
            </div>
            <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
              <Camera className="size-4" />
            </button>
          </div>
          
          <h2 className="text-xl font-bold">{user?.name || "Jane Doe"}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Shield className="size-4" />
            <span className="capitalize">{role}</span>
          </div>
          
          {role === "resident" && (
            <div className="mt-6 w-full rounded-lg bg-muted p-4 text-left">
              <div className="text-sm font-medium text-muted-foreground mb-1">Residence</div>
              <div className="font-semibold">Block A, Flat 402</div>
              <div className="text-sm text-muted-foreground mt-1">Havenly Estates</div>
            </div>
          )}
          
          {role === "secretary" && (
            <div className="mt-6 w-full rounded-lg bg-muted p-4 text-left">
              <div className="text-sm font-medium text-muted-foreground mb-1">Society</div>
              <div className="font-semibold">Havenly Estates</div>
              <div className="text-sm text-muted-foreground mt-1">Managing Committee</div>
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 size-4" />
                Edit
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-2 size-4" />
                Save Changes
              </Button>
            )}
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="Jane" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Doe" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user?.email || "jane@example.com"} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" disabled={!isEditing} />
              </div>
            </div>
            
            {role === "resident" && (
              <>
                <div className="my-6 h-px w-full bg-border" />
                <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="e_name">Contact Name</Label>
                    <Input id="e_name" defaultValue="John Doe" disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e_phone">Contact Phone</Label>
                    <Input id="e_phone" type="tel" defaultValue="+1 (555) 987-6543" disabled={!isEditing} />
                  </div>
                </div>
              </>
            )}
          </form>
        </SurfaceCard>
      </div>
    </>
  );
}
