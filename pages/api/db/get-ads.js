import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { videoId } = req.query;

  if (!videoId || !VIDEO_ID_RE.test(videoId)) {
    return res.status(400).json({ error: 'A valid 11-character video ID is required' });
  }

  try {
    // 1. Fetch all AD sets for this video
    const { data: sets, error: setsError } = await supabase
      .from('ad_sets')
      .select('*')
      .eq('video_id', videoId)
      .order('votes', { ascending: false });

    if (setsError) throw setsError;

    // 2. Fetch all individual ADs for these sets
    const { data: ads, error: adsError } = await supabase
      .from('audio_descriptions')
      .select('*')
      .eq('video_id', videoId)
      .order('time', { ascending: true });

    if (adsError) throw adsError;

    // 3. Group ADs into their sets
    const setsWithAds = sets.map(set => ({
      ...set,
      ads: ads.filter(ad => ad.set_id === set.id)
    }));

    res.status(200).json(setsWithAds);
  } catch (error) {
    console.error('Get ADs error:', error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
