import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const { adId, suggestedText, authorId } = req.body;

  if (!adId || !suggestedText) {
    return res.status(400).json({ error: "Missing adId or suggestedText" });
  }

  let userId = null;
  const token = req.headers.authorization?.split(" ")[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  if (token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  }

  try {
    const { data, error } = await supabase
      .from("ad_suggestions")
      .insert({
        ad_id: adId,
        suggested_text: suggestedText,
        author_id: authorId || "anonymous",
        ...(userId && { user_id: userId }),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Suggestion error:", error);
    res.status(500).json({ error: error.message || "Failed to save suggestion" });
  }
}
