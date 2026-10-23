import { isCurrency, isInterval, isPaidPlan } from "@/lib/pricing";
import { paystackConfigured, ps } from "@/lib/server/paystack";
import { findRow, getPlanRows } from "@/lib/server/plans";
import { adminClient, requireUser } from "@/lib/server/supabase";

// Starts a Paystack checkout for the signed-in user. The plan, price and
// currency come from our plan table, never from the browser.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user?.email) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!paystackConfigured()) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { plan?: unknown; interval?: unknown; currency?: unknown } | null;
  if (!isPaidPlan(body?.plan) || !isInterval(body?.interval) || !isCurrency(body?.currency)) {
    return Response.json({ error: "Choose a plan, billing period and currency." }, { status: 400 });
  }
  const { plan, interval, currency } = body;

  try {
    const admin = adminClient();
    const { data: current } = await admin
      .from("subscriptions")
      .select("plan,status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (current && current.plan !== "free" && ["active", "non-renewing", "attention"].includes(current.status)) {
      return Response.json({ error: "You already have a paid plan. Use Manage subscription to change it." }, { status: 409 });
    }

    const row = findRow(await getPlanRows(), plan, interval, currency);
    if (!row) return Response.json({ error: "That plan isn't available yet." }, { status: 503 });

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const tx = await ps<{ authorization_url: string; reference: string }>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: row.amount,
        currency: row.currency,
        plan: row.plan_code,
        callback_url: `${site}/billing`,
        metadata: { user_id: user.id, plan, interval },
      }),
    });
    return Response.json({ url: tx.authorization_url });
  } catch (e) {
    console.error("checkout failed", e);
    return Response.json({ error: "Couldn't start checkout. Try again." }, { status: 502 });
  }
}
