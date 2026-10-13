import { createClient } from "@supabase/supabase-js";
import { parsePackageJson } from "../../../packages/roadmap-schema/src/validate.ts";
import { mappingDecisionsSchema, validateBackup, assertReplanBaseline } from "../../../packages/roadmap-schema/src/backup.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
};

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 5 * 1024 * 1024) return respond({ error: "Package exceeds 5 MiB" }, 413);
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond({ error: "Sign in to import a roadmap" }, 401);
  const url = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !serviceKey) return respond({ error: "Roadmap import is not configured" }, 503);
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > 5 * 1024 * 1024) return respond({ error: "Package exceeds 5 MiB" }, 413);
    const body = JSON.parse(bodyText) as { package?: unknown; importId?: unknown; decisions?: unknown };
    if (typeof body.importId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.importId)) return respond({ error: "Invalid import ID" }, 400);
    const parsed = parsePackageJson(JSON.stringify(body.package ?? null));
    if (!parsed.success) return respond({ errors: parsed.errors }, 422);
    const authClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return respond({ error: "Sign in again before importing" }, 401);
    const decisions = mappingDecisionsSchema.parse(body.decisions ?? []);
    const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical({ package: parsed.data, decisions })));
    const digest = [...new Uint8Array(digestBytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    // A receipt must be checked before validating a baseline already advanced by a lost acknowledgement.
    const receipt = await admin.from("roadmap_import_receipts").select("digest,result").eq("owner_id", user.id).eq("import_id", body.importId).maybeSingle();
    if (receipt.error) throw receipt.error;
    if (receipt.data) return receipt.data.digest === digest ? respond({ result: receipt.data.result.result }) : respond({ error: "Import ID reused with different data" }, 409);
    if (parsed.data.importKind !== "new") {
      const saved = await admin.rpc("roadmap_account_backup", { p_owner: user.id });
      if (saved.error) throw saved.error;
      const item = validateBackup(saved.data).roadmaps.find(r => r.roadmapId === parsed.data.roadmap.roadmapId);
      if (!item) return respond({ error: "Roadmap baseline not found" }, 409);
      assertReplanBaseline(item, parsed.data, decisions);
    } else if (decisions.length || parsed.data.mappings.length) return respond({ error: "New imports cannot carry learner progress" }, 422);
    const { data, error } = await admin.rpc("commit_roadmap_import", {
      p_owner_id: user.id,
      p_import_id: body.importId,
      p_digest: digest,
      p_package: parsed.data,
      p_decisions: decisions,
    });
    if (error) return respond({ error: error.message }, 409);
    return respond({ result: data, warnings: parsed.warnings });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Invalid import request" }, 400);
  }
});
