import { requireOwner } from "../_shared/auth.ts";
import { escapeHtml, getEmailConfigStatus, recordAndSend } from "../_shared/email.ts";
import { corsHeaders, json, safeError } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db, user } = await requireOwner(request);
    const body = await request.json();
    if (body.action === "config-status") return json({ configuration: getEmailConfigStatus() });
    if (body.action === "test") {
      if (!user.email) return json({ error: "The owner account has no email address." }, 400);
      const result = await recordAndSend(db, { emailType: "Test email", recipient: user.email, subject: "MoonMuse email test ✦", html: `<p>This confirms that MoonMuse server-side email is working for ${escapeHtml(user.email)}.</p>` });
      return json(result.ok ? { success: true, providerMessageId: result.providerMessageId } : { success: false, error: result.safeMessage }, result.ok ? 200 : 502);
    }
    if (body.action === "resend") {
      const deliveryId = String(body.deliveryId || "");
      const { data: delivery } = await db.from("email_deliveries").select("*,orders(order_number,full_name,email,whatsapp,subtotal)").eq("id", deliveryId).maybeSingle();
      if (!delivery || delivery.status !== "Failed") return json({ error: "Only failed emails can be resent." }, 409);
      if (delivery.failed_at && Date.now() - new Date(delivery.failed_at).getTime() < 60_000) return json({ error: "Please wait one minute before retrying." }, 429);
      const order = delivery.orders;
      const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
      const result = await recordAndSend(db, { deliveryId, orderId: delivery.order_id, emailType: delivery.email_type, recipient: delivery.recipient, subject: delivery.email_type === "Owner order notification" ? `New MoonMuse Order — ${order.order_number}` : `MoonMuse received your order ✦ ${order.order_number}`, html: `<h2>MoonMuse order ${escapeHtml(order.order_number)}</h2><p>Customer: ${escapeHtml(order.full_name)}</p><p>Subtotal: ₹${order.subtotal}</p><p><a href="${siteUrl}/admin/orders/${delivery.order_id}">Open order</a></p>` });
      return json(result.ok ? { success: true, providerMessageId: result.providerMessageId } : { success: false, error: result.safeMessage }, result.ok ? 200 : 502);
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = safeError(error);
    console.error("admin-email failed", { message });
    return json({ error: message.includes("Owner") || message.includes("session") ? message : "Email action failed." }, message.includes("Owner") || message.includes("session") ? 403 : 500);
  }
});

