// utils/auth-middleware.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { data, redirect } from "react-router";
import { getServerClient } from "./lib/server";
import { RouteFunction } from "./lib/types";

/**
 * Middleware to automatically handle Supabase auth headers
 */
export function withSupabase<Args extends { request: Request }, Return>(
  routeFunction: RouteFunction<Args & { supabase: SupabaseClient }, Return>
): RouteFunction<Args, Return> {
  return async (args: Args) => {
    // Initialize Supabase client with request
    const { supabase, headers } = getServerClient(args.request);

    // Call the original function with supabase added to args
    const result = await routeFunction({ ...args, supabase });

    // Attach headers to the response
    if (result instanceof Response) {
      // For Response objects (including redirects)
      headers.forEach((value, key) => {
        result.headers.append(key, value);
      });
      return result;
    } else if (result && typeof result === "object" && "headers" in result) {
      // For objects with headers property (like from data())
      headers.forEach((value, key) => {
        (result.headers as Headers).append(key, value);
      });
      return result;
    } else {
      // For plain data returns, create a new Headers object
      const newHeaders = new Headers();

      // Copy all Supabase auth headers to the new Headers object
      headers.forEach((value, key) => {
        newHeaders.append(key, value);
      });

      // Create a data response with our headers
      const response = data(result, {
        headers: newHeaders,
      });

      return response as unknown as Return;
    }
  };
}
/**
 * Middleware that requires authentication
 */

export interface AuthUser {
  id: string;
  [key: string]: any;
}

export function withAuth<Args extends { request: Request }, Return>(
  routeFunction: RouteFunction<
    Args & { supabase: SupabaseClient; user: AuthUser },
    Return
  >,
  redirectTo = "/login"
): RouteFunction<Args, Return> {
  return withSupabase(async (args) => {
    // Check authentication
    const {
      data: { user },
      error,
    } = await args.supabase.auth.getUser();

    // If not authenticated, redirect to login
    if (error || !user) {
      const url = new URL(args.request.url);
      const currentPath = url.pathname + url.search;
      const redirectPath = `${redirectTo}?redirectTo=${encodeURIComponent(
        currentPath
      )}`;

      // This will have headers included from withSupabase
      throw redirect(redirectPath);
    }

    // User is authenticated, call the original function
    return routeFunction({ ...args, user });
  });
}
