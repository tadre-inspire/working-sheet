// Single source of truth for plans and prices. Plain TypeScript with no
// framework imports, so the Paystack sync script can read it directly.
//
// USD prices are set here. Naira prices are fixed amounts derived from a rate
// you choose when you run `npm run billing:sync -- --rate <naira per dollar>`,
// so customers never see a charge move on its own. Re-run it to review prices.

export type PaidPlan = "pro" | "business" | "business_large";
export type PlanId = "free" | PaidPlan;
export type Interval = "month" | "year";
export type Currency = "NGN" | "USD";

export const PAID_PLANS: PaidPlan[] = ["pro", "business", "business_large"];

export const PLAN_INFO: Record<
  PaidPlan,
  { name: string; users: string; usdPerMonth: Record<Interval, number> }
> = {
  // `year` is the per-month price when billed yearly (about 15% off).
  pro: { name: "Pro", users: "1 user", usdPerMonth: { month: 20, year: 17 } },
  business: { name: "Business", users: "Up to 5 users", usdPerMonth: { month: 59, year: 50 } },
  business_large: { name: "Business", users: "6 or more users", usdPerMonth: { month: 300, year: 255 } },
};

export const planKey = (plan: PaidPlan, interval: Interval, currency: Currency) =>
  `${plan}:${interval}:${currency}`;

/** What the customer is charged each billing cycle, in major units (₦ or $). */
export function chargeFor(plan: PaidPlan, interval: Interval, currency: Currency, nairaPerUsd: number): number {
  const usdMonthly = PLAN_INFO[plan].usdPerMonth[interval];
  const perMonth = currency === "USD" ? usdMonthly : Math.round((usdMonthly * nairaPerUsd) / 500) * 500;
  return interval === "year" ? perMonth * 12 : perMonth;
}

export const isPaidPlan = (v: unknown): v is PaidPlan => PAID_PLANS.includes(v as PaidPlan);
export const isInterval = (v: unknown): v is Interval => v === "month" || v === "year";
export const isCurrency = (v: unknown): v is Currency => v === "NGN" || v === "USD";

export const planLabel = (plan: PlanId) =>
  plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business";
