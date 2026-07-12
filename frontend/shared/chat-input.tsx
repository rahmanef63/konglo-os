"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useChat } from "./chat-context";
import { cn } from "@/lib/utils";
import { type Command, filterCommands } from "./chat-commands";
import { type Mention, filterMentions, useMentionSource } from "./chat-mentions";

type Trigger =
  | { type: "command"; query: string; start: number }
  | { type: "mention"; query: string; start: number };

// Parse the token at the caret: a "/" at the start of the current line opens the
// command menu; an "@" preceded by start/whitespace opens the mention menu. Both
// end at the first whitespace, so a completed token closes the menu.
function triggerAt(value: string, caret: number): Trigger | null {
  const before = value.slice(0, caret);
  const lineStart = before.lastIndexOf("\n") + 1;
  const cmd = /^\/(\S*)$/.exec(before.slice(lineStart));
  if (cmd) return { type: "command", query: cmd[1], start: lineStart };
  const at = before.lastIndexOf("@");
  if (at >= 0) {
    const prev = at === 0 ? " " : before[at - 1];
    const token = before.slice(at + 1);
    if (/\s/.test(prev) && /^\S*$/.test(token))
      return { type: "mention", query: token, start: at };
  }
  return null;
}

export interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
  className?: string;
}

// Controlled auto-grow textarea dressed as a chat bar, with self-contained "/"
// command + "@" mention popovers (no new dep). Reused by the beranda launcher
// (compact) and the asisten chatroom (full).
export function ChatInput({
  value,
  onChange,
  onSubmit,
  autoFocus,
  compact,
  className,
}: ChatInputProps) {
  const { send, reset } = useChat();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const trigger = useMemo(() => triggerAt(value, caret), [value, caret]);
  const mentions = useMentionSource(trigger?.type === "mention");
  const items = useMemo<(Command | Mention)[]>(() => {
    if (!trigger) return [];
    return trigger.type === "command"
      ? filterCommands(trigger.query)
      : filterMentions(mentions, trigger.query);
  }, [trigger, mentions]);
  const menuOpen = !!trigger && items.length > 0 && !dismissed;

  useEffect(() => setIdx(0), [trigger?.type, trigger?.query]);

  // Auto-grow up to ~5 rows, then scroll internally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 120 : 150)}px`;
  }, [value, compact]);

  const select = (i: number) => {
    const it = items[i];
    if (!it || !trigger) return;
    if (trigger.type === "command") {
      (it as Command).run({ reset, send });
      onChange("");
      setCaret(0);
    } else {
      const label = (it as Mention).label;
      const next = `${value.slice(0, trigger.start)}@${label} ${value.slice(caret)}`;
      const pos = trigger.start + label.length + 2;
      onChange(next);
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          el.focus();
          el.setSelectionRange(pos, pos);
        }
        setCaret(pos);
      });
    }
  };

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => (i - 1 + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        select(idx);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(true);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn("relative", className)}>
      {menuOpen && trigger && (
        <ul
          role="listbox"
          id="chat-menu-listbox"
          aria-label={trigger.type === "command" ? "Perintah" : "Sebutan"}
          className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {items.map((it, i) => {
            const isMention = trigger.type === "mention";
            const group = isMention ? (it as Mention).group : undefined;
            const prevGroup = isMention && i > 0 ? (items[i - 1] as Mention).group : undefined;
            return (
              <li key={`${group ?? "c"}-${(it as { id?: string; label: string }).id ?? it.label}`}>
                {group && group !== prevGroup && (
                  <div className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {group}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  id={`chat-menu-opt-${i}`}
                  aria-selected={i === idx}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => select(i)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                    i === idx ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {!isMention && <span className="font-mono text-xs text-primary">/</span>}
                  <span className="truncate">{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div
        className={cn(
          "flex items-end gap-2.5 rounded-2xl border border-border bg-card shadow-sm transition-colors focus-within:border-primary/60",
          compact ? "px-4 py-2.5" : "px-4 py-3",
        )}
      >
        <Sparkles
          size={compact ? 18 : 20}
          aria-hidden
          className="mt-1 shrink-0 text-muted-foreground"
        />
        <textarea
          ref={ref}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          aria-label="Tulis pesan untuk asisten"
          role="combobox"
          aria-expanded={menuOpen}
          aria-autocomplete="list"
          aria-controls={menuOpen ? "chat-menu-listbox" : undefined}
          aria-activedescendant={menuOpen ? `chat-menu-opt-${idx}` : undefined}
          placeholder={
            compact
              ? "Tanya asisten atau ketik / untuk perintah…"
              : "Tanya apa saja tentang grup usaha… ( / perintah · @ sebutan )"
          }
          onChange={(e) => {
            onChange(e.target.value);
            setCaret(e.target.selectionStart ?? e.target.value.length);
            setDismissed(false);
          }}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart ?? 0)}
          onKeyDown={onKeyDown}
          className="max-h-[150px] min-w-0 flex-1 resize-none bg-transparent py-0.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
