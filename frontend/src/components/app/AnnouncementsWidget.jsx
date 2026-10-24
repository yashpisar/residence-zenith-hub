import { useState, useEffect } from "react";
import {
  Megaphone,
  RefreshCw,
  AlertTriangle,
  Calendar,
  ChevronRight,
  X,
  Tag,
  Users,
} from "lucide-react";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { communityApi } from "@/services/api";

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

const AUDIENCE_LABELS = {
  all: "All Members",
  residents: "Residents Only",
  staff: "Security Guards Only",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Detail Modal (read-only for non-secretaries) ────────────────────────────
function NoticeDetailModal({ notice, onClose }) {
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
          <h2 className="text-lg font-semibold text-foreground">Announcement</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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
          </div>

          <h3 className="text-xl font-bold text-foreground">{notice.title}</h3>

          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-sm text-foreground whitespace-pre-line">{notice.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Published</p>
              <p className="text-foreground mt-0.5">{formatDate(notice.publishedAt || notice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Audience</p>
              <p className="text-foreground mt-0.5">
                {AUDIENCE_LABELS[notice.targetAudience] || "All Members"}
              </p>
            </div>
            {notice.authorName && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Posted By</p>
                <p className="text-foreground mt-0.5">{notice.authorName}</p>
              </div>
            )}
          </div>

          {notice.attachments && notice.attachments.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Attachments</p>
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
          )}
        </div>

        <div className="flex justify-end p-5 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Widget ───────────────────────────────────────────────────────────────────
/**
 * AnnouncementsWidget
 * Fetches and shows the latest notices for the current user's role/society.
 * Can be dropped into any dashboard (resident, guard, etc.).
 *
 * Props:
 *   maxItems  – how many notices to display inline (default: 3)
 *   showLink  – whether to show a "View all" link (default: true)
 */
export function AnnouncementsWidget({ maxItems = 3, showLink = true }) {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    communityApi
      .getNotices()
      .then((res) => {
        if (!cancelled) {
          const data = res?.data ?? res ?? [];
          setNotices(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load announcements.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayed = notices.slice(0, maxItems);

  return (
    <>
      <SurfaceCard
        title={
          <span className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" />
            Society Announcements
          </span>
        }
        description="Latest notices from your society secretary"
        action={
          showLink && notices.length > maxItems ? (
            <a
              href="/announcements"
              className="text-xs text-primary hover:underline font-medium"
            >
              View all ({notices.length})
            </a>
          ) : null
        }
      >
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
            <RefreshCw className="size-4 animate-spin" />
            Loading announcements…
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-2 py-4 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {!isLoading && !error && notices.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Megaphone className="size-6 mx-auto mb-2 opacity-30" />
            No announcements yet.
          </div>
        )}

        {!isLoading && !error && displayed.length > 0 && (
          <ul className="divide-y divide-border">
            {displayed.map((n) => {
              const nId = n.id || n._id;
              const isHighPriority = n.priority === "High";
              return (
                <li
                  key={nId}
                  className="py-3 cursor-pointer hover:bg-muted/40 -mx-1 px-1 rounded-lg transition-colors group"
                  onClick={() => setSelected(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        {isHighPriority && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700 uppercase tracking-wide">
                            Urgent
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            CATEGORY_COLOURS[n.category] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {n.category || "General"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {n.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(n.publishedAt || n.createdAt)}
                        {n.authorName && ` · ${n.authorName}`}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SurfaceCard>

      {selected && (
        <NoticeDetailModal notice={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
