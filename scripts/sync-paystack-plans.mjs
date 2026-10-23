// Creates or updates the Paystack plans for every tier, interval and currency,
// then records their codes in the `paystack_plans` table.
//
//   npm run billing:sync -- --rate 1550            # dry run: prints the price table
//   npm run billing:sync -- --rate 1550 --apply    # creates / updates the plans
//
// --rate is naira per US dollar. It is required on purpose: a wrong default
// would put wrong prices in front of customers. Existing subscribers keep the
// price they signed up at (we never update existing subscriptions).

import { createClient } from "@supabase/supabase-js";
import { PAID_PLANS, PLAN_INFO, chargeFor, planKey } from "../lib/pricing.ts";

try {
  process.loadEnvFile(".env.local");
} catch {
  // env may already be set by the shell
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const rateIdx = args.indexOf("--rate");
const rate = rateIdx >= 0 ? Number(args[rateIdx + 1]) : NaN;
if (!Number.isFinite(rate) || rate < 100) {
  console.error("Pass the current rate, e.g. --rate 1550 (naira per US dollar).");
  process.exit(1);
}

const secret = process.env.PAYSTACK_SECRET_KEY;
const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (apply && (!secret || !sbKey)) {
  console.error("--apply needs PAYSTACK_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY in web/.env.local");
  process.exit(1);
}

const money = (cur, n) => (cur === "USD" ? `$${n.toLocaleString("en-US")}` : `₦${n.toLocaleString("en-NG")}`);
const wanted = [];
for (const plan of PAID_PLANS) {
  for (const interval of ["month", "year"]) {
    for (const currency of ["USD", "NGN"]) {
      const charge = chargeFor(plan, interval, currency, rate);
      const info = PLAN_INFO[plan];
      wanted.push({
        key: planKey(plan, interval, currency),
        plan,
        interval,
        currency,
        amount: charge * 100, // kobo / cents
        name: `Working Sheet ${info.name} (${info.users}) ${interval === "month" ? "monthly" : "yearly"} ${currency}`,
        psInterval: interval === "month" ? "monthly" : "annually",
        charge,
      });
    }
  }
}

console.log(`\nRate: ₦${rate.toLocaleString()} per $1\n`);
console.table(
  wanted.map((w) => ({
    plan: w.plan,
    billed: w.interval === "month" ? "monthly" : "yearly",
    currency: w.currency,
    "charged each cycle": money(w.currency, w.charge),
  })),
);

if (!apply) {
  console.log("Dry run only. Add --apply to create these in Paystack.");
  process.exit(0);
}

const admin = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
const { data: existing, error: readErr } = await admin.from("paystack_plans").select("key,plan_code");
if (readErr) throw readErr;
const have = new Map(existing.map((r) => [r.key, r.plan_code]));

async function paystack(path, method, body) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(`${path}: ${json.message ?? res.status}`);
  return json.data;
}

// One plan failing (for example a currency your Paystack account hasn't enabled yet)
// must not stop the rest, so each plan is tried on its own and failures are listed at the end.
const failed = [];
for (const w of wanted) {
  try {
    const body = { name: w.name, interval: w.psInterval, amount: w.amount, currency: w.currency };
    let code = have.get(w.key);
    if (code) {
      await paystack(`/plan/${code}`, "PUT", { ...body, update_existing_subscriptions: false });
      console.log(`updated  ${w.key}`);
    } else {
      code = (await paystack("/plan", "POST", body)).plan_code;
      console.log(`created  ${w.key} -> ${code}`);
    }
    const { error } = await admin.from("paystack_plans").upsert({
      key: w.key,
      plan: w.plan,
      interval: w.interval,
      currency: w.currency,
      amount: w.amount,
      plan_code: code,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (e) {
    console.warn(`skipped  ${w.key}: ${e.message}`);
    failed.push(w.key);
  }
}
console.log(`\nDone. ${wanted.length - failed.length} of ${wanted.length} plans are set up.`);
if (failed.length) {
  console.log(`Not created: ${failed.join(", ")}`);
  console.log("If these are USD plans, enable USD in your Paystack account, then run this again.");
  process.exitCode = 1;
}
