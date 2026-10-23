import { supabase } from "./supabase";

// The topics you follow in the news feed, saved to your account.
export async function loadRemoteTopics(): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("user_topics")
    .select("topic")
    .order("created_at", { ascending: true });
  if (error || !data.length) return null;
  return data.map((r) => r.topic);
}

export async function saveRemoteTopics(userId: string, topics: string[]) {
  const del = await supabase.from("user_topics").delete().eq("user_id", userId);
  if (del.error) return;
  await supabase
    .from("user_topics")
    .insert(topics.map((topic) => ({ user_id: userId, topic })));
}
