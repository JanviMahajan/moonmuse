import { requireOwner } from "../_shared/auth.ts";
import { escapeHtml, getEmailConfigStatus, recordAndSend } from "../_shared/email.ts";
import { getWeb3FormsConfigStatus, getWeb3FormsOwnerEmail, recordAndSendOwnerNotification } from "../_shared/web3forms.ts";
import { corsHeaders, json, safeError } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { db } = await requireOwner(request);
    const body = await request.json();
    if (body.action === "config-status") return json({ configuration: { ...getEmailConfigStatus(), ...getWeb3FormsConfigStatus() } });
    if (body.action === "test") {
      const ownerEmail = getWeb3FormsOwnerEmail();
      if (!ownerEmail) return json({ error: "The owner notification email is not configured." }, 400);
      const result = await recordAndSendOwnerNotification(db, {
        emailType: "Test email",
        recipient: ownerEmail,
        fields: { subject: "MoonMuse test notification ✦", message: "MoonMuse server-side Web3Forms owner notifications are working." },
      });
      // Return provider rejections as a readable diagnostics result. A non-2xx
      // response is collapsed by the browser client into an unhelpful generic
      // Edge Function error.
      return json(result.ok
        ? { success: true, providerMessageId: result.providerMessageId }
        : { success: false, error: result.safeMessage, code: result.code });
    }
    if (body.action === "resend") {
      const deliveryId = String(body.deliveryId || "");
      const { data: delivery } = await db.from("email_deliveries").select("*,orders(order_number,full_name,email,whatsapp,subtotal,created_at,order_items(product_name,quantity,selected_options))").eq("id", deliveryId).maybeSingle();
      if (!delivery || delivery.status !== "Failed") return json({ error: "Only failed emails can be resent." }, 409);
      if (delivery.failed_at && Date.now() - new Date(delivery.failed_at).getTime() < 60_000) return json({ error: "Please wait one minute before retrying." }, 429);
      const order = delivery.orders;
      const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
      const retryRecipient = delivery.email_type === "Owner order notification" ? getWeb3FormsOwnerEmail() : order?.email?.trim();
      if (!retryRecipient) return json({ error: "The recipient email is not configured." }, 400);
      const result = delivery.email_type === "Owner order notification"
        ? await recordAndSendOwnerNotification(db, {
          deliveryId, orderId: delivery.order_id, recipient: retryRecipient,
          fields: {
            subject: `New MoonMuse Order ✦ ${order.order_number}`,
            "Order ID": order.order_number,
            "Customer name": order.full_name,
            "Customer email": order.email || "Not provided",
            "WhatsApp number": order.whatsapp,
            Product: (order.order_items || []).map((item: any) => `${item.product_name} × ${item.quantity}`).join("; "),
            "Selected options": (order.order_items || []).map((item: any) => `${item.product_name}: ${JSON.stringify(item.selected_options || {})}`).join("\n"),
            "Product subtotal": `₹${order.subtotal}`,
            "Order date": order.created_at,
            "Admin order link": `${siteUrl}/admin/orders/${delivery.order_id}`,
            message: `A new MoonMuse order was saved. Open it in the dashboard: ${siteUrl}/admin/orders/${delivery.order_id}`,
          },
        })
        : await recordAndSend(db, { deliveryId, orderId: delivery.order_id, emailType: delivery.email_type, recipient: retryRecipient, subject: `MoonMuse received your order ✦ ${order.order_number}`, html: `<h2>MoonMuse order ${escapeHtml(order.order_number)}</h2><p>Customer: ${escapeHtml(order.full_name)}</p><p>Subtotal: ₹${order.subtotal}</p><p><a href="${siteUrl}/admin/orders/${delivery.order_id}">Open order</a></p>` });
      return json(result.ok
        ? { success: true, providerMessageId: result.providerMessageId }
        : { success: false, error: result.safeMessage, code: result.code });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    const message = safeError(error);
    console.error("admin-email failed", { message });
    return json({ error: message.includes("Owner") || message.includes("session") ? message : "Email action failed." }, message.includes("Owner") || message.includes("session") ? 403 : 500);
  }
});
