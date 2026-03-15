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
    const { data, error } = await supabase
      .from('diy_steps')
      .select('*')
      .eq('video_id', videoId)
      .order('start_time', { ascending: true });

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (error) {
    console.error('Get DIY error:', error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
}
