// Get these values from Supabase: Project Settings → API.
// The anon/publishable key is safe to use in a browser when Row Level Security
// is enabled (see supabase/schema.sql).
window.SUPABASE_CONFIG = {
  url: "https://nrxbelpmydquivcphxry.supabase.co",
  anonKey: "sb_publishable_FKJkucHUoTZCjFeWl_JAfw_GKKs3FLF",
  // Redirect URL for Supabase auth (magic links, password reset, sign-up
  // confirmation). Derived from the current origin so it works on localhost
  // during development and on any deployed domain (vercel.app alias, custom
  // domain) without editing this file. The Supabase dashboard must allowlist
  // the origin's URL pattern (see PROJECT-REVIEW.md / continue.md).
  redirectUrl: window.location.origin + "/study-dashboard.html",
};
