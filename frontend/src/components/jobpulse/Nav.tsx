"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Sparkles, FileText, MessageCircle, User as UserIcon } from "lucide-react";
import type { User } from "@/types";

export type View = "dashboard" | "matches" | "resume";

interface Props {
  current: View;
  onChange: (v: View) => void;
  user: User | null;
  onOpenProfile: () => void;
  onOpenChat: () => void;
  savedCount: number;
  matchCount?: number;
}

export default function Nav({
  current,
  onChange,
  user,
  onOpenProfile,
  onOpenChat,
  savedCount,
  matchCount,
}: Props) {
  return (
    <nav className="flex items-center gap-1">
      <NavButton
        active={current === "dashboard"}
        onClick={() => onChange("dashboard")}
        icon={<LayoutDashboard className="h-3.5 w-3.5" />}
        label="Dashboard"
      />
      <NavButton
        active={current === "matches"}
        onClick={() => onChange("matches")}
        icon={<Sparkles className="h-3.5 w-3.5" />}
        label="Matches"
        badge={user && matchCount ? matchCount : undefined}
        disabled={!user}
      />
      <NavButton
        active={current === "resume"}
        onClick={() => onChange("resume")}
        icon={<FileText className="h-3.5 w-3.5" />}
        label="Resume"
        disabled={!user}
      />
      {user && (
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 rounded border border-hairline px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-rising hover:text-rising transition-colors"
        >
          <UserIcon className="h-3 w-3" />
          <span className="hidden sm:inline">Profile</span>
        </button>
      )}
    </nav>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
        active
          ? "border-rising bg-rising/15 text-rising"
          : "border-hairline text-muted-foreground hover:border-rising/50 hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && (
        <span className="bg-rising text-bg rounded-full px-1.5 text-[9px]">
          {badge}
        </span>
      )}
    </button>
  );
}
