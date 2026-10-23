import { cacheLife } from "next/cache";
import { DEFAULT_TOPICS } from "./topics";

// Creative news for filmmakers, motion designers and designers.
// Free publisher RSS feeds only: no API key, no paid service.
// Built-in topics map to feeds; any other topic the user adds is a keyword
// filter over all the feeds.

export { DEFAULT_TOPICS };

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: string;
  published: string; // ISO
  image?: string;
  video?: boolean;
};

type Feed = { source: string; url: string; video?: boolean };

const BUILTIN: Record<string, Feed[]> = {
  Filmmaking: [
    { source: "No Film School", url: "https://nofilmschool.com/rss.xml" },
    { source: "Filmmaker Magazine", url: "https://www.filmmakermagazine.com/feed/" },
    { source: "PremiumBeat", url: "https://www.premiumbeat.com/blog/feed/" },
  ],
  Motion: [
    { source: "Motionographer", url: "https://motionographer.com/feed/" },
    { source: "Stash Media", url: "https://www.stashmedia.tv/feed/" },
    { source: "Studio Daily", url: "https://www.studiodaily.com/feed/" },
  ],
  Animation: [{ source: "Cartoon Brew", url: "https://www.cartoonbrew.com/feed" }],
  Videos: [
    { source: "Vimeo Staff Picks", url: "https://vimeo.com/channels/staffpicks/videos/rss", video: true },
  ],
  Design: [
    { source: "Dezeen", url: "https://www.dezeen.com/design/feed/" },
    { source: "Designboom", url: "https://www.designboom.com/feed/" },
    { source: "Creative Boom", url: "https://www.creativeboom.com/feed/" },
    { source: "Creative Bloq", url: "https://www.creativebloq.com/feeds.xml" },
  ],
  Photography: [
    { source: "PetaPixel", url: "https://petapixel.com/feed/" },
    { source: "Fstoppers", url: "https://www.fstoppers.com/rss.xml" },
  ],
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  "&apos;": "'", "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“",
  "&#8221;": "”", "&#8211;": "–", "&#8212;": "—", "&#038;": "&", "&#8230;": "…",
};

function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&#?\w+;/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? clean(m[1]) : "";
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Some publisher feeds carry paid gambling posts; keep them out.
const SPAM = /\b(casino|betting|bookmaker|gambl\w*|slots?|sportsbook|poker)\b/i;

const decodeAll = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&");

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

// Only https images (upgrade plain http, which browsers block as mixed content).
function safeUrl(u: string | undefined): string | undefined {
  if (!u || u.length > 600 || !/^https?:\/\//i.test(u)) return undefined;
  return u.replace(/^http:\/\//i, "https://");
}

// Best picture for a story: media tags first, then enclosure, then first <img>.
function findImage(raw: string): string | undefined {
  const thumb = raw.match(/<media:thumbnail[^>]*\burl=["']([^"']+)["']/i)?.[1];
  if (safeUrl(thumb)) return safeUrl(decodeAll(thumb!));
  for (const m of raw.matchAll(/<media:content\b[^>]*>/gi)) {
    const tag = m[0];
    const u = tag.match(/\burl=["']([^"']+)["']/i)?.[1];
    if (!u || /medium=["']video["']|type=["']video/i.test(tag)) continue;
    if (/medium=["']image["']|type=["']image/i.test(tag) || IMG_EXT.test(u)) {
      if (safeUrl(u)) return safeUrl(decodeAll(u));
    }
  }
  for (const m of raw.matchAll(/<enclosure\b[^>]*>/gi)) {
    const u = m[0].match(/\burl=["']([^"']+)["']/i)?.[1];
    if (u && (/type=["']image/i.test(m[0]) || IMG_EXT.test(u)) && safeUrl(u)) return safeUrl(decodeAll(u));
  }
  const html = decodeAll(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
  for (const m of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    if (/[/_-]pixel\.(gif|png)|tracking|1x1|avatar|emoji|spacer/i.test(m[1])) continue;
    if (safeUrl(m[1])) return safeUrl(m[1]);
  }
}

function findYouTube(raw: string): string | undefined {
  const html = decodeAll(raw);
  return html.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/i)?.[1];
}

function parseFeed(xml: string, isVideoFeed = false) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const out: {
    title: string; summary: string; url: string; published: string; image?: string; video?: boolean;
  }[] = [];
  for (const b of blocks.slice(0, 20)) {
    const title = pick(b, "title");
    const url =
      pick(b, "link") ||
      b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)?.[1] ||
      b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ||
      "";
    const date = pick(b, "pubDate") || pick(b, "published") || pick(b, "updated") || pick(b, "dc:date");
    const ts = Date.parse(date);
    if (!title || !url.startsWith("http") || Number.isNaN(ts)) continue;
    if (SPAM.test(title)) continue;
    const summary = (pick(b, "description") || pick(b, "summary")).slice(0, 220);
    const yt = findYouTube(b);
    const image = findImage(b) ?? (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined);
    out.push({
      title, summary, url, published: new Date(ts).toISOString(),
      image, video: isVideoFeed || !!yt,
    });
  }
  return out;
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WorkingSheetBot/0.1)",
      Accept: "application/rss+xml,application/xml,text/xml,*/*",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

export function normalizeTopics(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.replace(/[^\p{L}\p{N} .+\-]/gu, "").trim().slice(0, 40);
    if (t.length < 2 || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length === 15) break;
  }
  return out;
}

const builtinKey = (t: string) =>
  Object.keys(BUILTIN).find((k) => k.toLowerCase() === t.toLowerCase());

export async function getCreativeNews(
  topics: string[],
): Promise<{ items: NewsItem[]; failed: string[] }> {
  "use cache";
  // Fresh for 5 min, revalidate every 15, never serve older than an hour.
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  const custom = topics.filter((t) => !builtinKey(t));
  const builtinWanted = topics.map(builtinKey).filter((k): k is string => !!k);

  // Custom keywords can match any feed, so fetch them all in that case.
  const feedTopics = custom.length ? Object.keys(BUILTIN) : builtinWanted;
  const jobs = feedTopics.flatMap((topic) =>
    BUILTIN[topic].map((feed) => ({ topic, feed })),
  );
  const results = await Promise.allSettled(
    jobs.map(async (j) => parseFeed(await getText(j.feed.url), j.feed.video)),
  );

  const failed: string[] = [];
  const all: NewsItem[] = [];
  results.forEach((r, i) => {
    const { topic, feed } = jobs[i];
    if (r.status === "rejected") return void failed.push(feed.source);
    for (const e of r.value) {
      const base = {
        id: e.url, title: e.title, summary: e.summary, url: e.url,
        source: feed.source, published: e.published, image: e.image, video: e.video,
      };
      if (builtinWanted.includes(topic)) all.push({ ...base, topic });
      for (const kw of custom) {
        if (new RegExp(`\\b${escapeRe(kw)}`, "i").test(`${e.title} ${e.summary}`))
          all.push({ ...base, topic: kw });
      }
    }
  });

  // Newest first; one entry per URL and topic; cap per topic.
  all.sort((a, b) => b.published.localeCompare(a.published));
  const seen = new Set<string>();
  const count: Record<string, number> = {};
  const items = all.filter((it) => {
    const key = `${it.topic}|${it.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    count[it.topic] = (count[it.topic] ?? 0) + 1;
    return count[it.topic] <= 10;
  });

  return { items: items.slice(0, 80), failed };
}
