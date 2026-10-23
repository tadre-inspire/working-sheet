import { adminClient } from "./supabase";
import { ps, type PaystackSubscription, type PaystackTransaction } from "./paystack";
import { findRowByCode, getPlanRows, type PlanRow } from "./plans";

type PlanRef = string | { plan_code?: string } | null | undefined;
export const planCodeOf = (p: PlanRef) => (typeof p === "string" ? p : p?.plan_code);

/** The plan row a Paystack transaction paid for, or undefined if it wasn't ours. */
export async function ourPlanFor(tx: { plan?: PlanRef; amount: number; currency: string }): Promise<PlanRow | undefined> {
  const rows = await getPlanRows();
  const byCode = findRowByCode(rows, planCodeOf(tx.plan));
  if (byCode) return byCode;
  // Fallback: a unique match on amount and currency.
  const matches = rows.filter((r) => r.amount === tx.amount && r.currency === tx.currency);
  return matches.length === 1 ? matches[0] : undefined;
}

/** Mark a user as subscribed from a verified successful transaction, then pull
 *  the subscription codes (needed later to manage or cancel) from Paystack. */
export async function activateFromTransaction(userId: string, tx: PaystackTransaction, row: PlanRow) {
  const admin = adminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: row.plan,
      interval: row.interval,
      status: "active",
      currency: row.currency,
      paystack_customer_code: tx.customer.customer_code,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  // The subscription is created just after the first charge, so it can lag a moment.
  for (let attempt = 0; attempt < 3; attempt++) {
    const subs = await ps<PaystackSubscription[]>(`/subscription?customer=${tx.customer.id}`);
    const sub = subs.find((s) => s.plan.plan_code === row.plan_code && s.status === "active");
    if (sub) {
      await admin
        .from("subscriptions")
        .update({
          paystack_subscription_code: sub.subscription_code,
          paystack_email_token: sub.email_token,
          current_period_end: sub.next_payment_date,
        })
        .eq("user_id", userId);
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}
