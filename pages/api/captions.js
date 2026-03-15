/**
 * /api/captions — Fetch YouTube auto-generated or manual captions.
 *
 * Uses native fetch + regex parsing instead of the heavy
 * @playzone/youtube-transcript package (which crashes on Vercel
 * serverless due to axios/xml2js/proxy-agent dependencies).
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { videoId } = req.query;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res
      .status(400)
      .json({ error: "A valid 11-character Video ID is required" });
  }

  try {
    // 1. Fetch the YouTube watch page to extract caption track URLs
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!pageRes.ok) {
      throw new Error(`YouTube returned HTTP ${pageRes.status}`);
    }

    const html = await pageRes.text();

    // 2. Extract the captions JSON from the page's ytInitialPlayerResponse
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      return res.status(404).json({
        error:
          "No captions available for this video. The video may not have subtitles, or YouTube blocked this request. Use the manual VTT paste fallback.",
      });
    }

    let captionTracks;
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch {
      throw new Error("Failed to parse caption track data from YouTube page");
    }

    // 3. Prefer English, fall back to first available track
    const enTrack =
      captionTracks.find((t) => t.languageCode === "en") ||
      captionTracks.find((t) => t.languageCode?.startsWith("en")) ||
      captionTracks[0];

    if (!enTrack?.baseUrl) {
      return res.status(404).json({
        error: "Caption track found but no URL available.",
      });
    }

    // 4. Fetch the caption XML (YouTube serves captions as timedtext XML)
    //    Validate the URL first to prevent SSRF
    const captionUrl = enTrack.baseUrl.replace(/&amp;/g, "&");
    let parsedCaptionUrl;
    try {
      parsedCaptionUrl = new URL(captionUrl);
    } catch {
      throw new Error("Invalid caption URL extracted from YouTube page");
    }
    const hostname = parsedCaptionUrl.hostname;
    const isSafeHost =
      hostname === "www.youtube.com" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".googlevideo.com") ||
      hostname.endsWith(".googleapis.com");
    if (!isSafeHost) {
      throw new Error("Caption URL points to unexpected host");
    }

    const captionRes = await fetch(captionUrl);
    if (!captionRes.ok) {
      throw new Error(`Caption fetch failed with HTTP ${captionRes.status}`);
    }

    const xml = await captionRes.text();

    // 5. Parse the XML with regex (lightweight — no xml2js dependency)
    //    Format: <text start="1.23" dur="4.56">Caption text here</text>
    const snippets = [];
    const textRegex =
      /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const startSec = parseFloat(match[1]);
      const durSec = parseFloat(match[2]);
      // Decode HTML entities in caption text
      const text = match[3]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, " ")
        .trim();

      if (text) {
        snippets.push({
          text,
          offset: Math.round(startSec * 1000), // milliseconds (frontend divides by 1000)
          duration: Math.round(durSec * 1000),
        });
      }
    }

    if (snippets.length === 0) {
      return res.status(404).json({
        error: "Caption XML was empty or could not be parsed.",
      });
    }

    res.status(200).json({ transcript: snippets });
  } catch (error) {
    console.error("YouTube transcript fetch error:", error?.message || error);
    res.status(500).json({
      error:
        "Failed to fetch transcript automatically. YouTube may have blocked this request from our server. Please use the manual CC import fallback.",
    });
  }
}
