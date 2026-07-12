"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Session-scoped chat state, mounted in the OS shell so it survives in-app slice
// nav (typing on the beranda launcher sends the first message, then we nav to the
// `asisten` chatroom and the reply lands in the SAME conversation). Not persisted
// across refresh by design — a page reload starts a clean thread.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  // `notice` = a graceful fallback shown IN the chat when the AI is unreachable,
  // rendered muted (not styled as a real assistant answer).
  notice?: boolean;
}

export type ChatStatus = "idle" | "thinking";

export interface ChatApi {
  messages: ChatMessage[];
  status: ChatStatus;
  send: (prompt: string) => void;
  reset: () => void;
}

// Contract with Track A's action (api.features.aiChat.action.chat): on success
// { ok:true, text }; on a handled failure { ok:false, notice } so we can show a
// calm in-chat fallback instead of throwing. Typed locally because codegen for
// the action runs on the integrator's side, after this lands.
type ChatResult = { ok: true; text: string } | { ok: false; notice: string };

const FALLBACK =
  "Maaf, asisten sedang tidak bisa dihubungi. Coba lagi sebentar lagi ya.";

const ChatContext = createContext<ChatApi | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useAction(api.features.aiChat.action.chat);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");

  // Latest messages for building `history` at call time — keeps `send` stable
  // (deps only on `chat`) while always reading the current thread, no stale
  // closure. Synced in an effect (post-commit) so `send`, only ever invoked from
  // user events, sees the committed thread.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback(
    (prompt: string) => {
      const text = prompt.trim();
      if (!text) return;
      const history = messagesRef.current
        .filter((m) => !m.notice)
        .map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setStatus("thinking");
      void (async () => {
        try {
          const res = (await chat({ prompt: text, history })) as ChatResult;
          if (res && res.ok) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: res.text },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: (res && "notice" in res && res.notice) || FALLBACK,
                notice: true,
              },
            ]);
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: FALLBACK, notice: true },
          ]);
        } finally {
          setStatus("idle");
        }
      })();
    },
    [chat],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStatus("idle");
  }, []);

  const value = useMemo<ChatApi>(
    () => ({ messages, status, send, reset }),
    [messages, status, send, reset],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatApi {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
