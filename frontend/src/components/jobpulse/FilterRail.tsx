"use client";

import { useEffect, useState } from "react";
import { Filter, MapPin, Briefcase, Building2, Cpu, Tag, X, Clock } from "lucide-react";
import { useFilterStore } from "@/lib/store/filters";

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

const REMOTE_TYPES = ["all", "remote", "hybrid", "onsite"];

const JOB_TYPES = ["all", "full-time", "part-time", "intern", "contract"];

const CATEGORIES = [
  "all",
  "engineering-jobs",
  "marketing-jobs",
  "design-jobs",
  "product-jobs",
  "data-jobs",
  "devops-jobs",
  "sales-jobs",
  "operations-jobs",
  "finance-jobs",
  "customer-support-jobs",
];

const COMMON_SKILLS = [
  "all", "python", "javascript", "typescript", "react", "node.js", "java",
  "go", "rust", "aws", "kubernetes", "graphql", "docker", "flutter",
  "elixir", "laravel", "php", "ruby", "swift",
];

export default function FilterRail() {
  const {
    region,
    roleFamily,
    remoteType,
    skill,
    category,
    jobType,
    setRegion,
    setRoleFamily,
    setRemoteType,
    setSkill,
    setCategory,
    setJobType,
  } = useFilterStore();

  const [regions, setRegions] = useState<string[]>([]);

  // Fetch live regions from postings (only show regions that actually have data)
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setRegions(data.regionsCovered ?? []))
      .catch(() => {});
  }, []);

  const hasActiveFilters =
    region !== "all" ||
    roleFamily !== "all" ||
    remoteType !== "all" ||
    skill !== "all" ||
    category !== "all" ||
    jobType !== "all";

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setRegion("all");
              setRoleFamily("all");
              setRemoteType("all");
              setSkill("all");
              setCategory("all");
              setJobType("all");
            }}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-rising transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <FilterGroup icon={<Tag className="h-3.5 w-3.5" />} label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-hairline bg-bg px-2 py-1.5 font-mono text-xs text-foreground focus:border-rising focus:outline-none capitalize"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c === "all" ? "All categories" : c.replace("-jobs", "")}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup icon={<MapPin className="h-3.5 w-3.5" />} label="Region">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full rounded border border-hairline bg-bg px-2 py-1.5 font-mono text-xs text-foreground focus:border-rising focus:outline-none"
        >
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup icon={<Briefcase className="h-3.5 w-3.5" />} label="Role family">
        <select
          value={roleFamily}
          onChange={(e) => setRoleFamily(e.target.value)}
          className="w-full rounded border border-hairline bg-bg px-2 py-1.5 font-mono text-xs text-foreground focus:border-rising focus:outline-none"
        >
          <option value="all">All roles</option>
          {ROLE_FAMILIES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup icon={<Building2 className="h-3.5 w-3.5" />} label="Work mode">
        <div className="grid grid-cols-2 gap-1">
          {REMOTE_TYPES.map((r) => (
            <button
              key={r}
              onClick={() => setRemoteType(r)}
              className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                remoteType === r
                  ? "border-rising bg-rising/15 text-rising"
                  : "border-hairline bg-bg text-muted-foreground hover:border-rising/40 hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup icon={<Clock className="h-3.5 w-3.5" />} label="Job type">
        <div className="grid grid-cols-2 gap-1">
          {JOB_TYPES.map((j) => (
            <button
              key={j}
              onClick={() => setJobType(j)}
              className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                jobType === j
                  ? "border-rising bg-rising/15 text-rising"
                  : "border-hairline bg-bg text-muted-foreground hover:border-rising/40 hover:text-foreground"
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup icon={<Cpu className="h-3.5 w-3.5" />} label="Skill">
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full rounded border border-hairline bg-bg px-2 py-1.5 font-mono text-xs text-foreground focus:border-rising focus:outline-none"
        >
          {COMMON_SKILLS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All skills" : s}
            </option>
          ))}
        </select>
      </FilterGroup>

      <div className="mt-auto pt-3 border-t border-hairline">
        <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
          Live data via Anakin API · 4dayweek.io
          <br />
          All jobs offer a 4-day workweek at 100% pay.
        </p>
      </div>
    </aside>
  );
}

function FilterGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
