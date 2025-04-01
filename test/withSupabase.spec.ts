import { jest } from "globals";
import { redirect } from "react-router";
import * as assert from "uvu/assert";
import { withSupabase } from "../index.js";

// Mock Supabase client and headers
const mockHeaders = new Headers();
const mockSupabase = {};

// Mock getServerClient to return our test client
jest.mock("../lib/server", () => ({
  getServerClient: () => ({
    supabase: mockSupabase,
    headers: mockHeaders,
  }),
}));

beforeEach(() => {
  mockHeaders.forEach((_, key) => mockHeaders.delete(key));
});

afterEach(() => {
  jest.clearAllMocks();
});

test("withSupabase - handles plain data return", async () => {
  const testData = { foo: "bar" };
  const wrappedRoute = withSupabase(async ({ supabase: _ }) => testData);

  const result = await wrappedRoute({
    request: new Request("http://test.com"),
  });

  assert.equal(result.status, 200);
  assert.equal(result.data, testData);
});

test("withSupabase - handles Response objects", async () => {
  const testResponse = new Response("test");
  const wrappedRoute = withSupabase(async ({ supabase: _ }) => testResponse);

  const result = await wrappedRoute({
    request: new Request("http://test.com"),
  });

  assert.instance(result, Response);
});

test("withSupabase - handles redirect", async () => {
  const redirectUrl = "/somewhere";
  const wrappedRoute = withSupabase(async ({ supabase: _ }) =>
    redirect(redirectUrl)
  );

  const result = await wrappedRoute({
    request: new Request("http://test.com"),
  });

  assert.instance(result, Response);
  assert.equal(result.status, 302);
  assert.equal(result.headers.get("Location"), redirectUrl);
});

test("withSupabase - passes supabase client to route function", async () => {
  let passedClient;
  const wrappedRoute = withSupabase(async ({ supabase }) => {
    passedClient = supabase;
    return { success: true };
  });

  await wrappedRoute({ request: new Request("http://test.com") });

  assert.equal(passedClient, mockSupabase);
});

test("withSupabase - copies headers to response", async () => {
  mockHeaders.set("test-header", "test-value");
  const wrappedRoute = withSupabase(async ({ supabase: _ }) => ({
    success: true,
  }));

  const result = await wrappedRoute({
    request: new Request("http://test.com"),
  });

  assert.equal(result.headers.get("test-header"), "test-value");
});

test.run();
