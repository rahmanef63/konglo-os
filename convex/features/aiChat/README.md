# aiChat — LLM reply backend

Stateless chat action vendored from rr resource-site. Frontend calls
`api.features.aiChat.action.chat({ prompt, history? })` and gets back
`{ ok, text? , notice? }`.

- **Real LLM**: Vercel `ai` SDK + `@ai-sdk/anthropic`, single `generateText` call.
- **Key requirement**: needs `ANTHROPIC_API_KEY` set on the **Convex deployment**
  (Dokploy Convex compose env — NOT the Next.js frontend app env). Unset →
  returns `{ ok:false, notice }` so the chat degrades gracefully and neither
  build nor prerender depends on the key existing.
- **Stateless**: no tables, no threads. `history` is passed in by the caller;
  server-side persistence is a follow-up.
- **Model swap**: edit the `MODEL` const in `action.ts` (currently
  `claude-haiku-4-5-20251001`); it is forwarded verbatim to the Anthropic API.
