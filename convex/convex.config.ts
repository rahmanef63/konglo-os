import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

// rr: Convex component registry. The rate-limiter component backs the
// per-account sign-in brute-force guard wired in `authRateLimit.ts` +
// `auth.ts`. Registering here is what makes `components.rateLimiter`
// available in `_generated/api`.
const app = defineApp();
app.use(rateLimiter);

export default app;
