// Single source of truth for plans and prices. Plain TypeScript with no
// framework imports, so the Paystack sync script can read it directly.
//
// Both currencies are fixed prices set here. Naira prices are NOT converted from
// dollars, so customers never see a charge move when the exchange rate does.
// After changing a price, run `npm run billing:sync -- --apply` to update Paystack.

export type PaidPlan = "pro" | "business" | "business_large";
export type PlanId = "free" | PaidPlan;
export type Interval = "month" | "year";
export type Currency = "NGN" | "USD";

export const PAID_PLANS: PaidPlan[] = ["pro", "business", "business_large"];

/** The Free plan: this many new projects (top-level pages) per calendar month. */
export const FREE_PROJECTS_PER_MONTH = 1;

export const PLAN_INFO: Record<
  PaidPlan,
  {
    name: string;
    users: string;
    /** Price per month in each currency. `year` is the per-month price when billed yearly (about 15% off). */
    perMonth: Record<Currency, Record<Interval, number>>;
  }
> = {
  pro: {
    name: "Pro",
    users: "1 user",
    perMonth: { USD: { month: 20, year: 17 }, NGN: { month: 17000, year: 14500 } },
  },
  business: {
    name: "Business",
    users: "Up to 5 users",
    perMonth: { USD: { month: 59, year: 50 }, NGN: { month: 50000, year: 42500 } },
  },
  business_large: {
    name: "Business",
    users: "6 or more users",
    perMonth: { USD: { month: 300, year: 255 }, NGN: { month: 200000, year: 170000 } },
  },
};

export const planKey = (plan: PaidPlan, interval: Interval, currency: Currency) =>
  `${plan}:${interval}:${currency}`;

/** What the customer is charged each billing cycle, in major units (₦ or $). */
export function chargeFor(plan: PaidPlan, interval: Interval, currency: Currency): number {
  const perMonth = PLAN_INFO[plan].perMonth[currency][interval];
  return interval === "year" ? perMonth * 12 : perMonth;
}

export const isPaidPlan = (v: unknown): v is PaidPlan => PAID_PLANS.includes(v as PaidPlan);
export const isInterval = (v: unknown): v is Interval => v === "month" || v === "year";
export const isCurrency = (v: unknown): v is Currency => v === "NGN" || v === "USD";

export const planLabel = (plan: PlanId) =>
  plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Business";
