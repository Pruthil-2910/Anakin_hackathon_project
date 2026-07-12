"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";
import type { TickerResponse, TickerItem } from "@/types";

const POLL_INTERVAL_MS = 60 * 1000;

export default function TickerBanner() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) throw new Error(`ticker ${res.status}`);
        const data: TickerResponse = await res.json();
        if (cancelled) return;
        setItems(data.items);
        setGeneratedAt(data.generatedAt);
        setError(null);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="relative w-full border-b border-hairline bg-bg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-hairline/50 bg-surface/40">
        <div className="flex items-center gap-2">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-rising" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Live Skill Demand · 4-Day Week Jobs Worldwide
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 animate-pulse" /> Loading…
            </span>
          ) : error ? (
            <span className="text-destructive">offline</span>
          ) : (
            <span>
              {items.length} skills tracked · updated{" "}
              {generatedAt
                ? new Date(generatedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex gap-0 overflow-x-auto ticker-scroll"
          style={{
            animationPlayState: items.length === 0 ? "paused" : "running",
          }}
        >
          {[...items, ...items].map((item, idx) => (
            <TickerCell key={`${item.skill}-${idx}`} item={item} />
          ))}
          {items.length === 0 && !isLoading && (
            <div className="px-6 py-3 font-mono text-sm text-muted-foreground">
              No ticker data yet — run ingestion to populate.
            </div>
          )}
          {isLoading && (
            <div className="px-6 py-3 font-mono text-sm text-muted-foreground animate-pulse">
              Fetching live skill signals…
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg to-transparent" />
      </div>
    </div>
  );
}

function TickerCell({ item }: { item: TickerItem }) {
  const isUp = item.direction === "up";
  const pctStr = `${isUp ? "+" : ""}${item.pctChangeWow.toFixed(0)}%`;

  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-r border-hairline/60 whitespace-nowrap">
      <SplitFlapText
        text={item.skill.toUpperCase()}
        className="font-mono text-sm text-foreground"
      />
      <div
        className={`flex items-center gap-0.5 font-mono text-sm font-semibold ${
          isUp ? "text-rising" : "text-falling"
        }`}
      >
        {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <SplitFlapText text={pctStr} />
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">
        {item.mentionCount} jobs
      </span>
    </div>
  );
}

function SplitFlapText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const prevTextRef = useRef(text);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (prevTextRef.current !== text) {
      prevTextRef.current = text;
      setAnimateKey((k) => k + 1);
    }
  }, [text]);

  return (
    <span className={`inline-flex ${className}`}>
      {text.split("").map((ch, i) => (
        <span
          key={`${animateKey}-${i}`}
          className="splitflap-cell splitflap-flip inline-block"
          style={{ animationDelay: `${i * 0.025}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}
