import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_MODES = new Set(["pause", "duck"]);

export const config = {
  api: { bodyParser: { sizeLimit: "100kb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Database not configured" });
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

  const { video, ads, authorId, setName } = req.body;

  if (!video?.id || !Array.isArray(ads)) {
    return res.status(400).json({ error: "Missing video or ads data" });
  }

  if (!VIDEO_ID_RE.test(video.id)) {
    return res.status(400).json({ error: "Invalid video ID format" });
  }

  if (ads.length > 200) {
    return res.status(400).json({ error: "Too many ADs in one request (max 200)" });
  }

  const finalSetName = typeof setName === "string" ? setName.slice(0, 100).trim() || "Untitled Set" : "Untitled Set";
  const safeTitle = typeof video.title === "string" ? video.title.slice(0, 500) : "";
  const safeAuthor = typeof video.author === "string" ? video.author.slice(0, 200) : "";
  const safeAuthorId = typeof authorId === "string" ? authorId.slice(0, 100) : "anonymous";

  for (let i = 0; i < ads.length; i++) {
    const ad = ads[i];
    if (ad.id !== undefined && !UUID_RE.test(ad.id)) {
      return res.status(400).json({ error: `AD[${i}] has invalid id format` });
    }
    if (typeof ad.time !== "number" || !isFinite(ad.time) || ad.time < 0) {
      return res.status(400).json({ error: `AD[${i}] has invalid time` });
    }
    if (typeof ad.text !== "string" || ad.text.length > 2000) {
      return res.status(400).json({ error: `AD[${i}] text is missing or too long (max 2000 chars)` });
    }
    if (ad.mode !== undefined && !VALID_MODES.has(ad.mode)) {
      return res.status(400).json({ error: `AD[${i}] has invalid mode (must be "pause" or "duck")` });
    }
    if (ad.rate !== undefined && (typeof ad.rate !== "number" || ad.rate < 0.1 || ad.rate > 10)) {
      return res.status(400).json({ error: `AD[${i}] has invalid rate (must be 0.1–10)` });
    }
    if (ad.voice !== undefined && ad.voice !== null && typeof ad.voice !== "string") {
      return res.status(400).json({ error: `AD[${i}] has invalid voice` });
    }
  }

  try {
    const { error: videoError } = await supabase.from("videos").upsert(
      { id: video.id, title: safeTitle, author: safeAuthor },
      { onConflict: "id" },
    );
    if (videoError) throw videoError;

    const { data: setData, error: setError } = await supabase
      .from("ad_sets")
      .insert({
        video_id: video.id,
        name: finalSetName,
        author_id: safeAuthorId,
        user_id: user.id,
      })
      .select()
      .single();
    if (setError) throw setError;

    const rows = ads.map((ad) => ({
      ...(ad.id && { id: ad.id }),
      video_id: video.id,
      set_id: setData.id,
      time: ad.time,
      text: ad.text.trim(),
      mode: ad.mode || "pause",
      voice: typeof ad.voice === "string" ? ad.voice.slice(0, 100) : null,
      rate: ad.rate || 1.0,
      author_id: safeAuthorId,
      user_id: user.id,
    }));

    const { data, error: adsError } = await supabase
      .from("audio_descriptions")
      .upsert(rows, { onConflict: "id" })
      .select();
    if (adsError) throw adsError;

    res.status(200).json({ saved: data.length, ads: data });
  } catch (error) {
    console.error("Save ADs error:", error);
    res.status(500).json({ error: "Failed to save" });
  }
}
