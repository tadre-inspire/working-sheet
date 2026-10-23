import { adminClient, requireUser } from "@/lib/server/supabase";
import { paystackConfigured, ps } from "@/lib/server/paystack";

// Returns Paystack's hosted page where the customer updates their card or cancels.
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  if (!paystackConfigured()) return Response.json({ error: "Billing isn't set up yet." }, { status: 503 });

  try {
    const { data } = await adminClient()
      .from("subscriptions")
      .select("paystack_subscription_code")
      .eq("user_id", user.id)
      .maybeSingle();
    const code = data?.paystack_subscription_code;
    if (!code) return Response.json({ error: "No subscription found." }, { status: 404 });

    const link = await ps<{ link: string }>(`/subscription/${encodeURIComponent(code)}/manage/link`);
    return Response.json({ url: link.link });
  } catch (e) {
    console.error("portal failed", e);
    return Response.json({ error: "Couldn't open subscription settings." }, { status: 502 });
  }
}
