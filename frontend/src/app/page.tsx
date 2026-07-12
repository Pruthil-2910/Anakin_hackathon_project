"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import Header from "@/components/jobpulse/Header";
import TickerBanner from "@/components/jobpulse/TickerBanner";
import FilterRail from "@/components/jobpulse/FilterRail";
import SalaryHeatmap from "@/components/jobpulse/SalaryHeatmap";
import SkillTrendList from "@/components/jobpulse/SkillTrendList";
import PostingsTable from "@/components/jobpulse/PostingsTable";
import JobDetailModal from "@/components/jobpulse/JobDetailModal";
import AuthModal from "@/components/jobpulse/AuthModal";
import SavedJobsDrawer from "@/components/jobpulse/SavedJobsDrawer";
import ProfileModal from "@/components/jobpulse/ProfileModal";
import MatchesView from "@/components/jobpulse/MatchesView";
// Lazy-load the heavy ResumeBuilder + ChatWidget to keep initial bundle small
const ResumeBuilder = lazy(() => import("@/components/jobpulse/ResumeBuilder"));
const ChatWidget = lazy(() => import("@/components/jobpulse/ChatWidget"));
import Nav, { type View } from "@/components/jobpulse/Nav";
import type { User } from "@/types";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [openPostingId, setOpenPostingId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [authRefreshKey, setAuthRefreshKey] = useState(0);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  // Refresh user state
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      if (data.user) {
        const savedRes = await fetch("/api/saved-jobs");
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedIds(new Set((savedData.savedJobs ?? []).map((s: any) => s.posting.id)));
        }
      } else {
        setSavedIds(new Set());
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser, authRefreshKey]);

  // Listen for "open posting" events from similar-jobs clicks inside the modal
  useEffect(() => {
    function onOpen(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      setOpenPostingId(id);
    }
    window.addEventListener("jobpulse:openPosting", onOpen as EventListener);
    return () =>
      window.removeEventListener("jobpulse:openPosting", onOpen as EventListener);
  }, []);

  const toggleSave = useCallback(
    async (postingId: string) => {
      if (!user) {
        setAuthOpen(true);
        return;
      }
      if (savedIds.has(postingId)) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(postingId);
          return next;
        });
        await fetch(`/api/saved-jobs?postingId=${postingId}`, { method: "DELETE" });
      } else {
        setSavedIds((prev) => new Set(prev).add(postingId));
        await fetch("/api/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postingId }),
        });
      }
      setSavedRefreshKey((k) => k + 1);
      setAuthRefreshKey((k) => k + 1);
    },
    [user, savedIds],
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSavedIds(new Set());
    setView("dashboard");
    setAuthRefreshKey((k) => k + 1);
  }, []);

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <Header
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSavedJobs={() => setSavedOpen(true)}
        onLogout={handleLogout}
        authRefreshKey={authRefreshKey + profileRefreshKey}
      />
      <TickerBanner />

      {/* Secondary nav (under ticker) */}
      <div className="border-b border-hairline bg-bg/60 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Nav
          current={view}
          onChange={setView}
          user={user}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenChat={() => {}}
          savedCount={savedIds.size}
        />
        <div className="font-mono text-[10px] text-muted-foreground hidden sm:block">
          {view === "dashboard" && "Live job market signals from 4dayweek.io via Anakin API"}
          {view === "matches" && "Personalized match scores based on your profile"}
          {view === "resume" && "Build and download your resume — auto-saves as you type"}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 print:hidden">
        {view === "dashboard" && (
          <>
            {/* Top row: filters | heatmap | trend lists */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-4 mb-6">
              <FilterRail />
              <SalaryHeatmap />
              <SkillTrendList />
            </div>

            {/* Bottom: full-width postings table */}
            <PostingsTable
              isUserAuthed={!!user}
              onOpenPosting={setOpenPostingId}
              onOpenAuth={() => setAuthOpen(true)}
              savedIds={savedIds}
              onToggleSave={toggleSave}
              authRefreshKey={authRefreshKey}
            />
          </>
        )}

        {view === "matches" && (
          <MatchesView
            onOpenPosting={setOpenPostingId}
            onOpenProfile={() => setProfileOpen(true)}
            onToggleSave={toggleSave}
            savedIds={savedIds}
            isUserAuthed={!!user}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {view === "resume" && (
          <Suspense
            fallback={
              <div className="rounded-lg border border-hairline bg-surface p-12 text-center font-mono text-sm text-muted-foreground">
                Loading resume builder…
              </div>
            }
          >
            <ResumeBuilder />
          </Suspense>
        )}
      </div>

      {/* Print-only: when on resume view, show only the preview */}
      {view === "resume" && (
        <div className="hidden print:block">
          {/* ResumeBuilder's preview already handles print visibility */}
        </div>
      )}

      <footer className="border-t border-hairline bg-surface px-4 sm:px-6 py-3 mt-auto print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-mono text-[10px] text-muted-foreground">
            JobPulse AI · Built for Anakin Hackathon · Live data via Anakin API ·
            Source: 4dayweek.io
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">
            All jobs offer 4-day workweek at 100% pay
          </p>
        </div>
      </footer>

      {/* Floating chat widget (always available when authed) */}
      {user && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}

      {/* Modals */}
      {openPostingId && (
        <JobDetailModal
          postingId={openPostingId}
          onClose={() => setOpenPostingId(null)}
          isSaved={(id) => savedIds.has(id)}
          onToggleSave={toggleSave}
        />
      )}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthed={(u) => {
            setUser(u);
            setAuthRefreshKey((k) => k + 1);
          }}
        />
      )}

      {savedOpen && user && (
        <SavedJobsDrawer
          onClose={() => setSavedOpen(false)}
          onOpenPosting={(id) => setOpenPostingId(id)}
          onUnsave={toggleSave}
          refreshKey={savedRefreshKey}
        />
      )}

      {profileOpen && user && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onSaved={() => setProfileRefreshKey((k) => k + 1)}
        />
      )}
    </main>
  );
}
