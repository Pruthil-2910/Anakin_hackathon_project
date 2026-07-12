"use client";

import { useEffect, useState } from "react";
import { X, User as UserIcon, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface Profile {
  name: string | null;
  email: string;
  headline: string | null;
  bio: string | null;
  skills: string[];
  experienceYears: number | null;
  currentRole: string | null;
  targetRole: string | null;
  preferredRegions: string[];
  preferredRemoteType: string | null;
  salaryExpectationMin: number | null;
  salaryCurrency: string | null;
}

const ROLE_FAMILIES = [
  "Backend Engineer",
  "Frontend Engineer",
  "Fullstack Engineer",
  "ML/AI Engineer",
  "Data Engineer",
  "DevOps/SRE",
  "Mobile Engineer",
  "QA Engineer",
  "Product/Program Manager",
  "Designer",
  "Engineering Manager",
  "Architect",
  "Marketing",
  "Sales",
  "Operations",
];

const ALL_REGIONS = [
  "USA", "UK", "Canada", "Australia", "Germany", "France", "Netherlands",
  "Spain", "Italy", "Romania", "Poland", "Denmark", "Sweden", "Norway",
  "Finland", "Ireland", "Portugal", "Belgium", "Austria", "Switzerland",
  "China", "Japan", "Singapore", "India", "Philippines", "Brazil", "Mexico",
  "Argentina", "South Africa", "Nigeria", "Egypt", "Israel", "UAE",
  "Saudi Arabia", "Turkey", "Worldwide", "Europe", "Asia", "LATAM",
];

export default function ProfileModal({ onClose, onSaved }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function addSkill() {
    const s = skillInput.trim().toLowerCase();
    if (!s || !profile) return;
    if (!profile.skills.includes(s)) {
      update("skills", [...profile.skills, s]);
    }
    setSkillInput("");
  }

  function removeSkill(s: string) {
    if (!profile) return;
    update("skills", profile.skills.filter((x) => x !== s));
  }

  function toggleRegion(r: string) {
    if (!profile) return;
    if (profile.preferredRegions.includes(r)) {
      update("preferredRegions", profile.preferredRegions.filter((x) => x !== r));
    } else {
      update("preferredRegions", [...profile.preferredRegions, r]);
    }
  }

  async function save() {
    if (!profile) return;
    setIsSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-hairline rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-rising/40 bg-rising/10">
              <UserIcon className="h-4 w-4 text-rising" />
            </div>
            <div>
              <h2 className="font-mono text-base font-semibold text-foreground">
                Your Profile
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground">
                Powers semantic job matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scroll-dark flex-1 p-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-hairline/40 rounded animate-pulse" />
              ))}
            </div>
          ) : profile ? (
            <div className="space-y-5">
              {/* Section: Basic */}
              <Section title="Basic Info">
                <Field label="Full name">
                  <input
                    type="text"
                    value={profile.name ?? ""}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                  />
                </Field>
                <Field label="Headline" hint="e.g. 'Senior Frontend Engineer'">
                  <input
                    type="text"
                    value={profile.headline ?? ""}
                    onChange={(e) => update("headline", e.target.value)}
                    placeholder="Senior Frontend Engineer"
                    className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                  />
                </Field>
                <Field label="Bio">
                  <textarea
                    value={profile.bio ?? ""}
                    onChange={(e) => update("bio", e.target.value)}
                    rows={3}
                    placeholder="A short paragraph about your background..."
                    className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none resize-none"
                  />
                </Field>
              </Section>

              {/* Section: Career */}
              <Section title="Career">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Current role">
                    <input
                      type="text"
                      value={profile.currentRole ?? ""}
                      onChange={(e) => update("currentRole", e.target.value)}
                      placeholder="Frontend Engineer"
                      className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                    />
                  </Field>
                  <Field label="Years of experience">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={profile.experienceYears ?? ""}
                      onChange={(e) =>
                        update("experienceYears", e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder="5"
                      className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                    />
                  </Field>
                </div>
                <Field label="Target role family" hint="Used to match against posting categories">
                  <select
                    value={profile.targetRole ?? ""}
                    onChange={(e) => update("targetRole", e.target.value || null)}
                    className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                  >
                    <option value="">— Select —</option>
                    {ROLE_FAMILIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>

              {/* Section: Skills */}
              <Section title="Skills" hint="The single biggest signal for matching">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type a skill and press Enter (e.g. react, python)"
                    className="flex-1 rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    className="border-hairline"
                  >
                    Add
                  </Button>
                </div>
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rising/40 bg-rising/10 font-mono text-xs text-rising"
                      >
                        {s}
                        <button
                          onClick={() => removeSkill(s)}
                          className="text-rising/70 hover:text-rising"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {/* Section: Preferences */}
              <Section title="Job Preferences">
                <Field label="Preferred work mode">
                  <div className="grid grid-cols-3 gap-1">
                    {["remote", "hybrid", "onsite"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          update("preferredRemoteType", profile.preferredRemoteType === r ? null : r)
                        }
                        className={`rounded border px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                          profile.preferredRemoteType === r
                            ? "border-rising bg-rising/15 text-rising"
                            : "border-hairline text-muted-foreground hover:border-rising/40 hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Preferred regions" hint="Click to toggle — leave empty for 'any'">
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto scroll-dark p-1">
                    {ALL_REGIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRegion(r)}
                        className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                          profile.preferredRegions.includes(r)
                            ? "border-rising bg-rising/15 text-rising"
                            : "border-hairline text-muted-foreground hover:border-rising/40"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Min salary expectation">
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={profile.salaryExpectationMin ?? ""}
                      onChange={(e) =>
                        update(
                          "salaryExpectationMin",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      placeholder="140000"
                      className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                    />
                  </Field>
                  <Field label="Currency">
                    <select
                      value={profile.salaryCurrency ?? ""}
                      onChange={(e) => update("salaryCurrency", e.target.value || null)}
                      className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground focus:border-rising focus:outline-none"
                    >
                      <option value="">—</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </Field>
                </div>
              </Section>
            </div>
          ) : (
            <div className="text-center py-8 font-mono text-sm text-muted-foreground">
              Failed to load profile.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-hairline bg-bg/40">
          <span className="font-mono text-[10px] text-muted-foreground">
            All fields optional — but more info = better matches
          </span>
          <div className="flex items-center gap-2">
            {justSaved && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-rising">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
            <Button
              onClick={save}
              disabled={isSaving || !profile}
              className="gap-1.5 bg-rising text-bg hover:bg-rising/90 font-mono"
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-rising">
          {title}
        </h3>
        {hint && (
          <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {hint && <span className="text-muted-foreground/70 ml-1 normal-case tracking-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
