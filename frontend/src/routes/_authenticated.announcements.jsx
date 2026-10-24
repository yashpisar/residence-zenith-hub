import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Calendar,
  Users,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { communityApi } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements – Harmony" },
      { name: "description", content: "Manage and broadcast society announcements." },
    ],
  }),
  component: AnnouncementsPage,
});

// ── Category / Audience / Priority options ──────────────────────────────────
const CATEGORIES = ["General", "Maintenance", "Security", "Meeting", "Alert", "Community"];
const AUDIENCES = [
  { value: "all", label: "All Society Members" },
  { value: "residents", label: "Residents Only" },
  { value: "staff", label: "Security Guards Only" },
];
const PRIORITIES = ["Low", "Medium", "High"];

// Category → badge colour
const CATEGORY_COLOURS = {
  General: "bg-blue-100 text-blue-700",
  Maintenance: "bg-amber-100 text-amber-700",
  Security: "bg-red-100 text-red-700",
  Meeting: "bg-purple-100 text-purple-700",
  Alert: "bg-orange-100 text-orange-700",
  Community: "bg-green-100 text-green-700",
};

const PRIORITY_COLOURS = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-red-100 text-red-700",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Main Page ────────────────────────────────────────────────────────────────
function AnnouncementsPage() {
  const { user } = useAuth();
  const { activeSociety } = useSociety();

  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [deletingId, setDeletingId] = useState(null);

  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (categoryFilter && categoryFilter !== "All") params.category = categoryFilter;
      const res = await communityApi.getNotices(params);
      const data = res?.data ?? res ?? [];
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load announcements.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await communityApi.deleteNotice(id);
      toast.success("Announcement deleted.");
      setNotices((prev) => prev.filter((n) => n.id !== id && n._id !== id));
      if (selectedNotice && (selectedNotice.id === id || selectedNotice._id === id)) {
        setSelectedNotice(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        description={`Broadcast notices to your society — ${activeSociety?.name || "Harmony Society"}`}
        actions={
          isSecretary && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Button>
          )
        }
      />

      <div className="p-6 space-y-4">
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 pb-2">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Error / Empty */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading announcements…</span>
          </div>
        )}

        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchNotices}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !fetchError && notices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Megaphone className="size-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No announcements yet</p>
            <p className="text-sm text-muted-foreground">
              {isSecretary
                ? 'Click "New Announcement" to broadcast a notice to your society.'
                : "Your society secretary hasn't posted any announcements yet."}
            </p>
          </div>
        )}

        {/* Announcement cards */}
        {!isLoading && !fetchError && notices.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {notices.map((n) => {
              const nId = n.id || n._id;
              return (
                <SurfaceCard
                  key={nId}
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedNotice(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          CATEGORY_COLOURS[n.category] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {n.category || "General"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          PRIORITY_COLOURS[n.priority] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {n.priority || "Medium"}
                      </span>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                  </div>

                  <h3 className="mt-2 font-semibold text-foreground line-clamp-2">{n.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.description}</p>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(n.publishedAt || n.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <Users className="size-3 shrink-0" />
                      {AUDIENCES.find((a) => a.value === n.targetAudience)?.label || "All Members"}
                    </span>
                  </div>

                  {n.authorName && (
                    <p className="mt-1 text-xs text-muted-foreground">By: {n.authorName}</p>
                  )}

                  {isSecretary && (
                    <div className="mt-3 pt-3 border-t border-border flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                        disabled={deletingId === nId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(nId);
                        }}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        {deletingId === nId ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  )}
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          onDelete={isSecretary ? handleDelete : null}
          deletingId={deletingId}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNoticeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newNotice) => {
            setNotices((prev) => [newNotice, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </>
  );
}

// ── Notice Detail Modal ──────────────────────────────────────────────────────
function NoticeDetailModal({ notice, onClose, onDelete, deletingId }) {
  const nId = notice.id || notice._id;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Announcement Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                CATEGORY_COLOURS[notice.category] || "bg-gray-100 text-gray-600"
              }`}
            >
              <Tag className="inline size-3 mr-1" />
              {notice.category || "General"}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                PRIORITY_COLOURS[notice.priority] || "bg-gray-100 text-gray-600"
              }`}
            >
              Priority: {notice.priority || "Medium"}
            </span>
            <StatusBadge value={notice.status || "Published"} />
          </div>

          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-foreground">{notice.title}</h3>
          </div>

          {/* Description */}
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-sm text-foreground whitespace-pre-line">{notice.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Published</p>
              <p className="text-foreground mt-0.5">{formatDate(notice.publishedAt || notice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Audience</p>
              <p className="text-foreground mt-0.5">
                {AUDIENCES.find((a) => a.value === notice.targetAudience)?.label || "All Members"}
              </p>
            </div>
            {notice.authorName && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posted By</p>
                <p className="text-foreground mt-0.5">{notice.authorName}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Attachments</p>
              <div className="space-y-1">
                {notice.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    📎 {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {onDelete && (
          <div className="flex justify-end gap-2 p-5 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingId === nId}
              onClick={() => {
                onDelete(nId);
                onClose();
              }}
            >
              <Trash2 className="size-4 mr-1.5" />
              {deletingId === nId ? "Deleting…" : "Delete Announcement"}
            </Button>
          </div>
        )}
        {!onDelete && (
          <div className="flex justify-end p-5 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Notice Modal ──────────────────────────────────────────────────────
function CreateNoticeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "Medium",
    targetAudience: "all",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    return errs;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await communityApi.createNotice({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        targetAudience: form.targetAudience,
      });
      const saved = res?.data ?? res;
      toast.success("Announcement published successfully!");
      onCreated(saved);
    } catch (err) {
      toast.error(err.message || "Failed to publish announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">New Announcement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="e.g. Water supply interruption on Friday"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.title ? "border-destructive" : "border-border"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              placeholder="Full details of the announcement…"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${
                errors.description ? "border-destructive" : "border-border"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {form.description.length}/2000
            </p>
          </div>

          {/* Category + Priority in 2 columns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Target Audience</label>
            <div className="space-y-2">
              {AUDIENCES.map((a) => (
                <label key={a.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="targetAudience"
                    value={a.value}
                    checked={form.targetAudience === a.value}
                    onChange={() => handleChange("targetAudience", a.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {a.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Megaphone className="size-4 mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
