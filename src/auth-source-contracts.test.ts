/**
 * Source-level contract tests.
 *
 * These tests read the actual source files and verify critical architectural
 * invariants (e.g. "sign-out link must be <a>, not <Link>") without needing
 * a full React rendering environment or browser DOM.
 *
 * They act as guardrails so future refactors don't accidentally revert the
 * auth fixes.
 */

import { readFileSync } from "fs";
import { join } from "path";

function readSource(relativePath: string): string {
  return readFileSync(join(__dirname, "..", relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// Sign-in page contracts
// ---------------------------------------------------------------------------

describe("sign-in page (src/app/auth/sign-in/page.tsx)", () => {
  const source = readSource("src/app/auth/sign-in/page.tsx");

  it("uses window.location.href for post-login navigation (not router.push)", () => {
    expect(source).toContain('window.location.href = "/blind-test"');
  });

  it("does NOT use router.push for post-login navigation", () => {
    // Ensure router.push("/blind-test") is not present
    expect(source).not.toMatch(/router\.push\(["']\/blind-test["']\)/);
  });
});

// ---------------------------------------------------------------------------
// Sign-up page contracts
// ---------------------------------------------------------------------------

describe("sign-up page (src/app/auth/sign-up/page.tsx)", () => {
  const source = readSource("src/app/auth/sign-up/page.tsx");

  it("checks getSession() after signUp() for auto-redirect", () => {
    expect(source).toContain("supabase.auth.getSession()");
  });

  it("auto-redirects to /blind-test if session is available after sign-up", () => {
    expect(source).toContain('window.location.href = "/blind-test"');
  });

  it("success screen does NOT contain 'then sign in' text", () => {
    // The success screen is the `if (success)` block
    const successBlockMatch = source.match(/if\s*\(success\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);[\s\S]*?\}/);
    expect(successBlockMatch).not.toBeNull();
    const successBlock = successBlockMatch![0];
    expect(successBlock.toLowerCase()).not.toContain("then sign in");
  });

  it("success screen does NOT link to /auth/sign-in", () => {
    const successBlockMatch = source.match(/if\s*\(success\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);[\s\S]*?\}/);
    expect(successBlockMatch).not.toBeNull();
    const successBlock = successBlockMatch![0];
    expect(successBlock).not.toContain("/auth/sign-in");
  });

  it("success screen tells user they will be signed in automatically", () => {
    const successBlockMatch = source.match(/if\s*\(success\)\s*\{[\s\S]*?return\s*\([\s\S]*?\);[\s\S]*?\}/);
    expect(successBlockMatch).not.toBeNull();
    const successBlock = successBlockMatch![0];
    expect(successBlock.toLowerCase()).toContain("signed in automatically");
  });
});

// ---------------------------------------------------------------------------
// NavBar contracts
// ---------------------------------------------------------------------------

describe("nav-bar (src/components/layout/nav-bar.tsx)", () => {
  const source = readSource("src/components/layout/nav-bar.tsx");

  it("sign-out link uses a plain <a> tag (not <Link>)", () => {
    // There should be an <a> tag pointing to /auth/sign-out
    expect(source).toMatch(/<a[\s\S]*?href="\/auth\/sign-out"/);
  });

  it("sign-out link does NOT use <Link> component", () => {
    // A JSX <Link has a space/newline after the tag name before attributes.
    // This distinguishes it from the comment text "(not <Link>)".
    expect(source).not.toMatch(/<Link\s[^>]*href="\/auth\/sign-out"/);
  });
});

// ---------------------------------------------------------------------------
// Sign-out route contracts
// ---------------------------------------------------------------------------

describe("sign-out route (src/app/auth/sign-out/route.ts)", () => {
  const source = readSource("src/app/auth/sign-out/route.ts");

  it("uses createServerClient directly (not the shared createClient helper)", () => {
    expect(source).toContain("createServerClient");
    // Should NOT import from @/lib/supabase/server
    expect(source).not.toContain("@/lib/supabase/server");
  });

  it("sets cookies directly on the response object in setAll", () => {
    expect(source).toContain("response.cookies.set");
  });

  it("calls signOut()", () => {
    expect(source).toContain("supabase.auth.signOut()");
  });
});

// ---------------------------------------------------------------------------
// Middleware contracts
// ---------------------------------------------------------------------------

describe("middleware (src/middleware.ts)", () => {
  const source = readSource("src/middleware.ts");

  it("uses service-role admin client for profile check (not user client)", () => {
    // Should import createClient from @supabase/supabase-js
    expect(source).toContain("@supabase/supabase-js");
    // Should use SUPABASE_SECRET_KEY
    expect(source).toContain("SUPABASE_SECRET_KEY");
  });

  it("admin check queries profiles table via admin client", () => {
    // adminClient.from("profiles") should be present
    expect(source).toContain('adminClient');
    expect(source).toMatch(/adminClient[\s\S]*?\.from\(["']profiles["']\)/);
  });
});
