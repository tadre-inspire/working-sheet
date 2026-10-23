import { adminClient } from "./supabase";
import type { Currency, Interval, PaidPlan } from "../pricing";

// Plan codes live in the `paystack_plans` table, filled by `npm run billing:sync`.
export type PlanRow = {
  key: string;
  plan: PaidPlan;
  interval: Interval;
  currency: Currency;
  amount: number; // kobo / cents charged each cycle
  plan_code: string;
};

export async function getPlanRows(): Promise<PlanRow[]> {
  const { data, error } = await adminClient()
    .from("paystack_plans")
    .select("key,plan,interval,currency,amount,plan_code");
  if (error) throw error;
  return data as PlanRow[];
}

export const findRow = (rows: PlanRow[], plan: PaidPlan, interval: Interval, currency: Currency) =>
  rows.find((r) => r.plan === plan && r.interval === interval && r.currency === currency);

export const findRowByCode = (rows: PlanRow[], code: string | undefined | null) =>
  code ? rows.find((r) => r.plan_code === code) : undefined;
