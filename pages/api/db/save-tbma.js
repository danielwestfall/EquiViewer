import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_BLOCK_TYPES = new Set(["dialog", "action"]);
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

  const { video, blocks, authorId } = req.body;

  if (!video?.id || !Array.isArray(blocks)) {
    return res.status(400).json({ error: "Missing video or blocks data" });
  }

  if (!VIDEO_ID_RE.test(video.id)) {
    return res.status(400).json({ error: "Invalid video ID format" });
  }

  if (blocks.length > 500) {
    return res.status(400).json({ error: "Too many blocks in one request (max 500)" });
  }

  const safeTitle = typeof video.title === "string" ? video.title.slice(0, 500) : "";
  const safeAuthor = typeof video.author === "string" ? video.author.slice(0, 200) : "";
  const safeAuthorId = typeof authorId === "string" ? authorId.slice(0, 100) : "anonymous";

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.id !== undefined && !UUID_RE.test(b.id)) {
      return res.status(400).json({ error: `Block[${i}] has invalid id format` });
    }
    if (!VALID_BLOCK_TYPES.has(b.type)) {
      return res.status(400).json({ error: `Block[${i}] has invalid type (must be "dialog" or "action")` });
    }
    if (typeof b.time !== "number" || !isFinite(b.time) || b.time < 0) {
      return res.status(400).json({ error: `Block[${i}] has invalid time` });
    }
    if (typeof b.text !== "string" || b.text.length > 2000) {
      return res.status(400).json({ error: `Block[${i}] text is missing or too long (max 2000 chars)` });
    }
    if (b.mode !== undefined && !VALID_MODES.has(b.mode)) {
      return res.status(400).json({ error: `Block[${i}] has invalid mode (must be "pause" or "duck")` });
    }
    if (b.rate !== undefined && (typeof b.rate !== "number" || b.rate < 0.1 || b.rate > 10)) {
      return res.status(400).json({ error: `Block[${i}] has invalid rate (must be 0.1–10)` });
    }
  }

  try {
    const { error: videoError } = await supabase.from("videos").upsert(
      { id: video.id, title: safeTitle, author: safeAuthor },
      { onConflict: "id" },
    );
    if (videoError) throw videoError;

    const setId = crypto.randomUUID();

    const rows = blocks.map((b, index) => ({
      ...(b.id && { id: b.id }),
      video_id: video.id,
      set_id: setId,
      block_type: b.type,
      time: b.time,
      text: b.text.trim(),
      voice: typeof b.voice === "string" ? b.voice.slice(0, 100) : null,
      rate: b.rate || 1.0,
      mode: b.mode || "pause",
      sort_order: index,
      author_id: safeAuthorId,
      user_id: user.id,
    }));

    const { data, error: blocksError } = await supabase
      .from("tbma_blocks")
      .upsert(rows, { onConflict: "id" })
      .select();
    if (blocksError) throw blocksError;

    res.status(200).json({ saved: data.length, setId });
  } catch (error) {
    console.error("Save TBMA error:", error);
    res.status(500).json({ error: "Failed to save" });
  }
}
