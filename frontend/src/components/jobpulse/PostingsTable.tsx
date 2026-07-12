"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  ExternalLink,
} from "lucide-react";
import { useFilterStore } from "@/lib/store/filters";
import type { PostingsResponse, Posting } from "@/types";

interface Props {
  isUserAuthed: boolean;
  onOpenPosting: (id: string) => void;
  onOpenAuth: () => void;
  savedIds: Set<string>;
  onToggleSave: (id: string) => Promise<void>;
  authRefreshKey: number;
}

export default function PostingsTable({
  isUserAuthed,
  onOpenPosting,
  onOpenAuth,
  savedIds,
  onToggleSave,
}: Props) {
  const { region, roleFamily, remoteType, skill, category, jobType, page, pageSize, setPage } =
    useFilterStore();
  const [data, setData] = useState<PostingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (region !== "all") params.set("region", region);
      if (roleFamily !== "all") params.set("role_family", roleFamily);
      if (remoteType !== "all") params.set("remote_type", remoteType);
      if (skill !== "all") params.set("skill", skill);
      if (category !== "all") params.set("category", category);
      if (jobType !== "all") params.set("jobType", jobType);

      const res = await fetch(`/api/postings?${params}`);
      if (!res.ok) throw new Error(`postings ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("postings error", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, region, roleFamily, remoteType, skill, category, jobType]);

  useEffect(() => {
    load();
  }, [load]);

  function formatSalary(p: Posting): string {
    if (p.salaryRaw) return p.salaryRaw;
    if (!p.salaryMin && !p.salaryMax) return "—";
    const k = (n: number) => (n / 1000).toFixed(0);
    const sym = p.currency === "GBP" ? "£" : p.currency === "EUR" ? "€" : "$";
    if (p.salaryMin && p.salaryMax) return `${sym}${k(p.salaryMin)}K–${sym}${k(p.salaryMax)}K`;
    if (p.salaryMin) return `${sym}${k(p.salaryMin)}K+`;
    return `up to ${sym}${k(p.salaryMax!)}K`;
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  function handleRowClick(p: Posting) {
    onOpenPosting(p.id);
  }

  function handleStarClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!isUserAuthed) {
      onOpenAuth();
      return;
    }
    onToggleSave(id);
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface">
      <div className="flex items-center justify-between p-4 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Table2 className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Live Postings
          </h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {data ? `${data.total.toLocaleString("en-IN")} total` : "—"}
        </span>
      </div>

      <div className="overflow-x-auto scroll-dark">
        <table className="w-full">
          <thead className="bg-bg/40">
            <tr className="text-left">
              <th className="p-2.5 w-8"></th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Title
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Company
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Region
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Mode
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Type
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right">
                Salary
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Score
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Listed
              </th>
              <th className="p-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-2 font-mono text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading live postings…
                  </div>
                </td>
              </tr>
            ) : !data || data.data.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-8 text-center font-mono text-sm text-muted-foreground"
                >
                  No postings match these filters.
                </td>
              </tr>
            ) : (
              data.data.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => handleRowClick(p)}
                  className="border-t border-hairline hover:bg-bg/40 transition-colors cursor-pointer group"
                >
                  <td className="p-2.5 text-center">
                    <button
                      onClick={(e) => handleStarClick(e, p.id)}
                      className={`p-1 rounded transition-colors ${
                        savedIds.has(p.id)
                          ? "text-rising"
                          : "text-muted-foreground hover:text-rising"
                      }`}
                      title={isUserAuthed ? "Save job" : "Sign in to save"}
                    >
                      <Star className={`h-3.5 w-3.5 ${savedIds.has(p.id) ? "fill-rising" : ""}`} />
                    </button>
                  </td>
                  <td className="p-2.5 max-w-xs">
                    <div className="font-sans text-sm text-foreground truncate group-hover:text-rising transition-colors">
                      {p.title}
                    </div>
                  </td>
                  <td className="p-2.5 max-w-[160px]">
                    <span className="font-sans text-sm text-muted-foreground truncate block">
                      {p.company ?? "—"}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-mono text-xs text-foreground whitespace-nowrap">
                      {p.region ?? "—"}
                    </span>
                    <div className="font-mono text-[9px] text-muted-foreground">
                      {p.rawLocation}
                    </div>
                  </td>
                  <td className="p-2.5">
                    <RemoteBadge type={p.remoteType} />
                  </td>
                  <td className="p-2.5">
                    <JobTypeBadge type={p.jobType} />
                  </td>
                  <td className="p-2.5 text-right">
                    <span className="font-mono text-xs text-rising whitespace-nowrap">
                      {formatSalary(p)}
                    </span>
                  </td>
                  <td className="p-2.5">
                    {p.workWeekScore ? (
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-foreground">
                          {p.workWeekScore}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">
                          /100
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDate(p.postedDate)}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {p.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded border border-hairline font-mono text-[9px] text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                      {p.skills.length > 3 && (
                        <span className="px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                          +{p.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-hairline">
          <span className="font-mono text-[10px] text-muted-foreground">
            Page {page} of {data.total_pages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="flex items-center gap-1 rounded border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <button
              onClick={() => setPage(Math.min(data.total_pages, page + 1))}
              disabled={page === data.total_pages || isLoading}
              className="flex items-center gap-1 rounded border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RemoteBadge({ type }: { type: string }) {
  const t = type ?? "unknown";
  const styles: Record<string, string> = {
    remote: "border-rising/40 bg-rising/10 text-rising",
    hybrid: "border-falling/40 bg-falling/10 text-falling",
    onsite: "border-hairline text-muted-foreground",
    unknown: "border-hairline text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${styles[t] ?? styles.unknown}`}
    >
      {t}
    </span>
  );
}

function JobTypeBadge({ type }: { type: string }) {
  const t = type ?? "full-time";
  const styles: Record<string, string> = {
    "full-time": "border-hairline text-foreground",
    "part-time": "border-falling/40 text-falling",
    intern: "border-rising/40 bg-rising/15 text-rising",
    contract: "border-hairline text-muted-foreground",
  };
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${styles[t] ?? styles["full-time"]}`}
    >
      {t}
    </span>
  );
}
