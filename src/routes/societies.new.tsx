import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SocietyForm } from "@/components/common/SocietyForm";
import { useSociety } from "@/contexts/SocietyContext";
import { PageHeader } from "@/components/app/PageHeader";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/societies/new")({
  component: AddSocietyPage,
});

function AddSocietyPage() {
  const { addSociety } = useSociety();
  const navigate = useNavigate();

  const handleSave = (data: any) => {
    addSociety(data);
    navigate({ to: "/select-society" });
  };

  const handleCancel = () => {
    navigate({ to: "/select-society" });
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader 
          title="Add New Society" 
          description="Create and register a new society in the platform"
          icon={Building2}
        />
        
        <div className="mt-8 bg-background border border-border shadow-sm rounded-2xl p-6 md:p-8">
          <SocietyForm 
            onSubmit={handleSave} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </div>
  );
}
