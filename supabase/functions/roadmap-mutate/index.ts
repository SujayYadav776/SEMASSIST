import { createClient } from "@supabase/supabase-js";
import { learnerMutationSchema } from "../../../packages/roadmap-schema/src/learner.ts";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const respond = (value: unknown, status = 200) => Response.json(value, { status, headers: cors });
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond({ error: "Sign in to sync" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !service) return respond({ error: "Sync is not configured" }, 503);
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 64 * 1024) return respond({ error: "Mutation is too large" }, 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 64 * 1024) return respond({ error: "Mutation is too large" }, 413);
    const parsed = learnerMutationSchema.safeParse(JSON.parse(text).mutation);
    if (!parsed.success) return respond({ errors: parsed.error.issues }, 422);
    const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await auth.auth.getUser(token);
    if (error || !user || parsed.data.accountId !== user.id) return respond({ error: "Account changed; sign in again" }, 401);
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const result = await admin.rpc("commit_roadmap_mutation", { p_owner_id: user.id, p_mutation: parsed.data });
    if (result.error) return respond({ error: result.error.message }, 409);
    return respond({ result: result.data });
  } catch (error) { return respond({ error: error instanceof Error ? error.message : "Invalid mutation" }, 400); }
});
