import { middleware } from "./middleware";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

// Mock @supabase/ssr createServerClient
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// Mock @supabase/supabase-js createClient (admin client)
const mockAdminFrom = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: mockAdminFrom,
  })),
}));

// Set required env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
process.env.SUPABASE_SECRET_KEY = "test-secret-key";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function getRedirectLocation(response: Response): string | null {
  const location = response.headers.get("location");
  if (!location) return null;
  try {
    return new URL(location).pathname;
  } catch {
    return location;
  }
}

function isRedirect(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests: Unauthenticated user
// ---------------------------------------------------------------------------

describe("middleware – unauthenticated user", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("redirects /blind-test to /auth/sign-in", async () => {
    const res = await middleware(makeRequest("/blind-test"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/auth/sign-in");
  });

  it("redirects /my-results to /auth/sign-in", async () => {
    const res = await middleware(makeRequest("/my-results"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/auth/sign-in");
  });

  it("redirects /admin to /auth/sign-in", async () => {
    const res = await middleware(makeRequest("/admin"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/auth/sign-in");
  });

  it("redirects /admin/logs to /auth/sign-in", async () => {
    const res = await middleware(makeRequest("/admin/logs"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/auth/sign-in");
  });

  it("allows /leaderboard (public page)", async () => {
    const res = await middleware(makeRequest("/leaderboard"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /auth/sign-in (already on sign-in)", async () => {
    const res = await middleware(makeRequest("/auth/sign-in"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /auth/sign-up", async () => {
    const res = await middleware(makeRequest("/auth/sign-up"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows / (home page) for unauthenticated users", async () => {
    const res = await middleware(makeRequest("/"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Tests: Authenticated regular user
// ---------------------------------------------------------------------------

describe("middleware – authenticated regular user", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@test.com" } },
    });
    // Admin check: regular user → role = 'user'
    mockAdminFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: "user" },
          }),
        }),
      }),
    });
  });

  it("allows /blind-test", async () => {
    const res = await middleware(makeRequest("/blind-test"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /my-results", async () => {
    const res = await middleware(makeRequest("/my-results"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /leaderboard", async () => {
    const res = await middleware(makeRequest("/leaderboard"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("redirects /auth/sign-in to /blind-test (already signed in)", async () => {
    const res = await middleware(makeRequest("/auth/sign-in"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("redirects /auth/sign-up to /blind-test (already signed in)", async () => {
    const res = await middleware(makeRequest("/auth/sign-up"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("redirects /auth/forgot-password to /blind-test (already signed in)", async () => {
    const res = await middleware(makeRequest("/auth/forgot-password"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("does NOT redirect /auth/callback (needed for OAuth flow)", async () => {
    const res = await middleware(makeRequest("/auth/callback"));
    expect(isRedirect(res)).toBe(false);
  });

  it("does NOT redirect /auth/sign-out (needed for sign-out flow)", async () => {
    const res = await middleware(makeRequest("/auth/sign-out"));
    expect(isRedirect(res)).toBe(false);
  });

  it("redirects / to /blind-test", async () => {
    const res = await middleware(makeRequest("/"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("redirects /admin to /blind-test (non-admin user)", async () => {
    const res = await middleware(makeRequest("/admin"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("redirects /admin/logs to /blind-test (non-admin user)", async () => {
    const res = await middleware(makeRequest("/admin/logs"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });
});

// ---------------------------------------------------------------------------
// Tests: Authenticated admin user
// ---------------------------------------------------------------------------

describe("middleware – authenticated admin user", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-456", email: "admin@test.com" } },
    });
    // Admin check: role = 'admin'
    mockAdminFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { role: "admin" },
          }),
        }),
      }),
    });
  });

  it("allows /admin", async () => {
    const res = await middleware(makeRequest("/admin"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /admin/logs", async () => {
    const res = await middleware(makeRequest("/admin/logs"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /admin/analytics", async () => {
    const res = await middleware(makeRequest("/admin/analytics"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /admin/providers", async () => {
    const res = await middleware(makeRequest("/admin/providers"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("allows /blind-test", async () => {
    const res = await middleware(makeRequest("/blind-test"));
    expect(isRedirect(res)).toBe(false);
    expect(res.status).toBe(200);
  });

  it("redirects /auth/sign-in to /blind-test", async () => {
    const res = await middleware(makeRequest("/auth/sign-in"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("uses admin client (service role) for profile check, not user client", async () => {
    const { createClient } = await import("@supabase/supabase-js");

    await middleware(makeRequest("/admin"));

    // Admin client should be created with the secret key
    expect(createClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      { auth: { persistSession: false } }
    );

    // The admin client's .from() should be used for the profile query
    expect(mockAdminFrom).toHaveBeenCalledWith("profiles");
  });
});

// ---------------------------------------------------------------------------
// Tests: Admin check edge cases
// ---------------------------------------------------------------------------

describe("middleware – admin check edge cases", () => {
  it("redirects to /blind-test when profile query returns null", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-789", email: "noone@test.com" } },
    });
    mockAdminFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const res = await middleware(makeRequest("/admin"));
    expect(isRedirect(res)).toBe(true);
    expect(getRedirectLocation(res)).toBe("/blind-test");
  });

  it("does NOT query profiles for non-admin routes", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@test.com" } },
    });

    await middleware(makeRequest("/blind-test"));

    // Admin client should NOT have been called
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });
});
