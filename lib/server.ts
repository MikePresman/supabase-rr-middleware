import {
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";

export const getServerClient = (request: Request) => {
  const headers = new Headers();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(
            request.headers.get("Cookie") ?? ""
          );
          if (!cookies) return null;
          return Object.entries(cookies).map(([name, value]) => ({
            name,
            value: value as unknown as string,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );

  return { supabase, headers };
};
