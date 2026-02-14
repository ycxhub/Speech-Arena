import { GET } from "./route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSignOut = jest.fn().mockResolvedValue({});
let capturedSetAll: ((...args: unknown[]) => void) | null = null;

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn((_url: string, _key: string, options: { cookies: { setAll: (...args: unknown[]) => void } }) => {
    // Capture the setAll callback so we can verify cookies are wired
    // to the redirect response.
    capturedSetAll = options.cookies.setAll;
    return {
      auth: { signOut: mockSignOut },
    };
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  capturedSetAll = null;
});

describe("GET /auth/sign-out", () => {
  it("returns a redirect to /auth/sign-in", async () => {
    const request = new NextRequest(
      new URL("/auth/sign-out", "http://localhost:3000")
    );
    const response = await GET(request);

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);

    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/auth/sign-in");
  });

  it("calls supabase.auth.signOut()", async () => {
    const request = new NextRequest(
      new URL("/auth/sign-out", "http://localhost:3000")
    );
    await GET(request);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("wires setAll to the redirect response (cookies propagate)", async () => {
    const request = new NextRequest(
      new URL("/auth/sign-out", "http://localhost:3000")
    );
    const response = await GET(request);

    // The setAll callback should have been captured
    expect(capturedSetAll).not.toBeNull();

    // Simulate Supabase calling setAll to clear cookies
    capturedSetAll!([
      { name: "sb-access-token", value: "", options: { maxAge: 0, path: "/" } },
      { name: "sb-refresh-token", value: "", options: { maxAge: 0, path: "/" } },
    ]);

    // Verify cookies are set on the REDIRECT response object
    const cookies = response.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);

    // Check that the cleared cookies are present
    const cookieStr = cookies.join("; ");
    expect(cookieStr).toContain("sb-access-token");
    expect(cookieStr).toContain("sb-refresh-token");
  });

  it("does NOT use cookies() from next/headers (uses createServerClient directly)", async () => {
    // This test verifies the architectural choice: the route uses
    // createServerClient with cookie handlers wired to the response,
    // not the shared createClient() helper that uses cookies() API.
    const { createServerClient } = await import("@supabase/ssr");

    const request = new NextRequest(
      new URL("/auth/sign-out", "http://localhost:3000")
    );
    await GET(request);

    expect(createServerClient).toHaveBeenCalledTimes(1);
    // The first two args should be the Supabase URL and key
    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });
});
