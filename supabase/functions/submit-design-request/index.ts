import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]!);

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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
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
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const ownerEmail = Deno.env.get("MOONMUSE_OWNER_EMAIL");
    const siteUrl = Deno.env.get("SITE_URL") || "http://127.0.0.1:5173";
    const from = Deno.env.get("MOONMUSE_FROM_EMAIL") || "MoonMuse <orders@moonmuse.in>";
    const send = async (to: string, subject: string, html: string) => {
      if (!resendKey) return;
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html }) });
      if (!response.ok) console.error("Resend error", await response.text());
    };
    const name = escapeHtml(form.get("fullName"));
    if (ownerEmail) await send(ownerEmail, `New MoonMuse Design Request — ${orderNumber}`, `<h2>New design request ${orderNumber}</h2><p><b>Customer:</b> ${name} (${escapeHtml(email)})</p><p><b>WhatsApp:</b> ${escapeHtml(form.get("whatsapp"))}</p><p><b>Product:</b> ${escapeHtml(product)} · ${escapeHtml(form.get("selectedOption"))}</p><p><b>Occasion:</b> ${escapeHtml(form.get("occasion"))}</p><p><b>Message:</b> ${escapeHtml(form.get("message"))}</p><p><b>Colours:</b> ${escapeHtml(form.get("colours"))}</p><p><b>Instructions:</b> ${escapeHtml(form.get("instructions"))}</p><p><a href="${siteUrl}/admin/orders/${orderNumber}">Open request securely</a></p>`);
    await send(email, "MoonMuse received your design request ✦", `<p>Hi ${name},</p><p>Your MoonMuse design request has been received. Janvi will personally create your design and send you a preview by email.</p><p><b>Order ID:</b> ${orderNumber}<br><b>Product:</b> ${escapeHtml(product)}<br><b>Options:</b> ${escapeHtml(form.get("selectedOption"))}<br><b>Status:</b> New Request</p><p><a href="${siteUrl}/status">Track your order</a></p>`);
    return reply({ orderId: orderNumber });
  } catch (error) {
    console.error(error);
    return reply({ error: error instanceof Error ? error.message : "Submission failed" }, 500);
  }
});
