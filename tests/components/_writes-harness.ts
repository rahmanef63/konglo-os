import { vi } from "vitest";

// Shared stubs for the *-writes.test.tsx suites (previously copy-pasted ×12).

// ReactMutation is a callable carrying `.withOptimisticUpdate` (chainable). The
// write hooks call it, so every mock MUST expose it returning the same callable
// or the hook throws.
export function mockMutation() {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    withOptimisticUpdate: (u: unknown) => typeof fn;
  };
  return Object.assign(fn, { withOptimisticUpdate: () => fn });
}

// Factory for the vi.mock("../../frontend/shared") surface every writes test
// stubs. Getters keep toast/log lazy — vi.mock factories run mid-import, so a
// direct reference would hit the TDZ before the test module body initializes.
export function sharedMock(getToast: () => unknown, getLog: () => unknown) {
  return {
    useToast: () => getToast(),
    useActivityLog: () => getLog(),
    isConflict: (e: unknown) => e instanceof Error && /conflict/i.test(e.message),
  };
}
