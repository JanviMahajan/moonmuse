type Web3FormsResult =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; code: string; safeMessage: string; temporary: boolean };

function config() {
  const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY")?.trim();
  const ownerEmail = Deno.env.get("OWNER_NOTIFICATION_EMAIL")?.trim();
  return { accessKey, ownerEmail };
}

export function getWeb3FormsConfigStatus() {
  const { accessKey, ownerEmail } = config();
  return { web3FormsAccessKey: Boolean(accessKey), ownerNotificationEmail: Boolean(ownerEmail) };
}

export function getWeb3FormsOwnerEmail() {
  return config().ownerEmail || null;
}

export async function sendOwnerNotification(fields: Record<string, string>): Promise<Web3FormsResult> {
  const { accessKey } = config();
  if (!accessKey) return { ok: false, code: "missing_web3forms_key", safeMessage: "WEB3FORMS_ACCESS_KEY is not configured.", temporary: false };
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: accessKey, from_name: "MoonMuse Orders", ...fields }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.success !== true) {
      const code = response.status === 429 ? "web3forms_rate_limit" : `web3forms_${response.status || "rejected"}`;
      console.error("Web3Forms notification failed", { status: response.status, code, message: String(body?.message || "rejected").slice(0, 160) });
      return {
        ok: false,
        code,
        safeMessage: response.status === 429 ? "Web3Forms rate limit reached." : "Web3Forms rejected the owner notification.",
        temporary: response.status === 429 || response.status >= 500,
      };
    }
    console.info("Web3Forms accepted owner notification");
    return { ok: true, providerMessageId: null };
  } catch (error) {
    console.error("Web3Forms network failure", { message: error instanceof Error ? error.message : "unknown" });
    return { ok: false, code: "web3forms_network_failure", safeMessage: "Web3Forms could not be reached.", temporary: true };
  }
}

export async function recordAndSendOwnerNotification(db: any, input: {
  orderId?: string;
  recipient: string;
  fields: Record<string, string>;
  deliveryId?: string;
  emailType?: "Owner order notification" | "Test email";
}) {
  let deliveryId = input.deliveryId;
  if (!deliveryId) {
    const { data, error } = await db.from("email_deliveries").insert({
      order_id: input.orderId || null,
      email_type: input.emailType || "Owner order notification",
      recipient: input.recipient,
      provider: "web3forms",
      status: "Sending",
      attempt_count: 1,
    }).select("id").single();
    if (error) throw new Error("Could not record owner notification attempt");
    deliveryId = data.id;
  } else {
    const { data } = await db.from("email_deliveries").select("attempt_count,status").eq("id", deliveryId).single();
    if (!data || data.status !== "Failed") throw new Error("Only failed notifications can be resent");
    await db.from("email_deliveries").update({
      provider: "web3forms", recipient: input.recipient, status: "Sending",
      attempt_count: data.attempt_count + 1, updated_at: new Date().toISOString(),
    }).eq("id", deliveryId);
  }
  const result = await sendOwnerNotification(input.fields);
  if (result.ok) {
    await db.from("email_deliveries").update({ status: "Sent", provider: "web3forms", provider_message_id: null, sent_at: new Date().toISOString(), failed_at: null, last_error_code: null, last_error_message_safe: null, updated_at: new Date().toISOString() }).eq("id", deliveryId);
  } else {
    await db.from("email_deliveries").update({ status: "Failed", provider: "web3forms", last_error_code: result.code, last_error_message_safe: result.safeMessage, failed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", deliveryId);
  }
  return { deliveryId, ...result };
}
