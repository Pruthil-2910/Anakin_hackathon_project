"use client";

import { useEffect, useState } from "react";
import { Grid3x3, TrendingUp } from "lucide-react";
import type { SalaryHeatmapResponse } from "@/types";

export default function SalaryHeatmap() {
  const [data, setData] = useState<SalaryHeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/trends/salary-heatmap");
        if (!res.ok) throw new Error(`heatmap ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("heatmap error", err);
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

  const cellMap = new Map<string, SalaryHeatmapResponse["cells"][0]>();
  data?.cells.forEach((c) => cellMap.set(`${c.region}|${c.roleFamily}`, c));

  const allMins = data?.cells.map((c) => c.medianSalaryMin ?? 0) ?? [];
  const maxSalary = Math.max(...allMins, 1);

  function salaryColor(min: number | null | undefined): string {
    if (!min || min === 0) return "rgba(42, 49, 61, 0.4)";
    const intensity = Math.min(min / maxSalary, 1);
    const alpha = 0.15 + intensity * 0.75;
    return `rgba(242, 169, 59, ${alpha.toFixed(2)})`;
  }

  function formatSalary(amount: number | null | undefined, currency: string | null): string {
    if (!amount) return "—";
    // Convert to K notation: 140000 -> $140K, 32000 -> £32K
    const k = amount / 1000;
    const symbol =
      currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
    return `${symbol}${k.toFixed(0)}K`;
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Salary Heatmap
          </h2>
        </div>
        <div className="h-64 flex items-center justify-center font-mono text-sm text-muted-foreground animate-pulse">
          Loading salary data…
        </div>
      </div>
    );
  }

  if (!data || data.cells.length === 0) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Salary Heatmap
          </h2>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">
            No salary data yet.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground max-w-xs">
            Salaries appear here after ingestion finds postings with explicit
            salary ranges in their badges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4 text-rising" />
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Salary Heatmap
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Median annual · K notation
        </span>
      </div>

      <div className="overflow-x-auto scroll-dark">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Region
              </th>
              {data.roleFamilies.map((rf) => (
                <th
                  key={rf}
                  className="p-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground min-w-[110px]"
                >
                  {rf}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.regions.map((region) => (
              <tr key={region}>
                <td className="sticky left-0 z-10 bg-surface p-2 font-mono text-xs text-foreground whitespace-nowrap">
                  {region}
                </td>
                {data.roleFamilies.map((rf) => {
                  const cell = cellMap.get(`${region}|${rf}`);
                  const key = `${region}|${rf}`;
                  const isHovered = hoveredCell === key;
                  return (
                    <td
                      key={rf}
                      className="p-1"
                      onMouseEnter={() => setHoveredCell(key)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className="heatmap-cell relative rounded h-12 flex items-center justify-center cursor-default"
                        style={{
                          backgroundColor: salaryColor(cell?.medianSalaryMin),
                          border: isHovered ? "1px solid #F2A93B" : "1px solid transparent",
                        }}
                      >
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          {cell
                            ? formatSalary(cell.medianSalaryMin, null)
                            : "—"}
                        </span>
                        {cell && isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 px-2 py-1.5 rounded border border-hairline bg-bg shadow-xl whitespace-nowrap pointer-events-none">
                            <div className="font-mono text-[10px] text-foreground">
                              <span className="text-rising">{region}</span> · {rf}
                            </div>
                            <div className="font-mono text-[10px] text-foreground mt-0.5">
                              Range:{" "}
                              <span className="text-rising">
                                {formatSalary(cell.medianSalaryMin, null)}
                              </span>
                              {" – "}
                              <span className="text-rising">
                                {formatSalary(cell.medianSalaryMax, null)}
                              </span>
                            </div>
                            <div className="font-mono text-[9px] text-muted-foreground mt-0.5">
                              n={cell.sampleSize} postings
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Lower
          </span>
          <div
            className="h-2 w-32 rounded"
            style={{
              background:
                "linear-gradient(to right, rgba(242,169,59,0.15), rgba(242,169,59,0.9))",
            }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Higher
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          Week of{" "}
          {data.weekStart
            ? new Date(data.weekStart).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : "—"}
        </span>
      </div>
    </div>
  );
}
