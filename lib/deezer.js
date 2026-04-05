const DEEZER_API = 'https://api.deezer.com';

// Look up BPM for a track by title + artist via Deezer.
// Returns the BPM as a number, or null if not found / no data.
export async function getBpm(title, artist) {
  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const searchRes = await fetch(`${DEEZER_API}/search?q=${query}&limit=1`);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const track = searchData.data?.[0];
    if (!track?.id) return null;

    const trackRes = await fetch(`${DEEZER_API}/track/${track.id}`);
    if (!trackRes.ok) return null;

    const trackData = await trackRes.json();
    const bpm = trackData.bpm;

    // Deezer returns 0 when BPM is unknown
    return bpm && bpm > 0 ? bpm : null;
  } catch {
    return null;
  }
}
