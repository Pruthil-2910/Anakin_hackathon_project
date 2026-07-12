"use client";

import { useEffect, useState } from "react";
import { Sparkles, Star, ExternalLink, ChevronRight, TrendingUp, AlertCircle } from "lucide-react";
import type { Posting } from "@/types";

interface MatchBreakdown {
  skillsScore: number;
  roleScore: number;
  regionScore: number;
  remoteScore: number;
  salaryScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

interface MatchResult {
  posting: Posting;
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
}

interface Props {
  onOpenPosting: (id: string) => void;
  onOpenProfile: () => void;
  onToggleSave: (id: string) => Promise<void>;
  savedIds: Set<string>;
  isUserAuthed: boolean;
  onOpenAuth: () => void;
}

export default function MatchesView({
  onOpenPosting,
  onOpenProfile,
  onToggleSave,
  savedIds,
  isUserAuthed,
  onOpenAuth,
}: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    if (!isUserAuthed) {
      setIsLoading(false);
      return;
    }
    fetch("/api/matches?limit=30")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data.matches ?? []);
        // If top match score is very low, profile likely empty
        if (data.matches.length > 0 && data.matches[0].score < 30) {
          setHasProfile(false);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isUserAuthed]);

  if (!isUserAuthed) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-12 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h2 className="font-mono text-base text-foreground mb-1">Sign in to see your matches</h2>
        <p className="font-mono text-xs text-muted-foreground mb-4">
          We compute a personalized match score for every job based on your profile.
        </p>
        <button
          onClick={onOpenAuth}
          className="rounded bg-rising text-bg px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-rising/90 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-rising animate-pulse" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Computing your matches…
          </h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-hairline/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-12 text-center">
        <AlertCircle className="h-10 w-10 text-rising mx-auto mb-3" />
        <h2 className="font-mono text-base text-foreground mb-1">
          Fill out your profile for better matches
        </h2>
        <p className="font-mono text-xs text-muted-foreground mb-4 max-w-md mx-auto">
          Your profile is mostly empty. Add your skills, target role, and preferences to get
          meaningful match scores.
        </p>
        <button
          onClick={onOpenProfile}
          className="rounded bg-rising text-bg px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-rising/90 transition-colors"
        >
          Edit profile
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-12 text-center">
        <p className="font-mono text-sm text-muted-foreground">No matches found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface">
      <div className="flex items-center justify-between p-4 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Your Top Matches
          </h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {matches.length} ranked · top score {matches[0].score}/100
        </span>
      </div>

      <div className="divide-y divide-hairline">
        {matches.map((m, idx) => (
          <MatchRow
            key={m.posting.id}
            rank={idx + 1}
            match={m}
            onOpen={() => onOpenPosting(m.posting.id)}
            isSaved={savedIds.has(m.posting.id)}
            onToggleSave={() => onToggleSave(m.posting.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchRow({
  rank,
  match,
  onOpen,
  isSaved,
  onToggleSave,
}: {
  rank: number;
  match: MatchResult;
  onOpen: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const { posting, score, breakdown, reasons } = match;
  const scoreColor =
    score >= 70 ? "text-rising" : score >= 40 ? "text-rising/70" : "text-muted-foreground";

  return (
    <div
      onClick={onOpen}
      className="p-4 hover:bg-bg/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Rank + score */}
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="font-mono text-[10px] text-muted-foreground">#{rank}</span>
          <div className={`font-mono text-2xl font-bold ${scoreColor}`}>{score}</div>
          <span className="font-mono text-[9px] text-muted-foreground">/100</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-sm font-semibold text-foreground truncate group-hover:text-rising transition-colors">
                {posting.title}
              </h3>
              <div className="font-mono text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{posting.company ?? "—"}</span>
                <span>·</span>
                <span>{posting.region ?? "—"}</span>
                <span>·</span>
                <span className="capitalize">{posting.remoteType}</span>
                {posting.salaryRaw && (
                  <>
                    <span>·</span>
                    <span className="text-rising">{posting.salaryRaw}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className={`p-1.5 rounded transition-colors ${
                  isSaved
                    ? "text-rising"
                    : "text-muted-foreground hover:text-rising"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isSaved ? "fill-rising" : ""}`} />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Reasons */}
          <div className="mt-2 space-y-0.5">
            {reasons.slice(0, 3).map((r, i) => (
              <p key={i} className="font-sans text-xs text-foreground/80 flex items-start gap-1.5">
                <TrendingUp className="h-3 w-3 text-rising flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </p>
            ))}
          </div>

          {/* Breakdown bar */}
          <div className="mt-2 flex items-center gap-3">
            <BreakdownBar label="Skills" value={breakdown.skillsScore} />
            <BreakdownBar label="Role" value={breakdown.roleScore} />
            <BreakdownBar label="Region" value={breakdown.regionScore} />
            <BreakdownBar label="Remote" value={breakdown.remoteScore} />
            <BreakdownBar label="Salary" value={breakdown.salaryScore} />
          </div>

          {/* Matched skills */}
          {breakdown.matchedSkills.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[9px] text-muted-foreground uppercase">Matched:</span>
              {breakdown.matchedSkills.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="px-1.5 py-0.5 rounded border border-rising/40 bg-rising/10 font-mono text-[9px] text-rising"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-rising" : value >= 40 ? "bg-rising/60" : "bg-hairline";
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="h-1 w-8 bg-hairline rounded overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
