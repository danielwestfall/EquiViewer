import { YouTubeTranscriptApi } from "@playzone/youtube-transcript";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  try {
    const api = new YouTubeTranscriptApi();
    const transcript = await api.fetch(videoId);

    // Normalize to a simple { text, offset, duration } array for the frontend
    const snippets = transcript.snippets.map((s) => ({
      text: s.text,
      offset: s.start * 1000, // convert seconds → milliseconds (frontend expects ms)
      duration: s.duration * 1000,
    }));

    res.status(200).json({ transcript: snippets });
  } catch (error) {
    console.error("YouTube transcript fetch error:", error?.message || error);
    res.status(500).json({
      error:
        "Failed to fetch transcript automatically. YouTube may have blocked this request. Please use the manual CC import fallback.",
    });
  }
}
