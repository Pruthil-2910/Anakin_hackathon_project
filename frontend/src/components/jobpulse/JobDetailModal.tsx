"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, MapPin, Building2, Briefcase, Clock, Coins, Star, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Posting } from "@/types";

interface Props {
  postingId: string | null;
  onClose: () => void;
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => Promise<void>;
}

export default function JobDetailModal({
  postingId,
  onClose,
  isSaved,
  onToggleSave,
}: Props) {
  const [posting, setPosting] = useState<Posting | null>(null);
  const [similar, setSimilar] = useState<Posting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!postingId) return;
    let cancelled = false;
    setIsLoading(true);
    setPosting(null);
    setSimilar([]);
    fetch(`/api/postings/detail?id=${encodeURIComponent(postingId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPosting(data.posting);
        setSimilar(data.similar ?? []);
      })
      .catch((err) => console.error("detail error", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postingId]);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!postingId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-hairline rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-hairline">
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="h-6 w-2/3 bg-hairline/40 rounded animate-pulse mb-2" />
            ) : (
              <h2 className="font-mono text-lg font-semibold text-foreground truncate">
                {posting?.title ?? "Loading…"}
              </h2>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {posting?.company && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" /> {posting.company}
                </span>
              )}
              {posting?.rawLocation && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {posting.rawLocation}
                </span>
              )}
              {posting?.categorySlug && (
                <Badge variant="outline" className="border-hairline text-muted-foreground font-mono text-[10px]">
                  {posting.categorySlug.replace("-jobs", "")}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scroll-dark flex-1 p-5">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-full bg-hairline/40 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-hairline/40 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-hairline/40 rounded animate-pulse" />
            </div>
          ) : posting ? (
            <div className="space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Work mode"
                  value={posting.remoteType}
                />
                <StatCard
                  icon={<Coins className="h-3.5 w-3.5" />}
                  label="Salary"
                  value={posting.salaryRaw ?? "Not listed"}
                  highlight={!!posting.salaryRaw}
                />
                <StatCard
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Work week"
                  value={
                    posting.workWeekScore
                      ? `${posting.workWeekScore}/100 · ${posting.workWeekLabel ?? ""}`
                      : "4-day week"
                  }
                  highlight={!!posting.workWeekScore}
                />
                <StatCard
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Region"
                  value={posting.region}
                />
              </div>

              {/* Skills */}
              {posting.skills.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Detected skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {posting.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded border border-hairline bg-bg font-mono text-xs text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  About this role
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  This is a{" "}
                  <span className="text-rising font-semibold">
                    {posting.remoteType}
                  </span>{" "}
                  {posting.title} position at{" "}
                  <span className="text-rising font-semibold">{posting.company ?? "the company"}</span>
                  , based in{" "}
                  <span className="text-foreground font-semibold">{posting.rawLocation}</span>. The role is sourced from{" "}
                  <a
                    href={posting.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rising underline hover:no-underline"
                  >
                    4dayweek.io
                  </a>{" "}
                  via the Anakin API.
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed mt-2">
                  All jobs on 4dayweek.io offer a 4-day workweek at 100% pay. This listing has a work-week score of{" "}
                  <span className="text-rising font-semibold">
                    {posting.workWeekScore ?? "N/A"}/100
                  </span>
                  {posting.workWeekLabel ? ` (${posting.workWeekLabel})` : ""}.
                  {posting.salaryRaw && (
                    <> Salary range: <span className="text-rising font-semibold">{posting.salaryRaw}</span>.</>
                  )}
                </p>
              </div>

              {/* Source / metadata */}
              <div className="rounded border border-hairline bg-bg/40 p-3 space-y-1.5">
                <DetailRow label="Source" value="4dayweek.io via Anakin API" />
                <DetailRow label="Category" value={posting.categorySlug} />
                <DetailRow label="External ID" value={posting.externalId} mono />
                <DetailRow
                  label="Listed at"
                  value={new Date(posting.postedDate).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </div>

              {/* Similar jobs */}
              {similar.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Similar jobs
                  </h3>
                  <div className="space-y-1">
                    {similar.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          // Trigger parent to swap to this posting
                          window.dispatchEvent(
                            new CustomEvent("jobpulse:openPosting", { detail: s.id }),
                          );
                        }}
                        className="w-full text-left p-2.5 rounded border border-hairline hover:border-rising/50 hover:bg-bg/40 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-sm text-foreground truncate">{s.title}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {s.company ?? "—"} · {s.region}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 font-mono text-sm text-muted-foreground">
              Job not found.
            </div>
          )}
        </div>

        {/* Footer actions */}
        {posting && (
          <div className="flex items-center gap-2 p-4 border-t border-hairline bg-bg/40">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleSave(posting.id)}
              className={`gap-1.5 ${
                isSaved(posting.id)
                  ? "border-rising text-rising"
                  : "border-hairline text-muted-foreground hover:text-rising hover:border-rising"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isSaved(posting.id) ? "fill-rising" : ""}`} />
              {isSaved(posting.id) ? "Saved" : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(posting.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  // ignore
                }
              }}
              className="gap-1.5 border-hairline text-muted-foreground hover:text-rising hover:border-rising"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share"}
            </Button>
            <a href={posting.applicationUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
              <Button size="sm" className="gap-1.5 bg-rising text-bg hover:bg-rising/90 font-mono">
                Apply on 4dayweek.io <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-hairline bg-bg/40 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <div
        className={`font-mono text-sm capitalize ${
          highlight ? "text-rising font-semibold" : "text-foreground"
        }`}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={`text-foreground truncate ${mono ? "font-mono text-[10px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
