import { adminClient } from "../_shared/auth.ts";
import { escapeHtml, recordAndSend } from "../_shared/email.ts";
import { recordAndSendOwnerNotification } from "../_shared/web3forms.ts";
import { corsHeaders, json, safeError } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

type CartItem = { productId?: string; title: string; unitPrice: number; quantity: number; options?: Record<string, unknown>; previewPath?: string };

const validEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
const validPhone = (value: string) => /^\+?[0-9][0-9\s-]{7,18}$/.test(value);
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const hashToken = async (token: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
const token = () => hex(crypto.getRandomValues(new Uint8Array(24)).buffer);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const customer = body?.customer || {};
    const items = Array.isArray(body?.items) ? body.items as CartItem[] : [];
    const required = ["fullName", "email", "whatsapp", "address", "city", "state", "pinCode"];
    if (required.some((key) => !String(customer[key] || "").trim())) return json({ error: "Please complete all required delivery fields." }, 400);
    if (!validEmail(String(customer.email))) return json({ error: "Enter a valid email address." }, 400);
    if (!validPhone(String(customer.whatsapp))) return json({ error: "Enter a WhatsApp number with country code." }, 400);
    if (!items.length || items.length > 25) return json({ error: "Your cart is empty or too large." }, 400);
    if (items.some((item) => !item.title || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20 || !Number.isInteger(item.unitPrice) || item.unitPrice < 0)) return json({ error: "The cart contains invalid items." }, 400);

    const idempotencyKey = String(request.headers.get("x-idempotency-key") || body?.idempotencyKey || "");
    if (!/^[a-f0-9-]{20,80}$/i.test(idempotencyKey)) return json({ error: "Invalid checkout request. Refresh and try again." }, 400);
    const db = adminClient();
    await enforceRateLimit(db, request, "create-order", 8, 60);
    const { data: existing } = await db.from("orders").select("id,order_number").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) {
      const replacementToken = token();
      await db.from("orders").update({ access_token_hash: await hashToken(replacementToken) }).eq("id", existing.id);
      return json({ orderId: existing.order_number, trackingToken: replacementToken, alreadyCreated: true, emailStatus: "previously_attempted", confirmationMessage: "Your existing order request was found. No duplicate order was created." });
    }

    const trackingToken = token();
    const trackingHash = await hashToken(trackingToken);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const now = new Date().toISOString();
    let order: { id: string; order_number: string; created_at: string } | null = null;
    let orderNumber = "";
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      orderNumber = `MM${crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000}`;
      const { data, error: orderError } = await db.from("orders").insert({
        order_number: orderNumber, full_name: String(customer.fullName).trim(), email: String(customer.email).trim().toLowerCase(),
        whatsapp: String(customer.whatsapp).trim(), address: String(customer.address).trim(), city: String(customer.city).trim(),
        state: String(customer.state).trim(), pin_code: String(customer.pinCode).trim(), note: String(customer.note || "").trim() || null,
        status: "New Request", payment_status: "Pending", subtotal, handmade_accepted: true,
        access_token_hash: trackingHash, idempotency_key: idempotencyKey, latest_update: "Your order has reached Janvi's studio.",
      }).select("id,order_number,created_at").single();
      if (!orderError) order = data;
      else if (orderError.code !== "23505") throw new Error("Could not save order");
      else {
        const { data: duplicate } = await db.from("orders").select("id,order_number").eq("idempotency_key", idempotencyKey).maybeSingle();
        if (duplicate) {
          await db.from("orders").update({ access_token_hash: trackingHash }).eq("id", duplicate.id);
          return json({ orderId: duplicate.order_number, trackingToken, alreadyCreated: true, confirmationMessage: "Your existing order request was found. No duplicate order was created." });
        }
      }
    }
    if (!order) throw new Error("Could not generate a unique order number");

    const itemRows = items.map((item) => ({
      order_id: order.id, product_id: /^[0-9a-f-]{36}$/i.test(item.productId || "") ? item.productId : null,
      product_name: item.title.slice(0, 180), creation_mode: "guest-checkout", unit_price: item.unitPrice,
      quantity: item.quantity, selected_options: item.options || {}, preview_path: item.previewPath || null,
    }));
    const { error: itemsError } = await db.from("order_items").insert(itemRows);
    if (itemsError) throw new Error("Order was saved but its items could not be saved");
    await db.from("admin_notifications").insert({ kind: "new_order", title: `New order ${orderNumber}`, body: `${customer.fullName} placed a new order request.`, related_order_id: order.id });

    const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
    const ownerEmail = (Deno.env.get("OWNER_NOTIFICATION_EMAIL") || "").trim();
    const ownerWhatsApp = (Deno.env.get("OWNER_WHATSAPP") || "").replace(/\D/g, "");
    const itemHtml = items.map((item) => `<li>${escapeHtml(item.title)} × ${item.quantity} — ₹${item.unitPrice * item.quantity}${Object.keys(item.options || {}).length ? `<br><small>${escapeHtml(JSON.stringify(item.options))}</small>` : ""}</li>`).join("");
    const customerHtml = `<p>Hi ${escapeHtml(customer.fullName)},</p><p>Your MoonMuse order request has been received. Janvi will contact you to confirm the design, delivery charge and payment.</p><p><b>Order ID:</b> ${escapeHtml(orderNumber)}</p><ul>${itemHtml}</ul><p><b>Subtotal:</b> ₹${subtotal}<br><b>Shipping:</b> To be confirmed<br><b>Payment:</b> Pending confirmation</p><p><a href="${siteUrl}/track-order?token=${trackingToken}">Secure Track Order</a>${ownerWhatsApp ? ` &nbsp; <a href="https://wa.me/${ownerWhatsApp}">Message Janvi on WhatsApp</a>` : ""}</p>`;

    const products = items.map((item) => `${item.title} × ${item.quantity}`).join("; ");
    const selectedOptions = items.map((item) => `${item.title}: ${Object.keys(item.options || {}).length ? JSON.stringify(item.options) : "None"}`).join("\n");
    const adminOrderLink = `${siteUrl}/admin/orders/${order.id}`;

    const [ownerResult, customerResult] = await Promise.all([
      recordAndSendOwnerNotification(db, {
        orderId: order.id,
        recipient: ownerEmail,
        fields: {
          subject: `New MoonMuse Order ✦ ${orderNumber}`,
          "Order ID": orderNumber,
          "Customer name": customer.fullName,
          "Customer email": String(customer.email || "Not provided"),
          "WhatsApp number": customer.whatsapp,
          Product: products,
          "Selected options": selectedOptions,
          "Product subtotal": `₹${subtotal}`,
          "Order date": now,
          "Admin order link": adminOrderLink,
          message: `A new MoonMuse order was saved. Open it in the dashboard: ${adminOrderLink}`,
        },
      }),
      recordAndSend(db, { orderId: order.id, emailType: "Customer order confirmation", recipient: String(customer.email).trim(), subject: `MoonMuse received your order ✦ ${orderNumber}`, html: customerHtml }),
    ]);
    if (!ownerResult.ok || !customerResult.ok) await db.from("admin_notifications").insert({ kind: "email_failed", title: `Email warning for ${orderNumber}`, body: "One or more order emails failed. Open the order to retry.", related_order_id: order.id });

    return json({
      orderId: orderNumber, trackingToken,
      emailStatus: { owner: ownerResult.ok ? "sent" : "failed", customer: customerResult.ok ? "sent" : "failed" },
      confirmationMessage: customerResult.ok ? "Your order has been received and a confirmation email was accepted for delivery." : "Your order has been received, but we could not send the confirmation email. Please save your order ID.",
    }, 201);
  } catch (error) {
    const message = safeError(error);
    console.error("create-order failed", { message });
    if (message === "rate_limit_exceeded") return json({ error: "Too many order attempts. Please wait before trying again." }, 429);
    return json({ error: "We could not submit the order. No payment was taken. Please try again." }, 500);
  }
});
