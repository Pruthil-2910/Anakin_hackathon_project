"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Shield } from "lucide-react";

interface ChatMsg {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history on first open
  useEffect(() => {
    if (open && !historyLoaded) {
      fetch("/api/chat/history")
        .then((r) => (r.ok ? r.json() : { messages: [] }))
        .then((data) => {
          setMessages(
            data.messages.length > 0
              ? data.messages
              : [
                  {
                    role: "assistant",
                    content:
                      "Hi! I'm your JobPulse AI assistant. Ask me about skills in demand, salary ranges, where roles are located, or what kinds of 4-day-week jobs are available right now.",
                  },
                ],
          );
          setHistoryLoaded(true);
        })
        .catch(() => {
          setMessages([
            {
              role: "assistant",
              content: "Sign in to chat with me.",
            },
          ]);
          setHistoryLoaded(true);
        });
    }
  }, [open, historyLoaded]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error ?? "Failed to send"}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = [
    "What are the top 5 in-demand skills?",
    "Which regions have the most remote jobs?",
    "What's the typical salary range for backend engineers?",
    "How many engineering jobs are listed?",
  ];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-rising text-bg px-4 py-3 font-mono text-xs uppercase tracking-wider shadow-2xl hover:bg-rising/90 transition-all hover:scale-105"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI</span>
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-bg" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[420px] max-h-[600px] bg-surface border border-hairline rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-hairline bg-bg/40">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-rising/40 bg-rising/10">
                <Sparkles className="h-3.5 w-3.5 text-rising" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-semibold text-foreground">
                  JobPulse AI Assistant
                </h3>
                <p className="font-mono text-[9px] text-muted-foreground flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" /> Read-only · cannot delete data
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded hover:bg-hairline/40 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scroll-dark p-3 space-y-2 max-h-[400px]"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-rising text-bg"
                      : "bg-bg border border-hairline text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-bg border border-hairline rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Suggestion chips (show when few messages) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                  }}
                  className="rounded border border-hairline px-2 py-1 font-mono text-[9px] text-muted-foreground hover:border-rising hover:text-rising transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-hairline p-2 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about skills, salaries, regions…"
              className="flex-1 rounded border border-hairline bg-bg px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-rising focus:outline-none"
              disabled={isLoading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center rounded bg-rising text-bg p-2 hover:bg-rising/90 disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
