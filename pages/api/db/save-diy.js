import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const { video, steps, authorId } = req.body;

  if (!video?.id || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Missing video or steps data" });
  }

  if (!VIDEO_ID_RE.test(video.id)) {
    return res.status(400).json({ error: "Invalid video ID format" });
  }

  if (steps.length > 100) {
    return res.status(400).json({ error: "Too many steps in one request (max 100)" });
  }

  const safeTitle = typeof video.title === "string" ? video.title.slice(0, 500) : "";
  const safeAuthor = typeof video.author === "string" ? video.author.slice(0, 200) : "";
  const safeAuthorId = typeof authorId === "string" ? authorId.slice(0, 100) : "anonymous";

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.id !== undefined && !UUID_RE.test(s.id)) {
      return res.status(400).json({ error: `Step[${i}] has invalid id format` });
    }
    if (typeof s.startTime !== "number" || !isFinite(s.startTime) || s.startTime < 0) {
      return res.status(400).json({ error: `Step[${i}] has invalid startTime` });
    }
    if (typeof s.endTime !== "number" || !isFinite(s.endTime) || s.endTime < s.startTime) {
      return res.status(400).json({ error: `Step[${i}] has invalid endTime` });
    }
    if (s.text !== undefined && (typeof s.text !== "string" || s.text.length > 2000)) {
      return res.status(400).json({ error: `Step[${i}] text is too long (max 2000 chars)` });
    }
    if (s.rate !== undefined && (typeof s.rate !== "number" || s.rate < 0.1 || s.rate > 10)) {
      return res.status(400).json({ error: `Step[${i}] has invalid rate (must be 0.1–10)` });
    }
  }

  try {
    const { error: videoError } = await supabase.from("videos").upsert(
      { id: video.id, title: safeTitle, author: safeAuthor },
      { onConflict: "id" },
    );
    if (videoError) throw videoError;

    const rows = steps.map((s) => ({
      ...(s.id && { id: s.id }),
      video_id: video.id,
      start_time: s.startTime,
      end_time: s.endTime,
      text: typeof s.text === "string" ? s.text.trim() : "",
      voice: typeof s.voice === "string" ? s.voice.slice(0, 100) : null,
      rate: s.rate || 1.0,
      author_id: safeAuthorId,
      user_id: user.id,
    }));

    const { data, error: stepsError } = await supabase
      .from("diy_steps")
      .upsert(rows, { onConflict: "id" })
      .select();
    if (stepsError) throw stepsError;

    res.status(200).json({ saved: data.length });
  } catch (error) {
    console.error("Save DIY error:", error);
    res.status(500).json({ error: "Failed to save" });
  }
}
