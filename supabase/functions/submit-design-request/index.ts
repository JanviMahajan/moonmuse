import { adminClient } from "../_shared/auth.ts";
import { escapeHtml, recordAndSend } from "../_shared/email.ts";
import { corsHeaders as cors, json as reply, safeError } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const form = await request.formData();
    const required = ["fullName", "email", "whatsapp", "product", "instructions"];
    for (const key of required) if (!String(form.get(key) || "").trim()) return reply({ error: `${key} is required` }, 400);
    const email = String(form.get("email"));
    if (!/^\S+@\S+\.\S+$/.test(email)) return reply({ error: "Invalid email" }, 400);
    const product = String(form.get("product"));
    if (!["frame", "tote", "wallpaper"].includes(product)) return reply({ error: "Invalid product" }, 400);
    const supabase = adminClient();
    await enforceRateLimit(supabase, request, "submit-design-request", 5, 60);
    let orderNumber = "";
    let created: { id: string; order_number: string } | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      orderNumber = `MM${crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000}`;
      const { data, error } = await supabase.from("design_requests").insert({
        order_number: orderNumber, full_name: form.get("fullName"), email,
        whatsapp: form.get("whatsapp"), product,
        product_size: product === "frame" ? form.get("frameSize") : product === "tote" ? "One standard size" : null,
        frame_colour: product === "frame" ? form.get("frameColour") : null,
        wallpaper_device: product === "wallpaper" ? form.get("wallpaperDevice") : null,
        price_inr: Number(form.get("price") || 0), occasion: form.get("occasion") || null,
        recipient_name: form.get("recipientName") || null, important_date: form.get("importantDate") || null,
        personal_message: form.get("message") || null, preferred_colours: form.get("colours") || null,
        style_preference: form.get("style") || null, instructions: form.get("instructions"),
        shipping_status: product === "wallpaper" ? "Not required" : "To be confirmed",
      }).select("id,order_number").single();
      if (!error) created = data;
      else if (error.code !== "23505") throw error;
    }
    if (!created) throw new Error("Could not generate an order ID");
    const assets: Record<string, unknown>[] = [];
    for (const [key, value] of form.entries()) {
      if (!(value instanceof File) || !["photos", "references"].includes(key)) continue;
      if (value.size > 10 * 1024 * 1024 || !["image/jpeg","image/png","image/webp"].includes(value.type)) throw new Error(`Invalid upload: ${value.name}`);
      const safeName = value.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${orderNumber}/${key}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("design-requests").upload(path, value, { contentType: value.type, upsert: false });
      if (error) throw error;
      assets.push({ request_id: created.id, asset_type: key === "photos" ? "photo" : "reference", storage_path: path, filename: value.name, mime_type: value.type, byte_size: value.size });
    }
    if (assets.length) {
      const { error } = await supabase.from("design_request_assets").insert(assets);
      if (error) throw error;
    }
    await supabase.from("design_request_history").insert({ request_id: created.id, status: "New Request", customer_message: "Your design request has reached Janvi's studio." });
    const ownerEmail = Deno.env.get("OWNER_NOTIFICATION_EMAIL") || "";
    const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
    const name = escapeHtml(form.get("fullName"));
    const [ownerResult, customerResult] = await Promise.all([
      recordAndSend(supabase, { emailType: "Owner order notification", recipient: ownerEmail, subject: `New MoonMuse Design Request — ${orderNumber}`, html: `<h2>New design request ${orderNumber}</h2><p><b>Customer:</b> ${name} (${escapeHtml(email)})</p><p><b>WhatsApp:</b> ${escapeHtml(form.get("whatsapp"))}</p><p><b>Product:</b> ${escapeHtml(product)} · ${escapeHtml(form.get("selectedOption"))}</p><p><b>Occasion:</b> ${escapeHtml(form.get("occasion"))}</p><p><b>Message:</b> ${escapeHtml(form.get("message"))}</p><p><b>Colours:</b> ${escapeHtml(form.get("colours"))}</p><p><b>Instructions:</b> ${escapeHtml(form.get("instructions"))}</p><p><a href="${siteUrl}/admin">Open request securely</a></p>` }),
      recordAndSend(supabase, { emailType: "Customer order confirmation", recipient: email, subject: "MoonMuse received your design request ✦", html: `<p>Hi ${name},</p><p>Your MoonMuse design request has been received. Janvi will personally create your design and send you a preview for approval.</p><p><b>Order ID:</b> ${orderNumber}<br><b>Product:</b> ${escapeHtml(product)}<br><b>Options:</b> ${escapeHtml(form.get("selectedOption"))}<br><b>Status:</b> New Request</p>` }),
    ]);
    if (!ownerResult.ok || !customerResult.ok) await supabase.from("admin_notifications").insert({ kind: "email_failed", title: `Email warning for ${orderNumber}`, body: "A design-request email failed. Review email diagnostics." });
    return reply({ orderId: orderNumber, emailStatus: { owner: ownerResult.ok ? "sent" : "failed", customer: customerResult.ok ? "sent" : "failed" } });
  } catch (error) {
    const message = safeError(error);
    console.error("submit-design-request failed", { message });
    if (message === "rate_limit_exceeded") return reply({ error: "Too many requests. Please wait before trying again." }, 429);
    return reply({ error: "Your request could not be submitted. Please try again." }, 500);
  }
});
