"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatStatus } from "@/frontend/shared";

// The scrolling transcript: user bubbles right (primary), assistant left (card).
// `notice` messages (graceful AI-unreachable fallbacks) render muted so they read
// as a system aside, not a real answer. A typing indicator trails while thinking.
export function Messages({
  messages,
  status,
}: {
  messages: ChatMessage[];
  status: ChatStatus;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, status]);

  return (
    // role=log + aria-live so screen readers announce each assistant reply as it
    // arrives (the transient "thinking" indicator keeps its own live region).
    <div
      className="flex flex-col gap-3 py-1"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            m.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] leading-6 sm:max-w-[75%]",
              m.role === "user"
                ? "bg-primary text-primary-foreground"
                : m.notice
                  ? "border border-dashed border-border bg-muted/30 text-muted-foreground"
                  : "border border-border bg-card text-foreground",
            )}
          >
            {m.content}
          </div>
        </div>
      ))}

      {status === "thinking" && (
        <div className="flex justify-start" aria-live="polite">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-3.5 py-3">
            <span className="sr-only">Asisten sedang mengetik…</span>
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
