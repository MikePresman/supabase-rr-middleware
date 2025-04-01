export interface SupabaseConfig {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
  };
}

export type RouteFunction<Args, Return> = (args: Args) => Promise<Return>;
