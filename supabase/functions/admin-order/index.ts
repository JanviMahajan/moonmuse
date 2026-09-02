import { requireOwner } from "../_shared/auth.ts";
import { escapeHtml, recordAndSend } from "../_shared/email.ts";
import { corsHeaders, json, safeError } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireOwner(request);
    const body = await request.json();
    const orderId = String(body.orderId || "");
    const allowed = ["status", "payment_status", "delivery_charge", "final_total", "tracking_number", "latest_update"];
    const patch = Object.fromEntries(Object.entries(body.patch || {}).filter(([key]) => allowed.includes(key)));
    if (!orderId || !Object.keys(patch).length) return json({ error: "No valid update supplied." }, 400);
    const { data: order } = await db.from("orders").select("id,order_number,full_name,email,status,subtotal").eq("id", orderId).maybeSingle();
    if (!order) return json({ error: "Order not found." }, 404);
    const { error } = await db.from("orders").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) throw new Error("Could not update order");
    let email = null;
    if (patch.status && patch.status !== order.status) {
      const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
      email = await recordAndSend(db, { orderId, emailType: "Order-status update", recipient: order.email, subject: `MoonMuse order update ✦ ${order.order_number}`, html: `<p>Hi ${escapeHtml(order.full_name)},</p><p>Your MoonMuse order <b>${escapeHtml(order.order_number)}</b> is now <b>${escapeHtml(patch.status)}</b>.</p><p>${escapeHtml(patch.latest_update || "Janvi will contact you if anything else is needed.")}</p><p><a href="${siteUrl}/track-order">Track your order securely</a></p>` });
      if (!email.ok) await db.from("admin_notifications").insert({ kind: "email_failed", title: `Status email failed for ${order.order_number}`, body: email.safeMessage, related_order_id: orderId });
    }
    return json({ success: true, emailStatus: email ? (email.ok ? "sent" : "failed") : "not_required" });
  } catch (error) {
    const message = safeError(error);
    console.error("admin-order failed", { message });
    return json({ error: message.includes("Owner") || message.includes("session") ? message : "Order update failed." }, message.includes("Owner") || message.includes("session") ? 403 : 500);
  }
});
