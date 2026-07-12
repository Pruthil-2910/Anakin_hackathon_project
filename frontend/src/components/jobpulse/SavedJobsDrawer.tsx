"use client";

import { useEffect, useState } from "react";
import { X, Star, ExternalLink, Trash2, ChevronRight } from "lucide-react";
import type { Posting } from "@/types";

interface Props {
  onClose: () => void;
  onOpenPosting: (id: string) => void;
  onUnsave: (id: string) => Promise<void>;
  refreshKey: number;
}

export default function SavedJobsDrawer({
  onClose,
  onOpenPosting,
  onUnsave,
  refreshKey,
}: Props) {
  const [savedJobs, setSavedJobs] = useState<Array<{ id: string; savedAt: string; posting: Posting }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch("/api/saved-jobs")
      .then((r) => {
        if (!r.ok) throw new Error("not authed");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setSavedJobs(data.savedJobs ?? []);
      })
      .catch(() => {
        if (!cancelled) setSavedJobs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border-l border-hairline w-full max-w-md h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-rising fill-rising" />
            <h2 className="font-mono text-base font-semibold text-foreground">
              Saved Jobs
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              ({savedJobs.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto scroll-dark flex-1 p-3">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-hairline/40 animate-pulse" />
              ))}
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Star className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-mono text-sm text-muted-foreground">
                No saved jobs yet.
              </p>
              <p className="font-mono text-[10px] text-muted-foreground mt-1.5">
                Click the star on any job to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {savedJobs.map((s) => (
                <div
                  key={s.id}
                  className="rounded border border-hairline bg-bg/40 p-3 hover:border-rising/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        onOpenPosting(s.posting.id);
                        onClose();
                      }}
                      className="text-left min-w-0 flex-1"
                    >
                      <h3 className="font-sans text-sm text-foreground truncate hover:text-rising transition-colors">
                        {s.posting.title}
                      </h3>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {s.posting.company ?? "—"} · {s.posting.region}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        Saved{" "}
                        {new Date(s.savedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={s.posting.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-rising transition-colors"
                        title="Apply"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => onUnsave(s.posting.id)}
                        className="p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
