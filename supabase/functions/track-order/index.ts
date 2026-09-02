import { adminClient } from "../_shared/auth.ts";
import { corsHeaders, json, safeError } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const hashToken = async (token: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const db = adminClient();
    await enforceRateLimit(db, request, "track-order", 20, 15);
    let query = db.from("orders").select("id,order_number,status,latest_update,subtotal,delivery_charge,final_total,payment_status,tracking_number,created_at,order_items(product_name,quantity,unit_price,selected_options,preview_path)");
    if (body.token) query = query.eq("access_token_hash", await hashToken(String(body.token)));
    else {
      const orderId = String(body.orderId || "").trim().toUpperCase();
      const identity = String(body.identity || "").trim().toLowerCase();
      if (!/^MM\d{4,8}$/.test(orderId) || (!/^\S+@\S+\.\S+$/.test(identity) && !/^\+?[0-9][0-9\s-]{7,18}$/.test(identity))) return json({ error: "Enter your order ID and matching email or WhatsApp number." }, 400);
      query = query.eq("order_number", orderId).eq(identity.includes("@") ? "email" : "whatsapp", identity);
    }
    const { data: order, error } = await query.maybeSingle();
    if (error || !order) return json({ error: "We could not verify an order with those details." }, 404);
    return json({ order: { ...order, id: undefined } });
  } catch (error) {
    const message = safeError(error);
    console.error("track-order failed", { message });
    if (message === "rate_limit_exceeded") return json({ error: "Too many tracking attempts. Please wait and try again." }, 429);
    return json({ error: "Order tracking is temporarily unavailable." }, 500);
  }
});
