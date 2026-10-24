import { createFileRoute } from "@tanstack/react-router";
import { Settings, Bell, Moon, Sun, Lock, Shield, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Havenly Estates" },
      { name: "description", content: "Notification channels, security, language and appearance." },
      { property: "og:title", content: "Settings — Havenly Estates" },
      {
        property: "og:description",
        content: "Notification channels, security, language and appearance.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const role = user?.role || "resident";

  return (
    <>
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Manage your account preferences and application settings."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_3fr]">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="justify-start">
            <Bell className="mr-2 size-4" />
            Notifications
          </Button>
          <Button variant="ghost" className="justify-start">
            <Lock className="mr-2 size-4" />
            Security
          </Button>
          <Button variant="ghost" className="justify-start">
            <Sun className="mr-2 size-4" />
            Appearance
          </Button>
          {role === "secretary" && (
            <Button variant="ghost" className="justify-start">
              <Shield className="mr-2 size-4" />
              Admin Preferences
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <SurfaceCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Bell className="mr-2 size-5 text-primary" />
              Notification Preferences
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive daily summaries and important updates via email.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get real-time alerts for messages and visitors on your device.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for emergency broadcasts only.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Sun className="mr-2 size-5 text-primary" />
              Theme Preference
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-primary bg-background p-4 text-primary">
                <Sun className="size-6" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-4 text-muted-foreground hover:bg-muted/50">
                <Moon className="size-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-4 text-muted-foreground hover:bg-muted/50">
                <Smartphone className="size-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold flex items-center">
              <Lock className="mr-2 size-5 text-primary" />
              Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your logged in devices</p>
                </div>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </>
  );
}
