// Server-only helpers for the Paystack REST API. Never import from client code:
// they read PAYSTACK_SECRET_KEY.

const BASE = "https://api.paystack.co";

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

export type PaystackPlan = { id: number; plan_code: string; name: string; amount: number; currency: string; interval: string };
export type PaystackSubscription = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
  customer: { id: number; customer_code: string; email: string };
  plan: { plan_code: string };
};
export type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata: { user_id?: string } | null;
  plan: { plan_code?: string } | null;
  customer: { id: number; customer_code: string; email: string };
};

export async function ps<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Paystack is not configured");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status) throw new Error(json?.message ?? `Paystack ${res.status}`);
  return json.data as T;
}
