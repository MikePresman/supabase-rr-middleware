# Setup

In your exported env vars, add your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

I encourage you to make contributions. It's really barebones right now.

## Server Loader Example

```ts
export const loader = withSupabase(async ({ request, supabase }) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    // User is already logged in, redirect to home
    return redirect("/");
  }

  // Show login page - headers handled by middleware
  return data({ isAuthenticated: false });
});
```

## Server Action Example

```ts
// Login form action
export const action = withSupabase(async ({ request, supabase }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return data({ error: error.message }, { status: 400 });
  }

  // Get the redirectTo parameter or default to "/"
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  // Redirect with headers handled by middleware
  return redirect(redirectTo);
});
```

```

```
