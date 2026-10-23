import { createHmac, timingSafeEqual } from "node:crypto";
import { adminClient } from "@/lib/server/supabase";
import { ps, type PaystackSubscription } from "@/lib/server/paystack";
import { findRowByCode, getPlanRows } from "@/lib/server/plans";
import { ourPlanFor, planCodeOf } from "@/lib/server/subscription";

// Paystack calls this for payments and subscription changes. Set the URL in
// Paystack dashboard > Settings > API Keys & Webhooks:
//   https://<your-domain>/api/paystack/webhook
// Every request is checked against the HMAC-SHA512 signature before we trust it.

type Event = {
  event: string;
  data: {
    id?: number;
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    plan?: string | { plan_code?: string } | null;
    customer?: { customer_code?: string };
    subscription_code?: string;
    next_payment_date?: string | null;
    subscription?: { subscription_code?: string };
  };
};

function validSignature(raw: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let evt: Event;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }
  const d = evt.data ?? {};
  let claimedKey: string | null = null;

  try {
    const admin = adminClient();

    // Idempotency: Paystack retries, so process each event once.
    const key = `${evt.event}:${d.id ?? d.reference ?? d.subscription_code ?? ""}:${d.next_payment_date ?? ""}`;
    const { error: dup } = await admin
      .from("payment_events")
      .insert({ event_key: key, event: evt.event, payload: evt });
    if (dup?.code === "23505") return new Response("ok");
    if (dup) throw dup;
    claimedKey = key;

    const customer = d.customer?.customer_code;
    const subCode = d.subscription_code ?? d.subscription?.subscription_code;

    switch (evt.event) {
      case "charge.success": {
        // Renewals only. The first payment is activated by /api/billing/confirm,
        // which knows which user paid.
        const ours = await ourPlanFor({ plan: d.plan, amount: d.amount ?? 0, currency: d.currency ?? "" });
        if (!ours || !customer) break;
        const { data: row } = await admin
          .from("subscriptions")
          .select("user_id,paystack_subscription_code")
          .eq("paystack_customer_code", customer)
          .maybeSingle();
        if (!row) break;
        let next: string | null = null;
        if (row.paystack_subscription_code) {
          const s = await ps<PaystackSubscription>(`/subscription/${encodeURIComponent(row.paystack_subscription_code)}`).catch(() => null);
          next = s?.next_payment_date ?? null;
        }
        await admin
          .from("subscriptions")
          .update({ plan: ours.plan, interval: ours.interval, status: "active", ...(next ? { current_period_end: next } : {}) })
          .eq("user_id", row.user_id);
        break;
      }
      case "subscription.create": {
        const planRow = findRowByCode(await getPlanRows(), planCodeOf(d.plan));
        if (!customer || !planRow) break;
        const full = subCode
          ? await ps<PaystackSubscription>(`/subscription/${encodeURIComponent(subCode)}`).catch(() => null)
          : null;
        await admin
          .from("subscriptions")
          .update({
            plan: planRow.plan,
            interval: planRow.interval,
            status: "active",
            paystack_subscription_code: subCode,
            ...(full ? { paystack_email_token: full.email_token } : {}),
            current_period_end: d.next_payment_date ?? full?.next_payment_date ?? null,
          })
          .eq("paystack_customer_code", customer);
        break;
      }
      case "subscription.not_renew":
        if (subCode)
          await admin.from("subscriptions").update({ status: "non-renewing" }).eq("paystack_subscription_code", subCode);
        break;
      case "subscription.disable":
        if (subCode)
          await admin
            .from("subscriptions")
            .update({ plan: "free", status: "cancelled" })
            .eq("paystack_subscription_code", subCode);
        break;
      case "invoice.payment_failed":
        if (subCode)
          await admin.from("subscriptions").update({ status: "attention" }).eq("paystack_subscription_code", subCode);
        break;
    }
    return new Response("ok");
  } catch (e) {
    console.error("paystack webhook failed", evt.event, e);
    // Release the claim so Paystack's retry is processed instead of skipped.
    if (claimedKey) await adminClient().from("payment_events").delete().eq("event_key", claimedKey);
    return new Response("error", { status: 500 }); // Paystack will retry
  }
}
