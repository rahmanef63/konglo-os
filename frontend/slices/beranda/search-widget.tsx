"use client";

import { useState } from "react";
import { useNav, useChat, ChatInput } from "@/frontend/shared";
import { cn } from "@/lib/utils";

// The launcher's focal point: a compact chat input. Typing + Enter sends the
// first message to the session-scoped chat (useChat) and hands off to the
// `asisten` chatroom (useNav), where the reply lands — so the home doubles as the
// entry to the assistant. The ⌘K CommandPalette is unchanged (still on the
// topbar / dock / keyboard); only this centered widget switched from "open
// palette" to "chat". Centered, max-w ~640px.
export function SearchWidget({ className }: { className?: string }) {
  const { send } = useChat();
  const nav = useNav();
  const [value, setValue] = useState("");

  const onSubmit = (text: string) => {
    send(text);
    nav("asisten");
    setValue("");
  };

  return (
    <ChatInput
      compact
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      className={cn("mx-auto w-full max-w-[640px]", className)}
    />
  );
}
