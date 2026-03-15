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

  const { adId, suggestedText, authorId } = req.body;

  if (!adId || !UUID_RE.test(adId)) {
    return res.status(400).json({ error: "Invalid adId" });
  }

  if (!suggestedText || typeof suggestedText !== "string" || suggestedText.trim().length === 0) {
    return res.status(400).json({ error: "Missing suggestedText" });
  }

  if (suggestedText.length > 2000) {
    return res.status(400).json({ error: "suggestedText too long (max 2000 chars)" });
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

  const safeAuthorId = typeof authorId === "string" ? authorId.slice(0, 100) : "anonymous";

  try {
    const { data, error } = await supabase
      .from("ad_suggestions")
      .insert({
        ad_id: adId,
        suggested_text: suggestedText.trim(),
        author_id: safeAuthorId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({ error: "Failed to save suggestion" });
  }
}
