import { adminClient } from "../_shared/auth.ts";
import { json } from "../_shared/http.ts";

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const constantTimeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
};

async function verify(request: Request, payload: string) {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatures = request.headers.get("svix-signature") || "";
  if (!secret || !id || !timestamp || !signatures || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = await crypto.subtle.importKey("raw", decodeBase64(rawSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${payload}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return signatures.split(" ").some((entry) => entry.startsWith("v1,") && constantTimeEqual(entry.slice(3), expected));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const payload = await request.text();
  if (!await verify(request, payload)) return json({ error: "Invalid webhook signature" }, 401);
  const event = JSON.parse(payload);
  const providerMessageId = event?.data?.email_id;
  const statusMap: Record<string, string> = { "email.delivered": "Delivered", "email.bounced": "Bounced", "email.complained": "Complained", "email.failed": "Failed" };
  const status = statusMap[event?.type];
  if (providerMessageId && status) {
    const db = adminClient();
    await db.from("email_deliveries").update({ status, failed_at: status === "Failed" || status === "Bounced" ? new Date().toISOString() : undefined, last_error_code: status === "Bounced" || status === "Complained" ? event.type : undefined, last_error_message_safe: status === "Bounced" ? "The recipient server bounced this email." : status === "Complained" ? "The recipient marked this email as spam." : undefined, updated_at: new Date().toISOString() }).eq("provider_message_id", providerMessageId);
  }
  return json({ received: true });
});
