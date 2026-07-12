"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Database, Star, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatsResponse } from "@/types";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Props {
  onOpenAuth: () => void;
  onOpenSavedJobs: () => void;
  onLogout: () => Promise<void>;
  authRefreshKey: number;
}

export default function Header({
  onOpenAuth,
  onOpenSavedJobs,
  onLogout,
  authRefreshKey,
}: Props) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [savedJobCount, setSavedJobCount] = useState(0);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      setSavedJobCount(data.savedJobCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser, authRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error(`stats ${res.status}`);
        const json = await res.json();
        if (!cancelled) setStats(json);
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    const id = setInterval(load, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const lastIngest = stats?.lastIngestion;
  const lastIngestStr = lastIngest?.finishedAt
    ? new Date(lastIngest.finishedAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "never";

  return (
    <header className="border-b border-hairline bg-bg">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-rising/40 bg-rising/10">
            <Activity className="h-5 w-5 text-rising" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-semibold tracking-tight text-foreground">
              JobPulse<span className="text-rising"> AI</span>
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Real-time 4-day-week job intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <Stat
            label="Postings"
            value={
              isLoading
                ? "—"
                : stats?.totalPostings.toLocaleString("en-IN") ?? "0"
            }
          />
          <Stat
            label="Categories"
            value={isLoading ? "—" : `${stats?.categories.length ?? 0}`}
          />
          <Stat label="Last sync" value={lastIngestStr} />

          <a
            href="https://anakin.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded border border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising transition-colors"
          >
            <Database className="h-3 w-3" /> Anakin
          </a>

          {user ? (
            <>
              <button
                onClick={onOpenSavedJobs}
                className="flex items-center gap-1.5 rounded border border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising transition-colors"
              >
                <Star className="h-3 w-3" />
                <span className="hidden sm:inline">Saved</span>
                <span className="bg-rising text-bg rounded-full px-1.5 text-[9px]">
                  {savedJobCount}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-foreground">
                  <UserIcon className="h-3.5 w-3.5 text-rising" />
                  <span className="font-mono hidden sm:inline">
                    {user.name ?? user.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded border border-hairline text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <Button
              onClick={onOpenAuth}
              size="sm"
              className="gap-1.5 bg-rising text-bg hover:bg-rising/90 font-mono"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}
