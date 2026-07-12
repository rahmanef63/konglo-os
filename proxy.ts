import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// rr: Next 16 proxy replaces middleware.ts. Wraps Convex Auth's middleware so
// the /api/auth endpoint is served and the session cookie is set/refreshed,
// THEN does route-level gating. Convex fns still enforce requireUser/requireAdmin.
// "/" + "/login" are public marketing; "/os/*" is the gated workspace.
const isPublic = createRouteMatcher(["/", "/login"]);
const isOs = createRouteMatcher(["/os(.*)"]);

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();

  // Gate the OS workspace.
  if (isOs(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
  // Authed users skip marketing/login → straight into the app.
  if (isPublic(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/os");
  }
});

export const config = {
  // Run on everything except static assets / _next internals so the Convex
  // auth route (/api/auth) and token refresh are handled on every request.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
