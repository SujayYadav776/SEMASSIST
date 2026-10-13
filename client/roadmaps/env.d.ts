interface Window {
  SUPABASE_CONFIG?: { url: string; anonKey: string };
  semassistStudy?: { pending(): boolean; export(): void; stop(): void };
  semassistPrepareSignOut?: () => Promise<boolean>;
}
// The CDN module is loaded by the browser; its declarations are not bundled locally.
declare module "https://esm.sh/@supabase/supabase-js@2";
