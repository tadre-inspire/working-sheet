import { connection } from "next/server";
import { paystackConfigured } from "@/lib/server/paystack";
import { getPlanRows } from "@/lib/server/plans";

// Public: the prices customers will actually be charged, read from the plan
// table (nothing hard-coded). Amounts are per billing cycle, in ₦ / $.
export async function GET() {
  await connection(); // read env at request time, never bake it into the build
  if (!paystackConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ configured: false, rows: [] });
  }
  try {
    const rows = await getPlanRows();
    return Response.json({
      configured: rows.length > 0,
      rows: rows.map((r) => ({ plan: r.plan, interval: r.interval, currency: r.currency, amount: r.amount / 100 })),
    });
  } catch (e) {
    console.error("plans lookup failed", e);
    return Response.json({ configured: false, rows: [] });
  }
}
