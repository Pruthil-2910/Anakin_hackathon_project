"use client";

import { useState } from "react";
import { X, Activity, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
  onAuthed: (user: { id: string; email: string; name: string | null }) => void;
}

export default function AuthModal({ onClose, onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      onAuthed(data.user);
      onClose();
    } catch (err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-hairline rounded-lg max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-rising/40 bg-rising/10">
              <Activity className="h-4 w-4 text-rising" />
            </div>
            <div>
              <h2 className="font-mono text-base font-semibold text-foreground">
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground">
                {mode === "signup"
                  ? "Save jobs and track your favorites"
                  : "Sign in to access your saved jobs"}
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
        <form onSubmit={submit} className="p-5 space-y-3">
          {mode === "signup" && (
            <Field
              icon={<User className="h-3.5 w-3.5" />}
              label="Name (optional)"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Ada Lovelace"
            />
          )}
          <Field
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
          />
          <Field
            icon={<Lock className="h-3.5 w-3.5" />}
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Min. 6 characters"
            required
          />

          {error && (
            <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rising text-bg hover:bg-rising/90 font-mono"
          >
            {isLoading
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-1">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-rising hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to JobPulse?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-rising hover:underline font-medium"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
          {label}
        </span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-rising focus:outline-none focus:ring-1 focus:ring-rising/40"
      />
    </div>
  );
}
