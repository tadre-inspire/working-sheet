import { requireUser } from "@/lib/server/supabase";
import { paystackConfigured, ps, type PaystackTransaction } from "@/lib/server/paystack";
import { activateFromTransaction, ourPlanFor } from "@/lib/server/subscription";

// Called when Paystack sends the customer back to /billing?reference=...
// We ask Paystack directly whether the payment succeeded and belongs to this
// user, so the page doesn't have to wait for the webhook.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!paystackConfigured()) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { reference?: unknown } | null;
  const ref = typeof body?.reference === "string" ? body.reference : "";
  if (!/^[\w.-]{6,100}$/.test(ref)) return Response.json({ error: "Bad reference." }, { status: 400 });

  try {
    const tx = await ps<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(ref)}`);
    if (tx.status !== "success") return Response.json({ status: tx.status });
    if (tx.metadata?.user_id !== user.id) return Response.json({ error: "That payment isn't yours." }, { status: 403 });
    const row = await ourPlanFor(tx);
    if (!row) return Response.json({ error: "Not a Working Sheet plan payment." }, { status: 400 });

    await activateFromTransaction(user.id, tx, row);
    return Response.json({ status: "success" });
  } catch (e) {
    console.error("confirm failed", e);
    return Response.json({ error: "Couldn't confirm the payment yet." }, { status: 502 });
  }
}
