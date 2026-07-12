// Guard a user-provided color before it reaches an inline style value.
//
// React inline-style OBJECTS are CSSOM-set (element.style[prop] = value), so a
// ";"-injection cannot add sibling properties — there is no UI-redress vector.
// But a bare `background: <color>` still accepts a single valid url()/image
// value, so an authed writer could set color="url(https://evil/x)" as a beacon.
// CSP (default-src 'self') is the belt once enforcing; this denylist is the
// suspenders that works today. Every legitimate color — #hex, var(--token),
// rgb()/hsl()/oklch()/color-mix() — passes untouched; only the dangerous
// tokens are stripped (-> undefined, so the component falls back to its default).
const UNSAFE = /url\(|image-set|expression|@import|[;<>{}]/i;

export function safeColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  return UNSAFE.test(color) ? undefined : color;
}
