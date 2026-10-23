import { type NextRequest } from "next/server";
import { DEFAULT_TOPICS, getCreativeNews, normalizeTopics } from "@/lib/news";

// Plain JSON endpoint so the web, desktop and mobile shells can all call it.
// ?topics=Motion,Typography lets each user follow their own list.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("topics");
  const topics = normalizeTopics(raw ? raw.split(",") : DEFAULT_TOPICS);
  const data = await getCreativeNews(topics.length ? topics : DEFAULT_TOPICS);
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
