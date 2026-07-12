"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import type { SkillTrendsResponse } from "@/types";

export default function SkillTrendList() {
  const [data, setData] = useState<SkillTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/trends/skills?limit=12");
        if (!res.ok) throw new Error(`trends ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("trends error", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <TrendColumn
        title="Most In-Demand"
        subtitle="By mention volume"
        icon={<Flame className="h-4 w-4 text-rising" />}
        accentClass="text-rising"
        items={data?.rising ?? []}
        isLoading={isLoading}
      />
      <TrendColumn
        title="Emerging Skills"
        subtitle="Lower volume — watch these"
        icon={<Sparkles className="h-4 w-4 text-falling" />}
        accentClass="text-falling"
        items={data?.falling ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}

function TrendColumn({
  title,
  subtitle,
  icon,
  accentClass,
  items,
  isLoading,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  items: SkillTrendsResponse["rising"];
  isLoading: boolean;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
            {title}
          </h3>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {subtitle}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 rounded bg-hairline/40 animate-pulse"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="h-24 flex items-center justify-center font-mono text-xs text-muted-foreground">
          No data
        </div>
      ) : (
        <ol className="space-y-1">
          {items.map((item, idx) => (
            <li
              key={item.skill}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-bg/60 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-muted-foreground w-5 text-right">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-sm text-foreground truncate group-hover:text-rising transition-colors">
                  {item.skill}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {item.mentionCount}
                </span>
                <span className={`font-mono text-xs font-semibold ${accentClass} w-12 text-right`}>
                  {item.direction === "up" ? "+" : ""}
                  {item.pctChangeWow.toFixed(0)}%
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
