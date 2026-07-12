/** @type {import('next').NextConfig} */

// Build a CSP connect-src allowlist from the Convex env. The reactive client
// opens a websocket against the SAME host as NEXT_PUBLIC_CONVEX_URL (http->ws,
// https->wss), and @convex-dev/auth's HTTP actions hit NEXT_PUBLIC_CONVEX_SITE_URL.
// We add every origin we can derive (https + wss for each) so the report-only
// policy doesn't spam violations for legitimate traffic. Falls back to the prod
// hosts when env is unset (e.g. config collection without inlined NEXT_PUBLIC_*).
function convexConnectSources() {
  // Placeholder defaults — set NEXT_PUBLIC_CONVEX_URL / NEXT_PUBLIC_CONVEX_SITE_URL
  // (as build args) to YOUR Convex deployment so the enforced CSP allowlists the
  // right origins. No infra is hardcoded: a build without these env vars only
  // allowlists the placeholders (the app won't connect until you set them).
  const raw = [
    process.env.NEXT_PUBLIC_CONVEX_URL || "https://YOUR-DEPLOYMENT.convex.cloud",
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://YOUR-DEPLOYMENT.convex.site",
  ];
  const out = new Set();
  for (const value of raw) {
    if (!value) continue;
    try {
      const u = new URL(value);
      out.add(u.origin);
      // ws(s) sibling for the reactive socket.
      out.add(u.origin.replace(/^http/, "ws"));
    } catch {
      // Malformed env — skip rather than emit a broken directive.
    }
  }
  return [...out];
}

// Content-Security-Policy, ENFORCING. Pre-flight verified the app loads only
// `self` + the Convex origins (next/font self-hosts Fraunces; no external CDN /
// script / font), so locking the fetch directives blocks no legitimate traffic
// — confirmed live via the authed e2e before promoting from report-only.
//
// script-src keeps 'unsafe-inline': Next's RSC streaming injects inline <script>
// (flight data) and layout.tsx ships an inline theme no-flash script, so a
// 'self'-only policy white-screens. The gold-standard nonce + 'strict-dynamic'
// is NOT cleanly achievable here for a single reason: convexAuthNextjsMiddleware
// (proxy.ts) does not forward a per-request nonce header to the renderer, so
// there is no nonce to attach to the framework-injected inline scripts. (This is
// NOT a static-render cost — all routes are already ƒ dynamic, so there is no
// static opt to undo.) The residual is mitigated: React auto-escapes every
// rendered value; the only dangerouslySetInnerHTML is a static developer-authored
// theme no-flash script with zero user input; and EVERY user-controlled color
// value is safeColor()-guarded at its inline-style sink (lib/safe-css.ts strips
// url()/image-set/expression/@import/;<>{}, so a stored color can't smuggle a
// url() beacon or break out of the CSS value). connect-src /
// object-src / base-uri / form-action are now ACTIVELY enforced (exfil, base
// hijack, plugin, form-action vectors).
const csp = [
  "default-src 'self'",
  `connect-src 'self' ${convexConnectSources().join(" ")}`,
  "img-src 'self' data:",
  // Tailwind v4 + Next inject inline <style>; 'unsafe-inline' is required here.
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  // Remaining fetch directives locked to self.
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
]
  .join("; ")
  .trim();

const securityHeaders = [
  {
    // 2 years, apply to subdomains. Only sent over HTTPS by spec.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  // Standalone server bundle for the Docker runner stage (Dokploy).
  output: "standalone",
  // geoip-lite reads its .dat data files at import via __dirname. Left to
  // Turbopack it gets bundled and __dirname is rewritten to a virtual /ROOT/…
  // path that doesn't exist — so `next build` crashes collecting page data for
  // /api/analytics. Keeping it external makes it a real runtime require() that
  // resolves to node_modules, so the data path is correct at build AND runtime.
  serverExternalPackages: ["geoip-lite"],
  // …and the standalone output tracer can't see those fs reads, so include the
  // .dat files explicitly for the /api/analytics route or the Dokploy image
  // ships without them (geo silently empty). Scoped to the one geo route.
  outputFileTracingIncludes: {
    "/api/analytics": ["./node_modules/geoip-lite/data/**"],
  },
  // Stable build identifier (skew protection + deterministic asset URLs across
  // the standalone server and any CDN). Prefer the git SHA the Dokploy/CI build
  // injects (DEPLOYMENT_ID / SOURCE_COMMIT) so each deploy is uniquely tagged
  // and clients with a stale bundle can be detected; falls back to a fixed value
  // so local builds stay reproducible instead of a random per-build id.
  deploymentId:
    process.env.DEPLOYMENT_ID || process.env.SOURCE_COMMIT || "konglo-os",
  // rr: Cache Components — enable in P5 once static marketing routes exist with
  // explicit "use cache" + cacheLife. Off now: all routes are dynamic/auth.
  //
  // No remote images anywhere in the app (no next/image, no remote <img src>):
  // all imagery is icons/CSS/local. So we ship NO remotePatterns — the previous
  // `hostname:"**"` wildcard whitelisted the entire internet for the Next image
  // optimizer (an SSRF/abuse surface) for zero benefit. Add a specific host here
  // only when a real remote source is introduced.
  images: {
    remotePatterns: [],
  },
  // Apply hardening headers to every route. Static, no per-request nonce needed,
  // so this lives here rather than in proxy.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
