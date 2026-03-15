import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const config = {
  api: { bodyParser: { sizeLimit: "10kb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const { adId, voterId, direction } = req.body;

  if (!adId || !UUID_RE.test(adId)) {
    return res.status(400).json({ error: "Invalid adId" });
  }

  if (!voterId || (direction !== 1 && direction !== -1)) {
    return res.status(400).json({ error: "Invalid vote data" });
  }

  // Require authentication — auth is the spam gate for all writes
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const safeVoterId = typeof voterId === "string" ? voterId.slice(0, 100) : "anonymous";

  try {
    const { error: voteError } = await supabase.from("votes").upsert(
      {
        ad_id: adId,
        voter_id: safeVoterId,
        direction: direction,
        user_id: user.id,
      },
      { onConflict: "ad_id, voter_id" },
    );
    if (voteError) throw voteError;

    const { data: voteRows, error: countError } = await supabase
      .from("votes")
      .select("direction")
      .eq("ad_id", adId);
    if (countError) throw countError;

    const totalVotes = (voteRows || []).reduce((sum, v) => sum + v.direction, 0);

    const { error: updateError } = await supabase
      .from("audio_descriptions")
      .update({ votes: totalVotes })
      .eq("id", adId);
    if (updateError) throw updateError;

    res.status(200).json({ votes: totalVotes });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
}
