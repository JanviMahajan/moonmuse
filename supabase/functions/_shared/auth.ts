import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Server database configuration is missing");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function requireOwner(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Authentication required");
  const db = adminClient();
  const token = authorization.slice(7);
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) throw new Error("Invalid or expired session");
  const { data: profile } = await db.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  if (profile?.role !== "owner") throw new Error("Owner access required");
  return { db, user: userData.user };
}

