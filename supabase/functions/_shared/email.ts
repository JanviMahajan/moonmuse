type EmailResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; code: string; safeMessage: string; temporary: boolean };

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export { escapeHtml };

function emailConfig() {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  const ownerEmail = Deno.env.get("OWNER_NOTIFICATION_EMAIL");
  const siteUrl = Deno.env.get("PUBLIC_SITE_URL");
  const missing = [!apiKey && "RESEND_API_KEY", !from && "EMAIL_FROM", !ownerEmail && "OWNER_NOTIFICATION_EMAIL", !siteUrl && "PUBLIC_SITE_URL"].filter(Boolean);
  if (missing.length) return { ok: false as const, missing: missing as string[] };
  return { ok: true as const, apiKey: apiKey!, from: from!, ownerEmail: ownerEmail!, siteUrl: siteUrl!.replace(/\/$/, "") };
}

export function getEmailConfigStatus() {
  const config = emailConfig();
  return config.ok
    ? { resendApiKey: true, ownerNotificationEmail: true, senderEmail: true, publicSiteUrl: true }
    : {
      resendApiKey: !config.missing.includes("RESEND_API_KEY"),
      ownerNotificationEmail: !config.missing.includes("OWNER_NOTIFICATION_EMAIL"),
      senderEmail: !config.missing.includes("EMAIL_FROM"),
      publicSiteUrl: !config.missing.includes("PUBLIC_SITE_URL"),
    };
}

export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<EmailResult> {
  const config = emailConfig();
  if (!config.ok) return { ok: false, code: "missing_configuration", safeMessage: `Email service is missing: ${config.missing.join(", ")}`, temporary: false };
  if (!/^\S+@\S+\.\S+$/.test(input.to)) return { ok: false, code: "invalid_recipient", safeMessage: "The recipient email address is invalid.", temporary: false };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.from, to: [input.to], subject: input.subject, html: input.html }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = String(body?.name || body?.statusCode || `http_${response.status}`);
      const safeMessage = response.status === 429 ? "Email provider rate limit reached."
        : response.status === 401 || response.status === 403 ? "Email provider credentials or sender authorization are invalid."
        : response.status === 422 ? "The sender or recipient was rejected by the email provider."
        : "The email provider rejected the message.";
      console.error("Resend request failed", { status: response.status, code });
      return { ok: false, code, safeMessage, temporary: response.status === 429 || response.status >= 500 };
    }
    if (!body?.id) return { ok: false, code: "missing_provider_id", safeMessage: "Email provider did not return a message ID.", temporary: true };
    console.info("Resend accepted email", { providerMessageId: body.id, recipientDomain: input.to.split("@")[1] });
    return { ok: true, providerMessageId: String(body.id) };
  } catch (error) {
    console.error("Resend network failure", { message: error instanceof Error ? error.message : "unknown" });
    return { ok: false, code: "network_failure", safeMessage: "The email provider could not be reached.", temporary: true };
  }
}

export async function recordAndSend(db: any, input: { orderId?: string; emailType: string; recipient: string; subject: string; html: string; deliveryId?: string }) {
  let deliveryId = input.deliveryId;
  if (!deliveryId) {
    const { data, error } = await db.from("email_deliveries").insert({ order_id: input.orderId || null, email_type: input.emailType, recipient: input.recipient, status: "Sending", attempt_count: 1 }).select("id").single();
    if (error) throw new Error("Could not record email attempt");
    deliveryId = data.id;
  } else {
    const { data } = await db.from("email_deliveries").select("attempt_count,status").eq("id", deliveryId).single();
    if (!data || data.status !== "Failed") throw new Error("Only failed emails can be resent");
    await db.from("email_deliveries").update({ status: "Sending", attempt_count: data.attempt_count + 1, updated_at: new Date().toISOString() }).eq("id", deliveryId);
  }
  const result = await sendEmail(input);
  if (result.ok) {
    await db.from("email_deliveries").update({ status: "Sent", provider_message_id: result.providerMessageId, sent_at: new Date().toISOString(), failed_at: null, last_error_code: null, last_error_message_safe: null, updated_at: new Date().toISOString() }).eq("id", deliveryId);
  } else {
    await db.from("email_deliveries").update({ status: "Failed", last_error_code: result.code, last_error_message_safe: result.safeMessage, failed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", deliveryId);
  }
  return { deliveryId, ...result };
}

