import { createFileRoute } from "@tanstack/react-router";
import { Users, ThumbsUp, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { complaintApi } from "@/services/api";
import { ComplaintDetailsModal } from "@/components/complaints/ComplaintDetailsModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/public-complaints")({
  head: () => ({
    meta: [
      { title: "Public Complaints — Harmony" },
      { name: "description", content: "Community-wide issues raised by neighbours." },
    ],
  }),
  component: PublicComplaintsPage,
});

function PublicComplaintsPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchPublicComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await complaintApi.getPublic();
      const list = Array.isArray(res?.data) ? res.data : [];
      setIssues(list);
    } catch (err) {
      console.warn("[PublicComplaints] Fetch warning:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicComplaints();
  }, []);

  const toggleUpvote = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await complaintApi.toggleSupport(id);
      const data = res?.data || res;
      setIssues((prev) =>
        prev.map((item) =>
          (item._id === id || item.id === id)
            ? { ...item, upvoteCount: data.upvoteCount, hasUpvoted: data.hasUpvoted }
            : item
        )
      );
      toast.success(data.hasUpvoted ? "Complaint supported!" : "Support vote removed.");
    } catch (err) {
      toast.error(err.message || "Failed to update support vote.");
    }
  };

  return (
    <>
      <PageHeader
        icon={Users}
        title="Public Complaints"
        description="Community-wide issues raised by neighbours. Click any complaint to view full details."
      />
      <div className="p-6 grid gap-4 max-w-4xl">
        {issues.map((issue) => {
          const complaintId = issue.complaintNumber || issue.id || issue._id;
          const upvotes = issue.upvoteCount ?? (Array.isArray(issue.upvotes) ? issue.upvotes.length : 0);

          return (
            <SurfaceCard
              key={issue._id || issue.id}
              onClick={() => {
                setSelectedComplaint(issue);
                setIsDetailsOpen(true);
              }}
              className="p-5 flex gap-4 items-start cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md group"
            >
              <div className="flex flex-col items-center gap-1 min-w-[60px]" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant={issue.hasUpvoted ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-12 flex flex-col items-center justify-center p-1"
                  onClick={(e) => toggleUpvote(e, issue._id || issue.id)}
                >
                  <ThumbsUp className="h-4 w-4 mb-1" />
                  <span className="text-xs font-semibold">{upvotes}</span>
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                    {issue.title}
                  </h3>
                  <StatusBadge value={issue.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {issue.description || issue.desc}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-muted rounded-md font-medium text-foreground">
                      {issue.category}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-primary font-medium">{complaintId}</span>
                  </div>
                  <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    View details <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            </SurfaceCard>
          );
        })}

        {issues.length === 0 && !isLoading && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No public community complaints posted yet.
          </div>
        )}
      </div>

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        complaintId={selectedComplaint?._id || selectedComplaint?.id}
        initialData={selectedComplaint}
        onUpdated={fetchPublicComplaints}
        isSecretary={user?.role === "secretary"}
      />
    </>
  );
}
