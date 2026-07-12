"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useChat, ChatInput } from "@/frontend/shared";
import { Messages } from "./messages";

const SUGGESTIONS = [
  "Ringkas kondisi grup usaha bulan ini",
  "Anak usaha mana yang perlu perhatian?",
  "Apa saja yang bisa kamu bantu?",
];

// Asisten — the "AI Rupa" chatroom. Calm centered empty state until the first
// message, then a scrolling transcript with the smart ChatInput pinned at the
// bottom. Session-scoped via useChat(), so a first message typed on the beranda
// launcher is already here when this screen mounts. No RBAC gate — any signed-in
// user can chat.
export default function Screen() {
  const { messages, status, send } = useChat();
  const [value, setValue] = useState("");
  const empty = messages.length === 0;

  const onSubmit = (text: string) => {
    send(text);
    setValue("");
  };

  return (
    // Height subtracts the topbar (9.5rem) AND — on mobile — the fixed dock
    // clearance (6rem + safe-area), else the pinned ChatInput lands behind the
    // dock on first paint (the dock is the very surface that opens this screen).
    <div className="mx-auto flex h-[calc(100dvh-9.5rem-6rem-env(safe-area-inset-bottom))] min-h-[26rem] w-full max-w-3xl flex-col md:h-[calc(100dvh-9.5rem)]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="grid place-items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-card text-[color:var(--color-mk-purple)]">
                <Sparkles size={22} aria-hidden />
              </span>
              <h2 className="text-xl font-semibold text-foreground">
                Mau tanya apa hari ini?
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Tanya apa saja tentang grup usaha. Ketik{" "}
                <span className="font-mono text-foreground">/</span> untuk
                perintah, <span className="font-mono text-foreground">@</span>{" "}
                untuk menyebut fitur, anak usaha, atau kontak.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Messages messages={messages} status={status} />
        )}
      </div>

      <div className="shrink-0 pt-3">
        <ChatInput
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          autoFocus
        />
      </div>
    </div>
  );
}
