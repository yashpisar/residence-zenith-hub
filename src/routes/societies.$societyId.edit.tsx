import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SocietyForm } from "@/components/common/SocietyForm";
import { useSociety } from "@/contexts/SocietyContext";
import { PageHeader } from "@/components/app/PageHeader";
import { Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/societies/$societyId/edit")({
  component: EditSocietyPage,
});

function EditSocietyPage() {
  const { societyId } = Route.useParams();
  const { getSocietyById, updateSociety, deleteSociety } = useSociety();
  const navigate = useNavigate();

  const society = getSocietyById(societyId);

  if (!society) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-foreground">Society Not Found</h2>
        <p className="mt-2 text-muted-foreground">The society you are trying to edit does not exist.</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/select-society" })}>
          Back to Selection
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: any) => {
    updateSociety(societyId, data);
    navigate({ to: `/societies/${societyId}` });
  };

  const handleCancel = () => {
    navigate({ to: `/societies/${societyId}` });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${society.name}? This action cannot be undone.`)) {
      deleteSociety(societyId);
      navigate({ to: "/select-society" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <PageHeader 
            title={`Edit ${society.name}`} 
            description="Update society information and settings"
            icon={Building2}
          />
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 size-4" /> Delete Society
          </Button>
        </div>
        
        <div className="mt-8 bg-background border border-border shadow-sm rounded-2xl p-6 md:p-8">
          <SocietyForm 
            initialData={society}
            isEdit={true}
            onSubmit={handleUpdate} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </div>
  );
}
