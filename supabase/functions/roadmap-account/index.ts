import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validateBackup } from "../../../packages/roadmap-schema/src/backup.ts";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
const requestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("backup") }),
  z.strictObject({ action: z.literal("restore"), restoreId: z.uuid(), backup: z.unknown(), expected: z.unknown(), mode: z.enum(["merge", "replace"]) }),
  z.strictObject({ action: z.enum(["archive", "unarchive", "delete"]), roadmapId: z.uuid() }),
  z.strictObject({ action: z.literal("activate"), roadmapId: z.uuid(), scheduleId: z.uuid(), expected: z.strictObject({ revisionId: z.uuid(), scheduleId: z.uuid(), learnerRevision: z.number().int().nonnegative() }) }),
]);
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  if (Number(request.headers.get("content-length") ?? 0) > 55 * 1024 * 1024) return reply({ error: "Restore request too large" }, 413);
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 55 * 1024 * 1024) return reply({ error: "Restore request too large" }, 413);
    const body = requestSchema.parse(JSON.parse(raw));
    const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return reply({ error: "Sign in first" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = createClient(url, (Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY"))!, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return reply({ error: "Sign in again" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const result = body.action === "backup" ? await admin.rpc("roadmap_account_backup", { p_owner: user.id })
      : body.action === "restore" ? await admin.rpc("restore_roadmap_account", { p_owner: user.id, p_restore_id: body.restoreId, p_backup: validateBackup(body.backup), p_expected: validateBackup(body.expected), p_mode: body.mode })
      : await admin.rpc("manage_roadmap", { p_owner: user.id, p_roadmap: body.roadmapId, p_action: body.action, p_expected: body.action === "activate" ? body.expected : {}, p_schedule: body.action === "activate" ? body.scheduleId : null });
    if (result.error) return reply({ error: result.error.message }, 409);
    if (body.action === "backup") validateBackup(result.data);
    return reply({ result: result.data });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : "Invalid account request" }, 400); }
});
