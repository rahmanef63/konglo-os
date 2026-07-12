// Slash-command registry for the chat input. Plain array so it stays trivially
// extensible — add an entry, it shows up in the "/" menu with no wiring. `run`
// gets the chat ctx (reset/send) the input pulls from useChat().

export interface CommandCtx {
  reset: () => void;
  send: (prompt: string) => void;
}

export interface Command {
  id: string;
  label: string;
  run: (ctx: CommandCtx) => void;
}

export const COMMANDS: Command[] = [
  { id: "baru", label: "Percakapan baru", run: (ctx) => ctx.reset() },
  { id: "bersihkan", label: "Bersihkan", run: (ctx) => ctx.reset() },
  {
    id: "bantuan",
    label: "Bantuan",
    run: (ctx) => ctx.send("Apa saja yang bisa kamu bantu?"),
  },
];

export function filterCommands(query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter(
    (c) => c.label.toLowerCase().includes(q) || c.id.includes(q),
  );
}
