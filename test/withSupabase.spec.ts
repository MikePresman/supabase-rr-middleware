import { redirect } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { withSupabase } from "../index.js";

// Mock Supabase client and headers
const mockHeaders = new Headers();
const mockSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: { user: { id: "123" } } },
    }),
  },
};

// Mock getServerClient to return our test client
vi.mock("../lib/server", () => ({
  getServerClient: () => ({
    supabase: mockSupabase,
    headers: mockHeaders,
  }),
}));

beforeEach(() => {
  mockHeaders.forEach((_, key) => mockHeaders.delete(key));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("withSupabase", () => {
  it("handles plain data return", async () => {
    const testData = { foo: "bar" };
    const wrappedRoute = withSupabase(async ({ supabase: _ }) => testData);

    const result = await wrappedRoute({
      request: new Request("http://test.com"),
    });

    expect(result.data.foo).toBe("bar");
  });

  it("handles Response objects", async () => {
    const testResponse = new Response("test");
    const wrappedRoute = withSupabase(async ({ supabase: _ }) => testResponse);

    const result = await wrappedRoute({
      request: new Request("http://test.com"),
    });

    expect(result).toBeInstanceOf(Response);
  });

  it("handles redirect", async () => {
    const redirectUrl = "/somewhere";
    const wrappedRoute = withSupabase(async ({ supabase: _ }) =>
      redirect(redirectUrl)
    );

    const result = await wrappedRoute({
      request: new Request("http://test.com"),
    });

    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(302);
    expect(result.headers.get("Location")).toBe(redirectUrl);
  });

  it("passes supabase client to route function", async () => {
    let passedClient;
    const wrappedRoute = withSupabase(async ({ supabase }) => {
      passedClient = supabase;
      return { success: true };
    });

    await wrappedRoute({ request: new Request("http://test.com") });

    const session = await passedClient.auth.getSession();
    expect(session.data.session.user.id).toBe("123");
    expect(passedClient).toBe(mockSupabase);
  });

  it("copies headers to response", async () => {
    mockHeaders.set("test-header", "test-value");
    const wrappedRoute = withSupabase(async ({ supabase: _ }) => ({
      success: true,
    }));

    const result = await wrappedRoute({
      request: new Request("http://test.com"),
    });

    const headerValue = result.init.headers.get("test-header");
    expect(headerValue).toBe("test-value");
  });
});
