import { getBpm } from './deezer.js';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const RIDE_CONFIG = {
  hiit: {
    label: 'HIIT',
    description: 'High-intensity intervals — push hard, recover, repeat',
    cadence: '90–100 RPM',
    searchTerms: 'HIIT high intensity interval workout',
    minBpm: 170,
    maxBpm: 210,
  },
  tabata: {
    label: 'Tabata',
    description: '20s on, 10s off — 8 rounds of maximum effort',
    cadence: '90–100 RPM',
    searchTerms: 'Tabata high intensity workout',
    minBpm: 170,
    maxBpm: 210,
  },
  zone_endurance: {
    label: 'Zone Endurance',
    description: 'Sustained moderate effort — build your base',
    cadence: '75–85 RPM',
    searchTerms: 'endurance cardio steady workout',
    minBpm: 140,
    maxBpm: 180,
  },
  climb: {
    label: 'Climb',
    description: 'Dig deep, heavy resistance — conquer the hill',
    cadence: '55–65 RPM',
    searchTerms: 'cycling climb power grind workout',
    minBpm: 100,
    maxBpm: 140,
  },
  recovery: {
    label: 'Recovery',
    description: 'Easy effort — let your body rebuild',
    cadence: '70–90 RPM',
    searchTerms: 'recovery cool down easy ride',
    minBpm: 120,
    maxBpm: 160,
  },
};

const GENRE_MAP = {
  Pop: 'pop',
  Rock: 'rock',
  Country: 'country',
  EDM: 'EDM electronic',
  'Hip-Hop/Rap': 'hip hop rap',
};

async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

function mapTrack(track) {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[1]?.url || track.album.images[0]?.url || null,
    durationMs: track.duration_ms,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url,
  };
}

async function searchTracks(token, query) {
  const params = new URLSearchParams({ q: query, type: 'track', limit: 10 });
  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks?.items?.filter(Boolean) ?? [];
}

async function enrichWithBpm(tracks) {
  // Look up BPM for all tracks in parallel
  const results = await Promise.all(
    tracks.map(async (track) => {
      const bpm = await getBpm(track.title, track.artist.split(', ')[0]);
      return { ...track, bpm };
    })
  );
  return results;
}

function filterByBpm(tracks, minBpm, maxBpm) {
  const inRange = tracks.filter((t) => t.bpm !== null && t.bpm >= minBpm && t.bpm <= maxBpm);

  // If we have at least 5 BPM-matched tracks, return those
  if (inRange.length >= 5) return inRange;

  // Otherwise relax the range by 15 BPM each side and retry
  const relaxed = tracks.filter(
    (t) => t.bpm !== null && t.bpm >= minBpm - 15 && t.bpm <= maxBpm + 15
  );
  if (relaxed.length >= 5) return relaxed;

  // Last resort: include tracks with unknown BPM as fallback
  const withFallback = [
    ...relaxed,
    ...tracks.filter((t) => t.bpm === null),
  ];
  return withFallback.length > 0 ? withFallback : tracks;
}

export async function getPlaylist(rideType, genre, artists = []) {
  const rideConfig = RIDE_CONFIG[rideType];
  if (!rideConfig) throw new Error(`Unknown ride type: ${rideType}`);

  const genreTerms = GENRE_MAP[genre] ?? 'pop';
  const token = await getAccessToken();
  const seenIds = new Set();
  const rawTracks = [];

  function addTracks(items) {
    for (const track of items) {
      if (!track?.id || seenIds.has(track.id)) continue;
      seenIds.add(track.id);
      rawTracks.push(mapTrack(track));
    }
  }

  if (artists.length > 0) {
    await Promise.all(
      artists.map(async (name) => {
        const items = await searchTracks(token, `artist:"${name}"`);
        addTracks(items);
      })
    );
    if (rawTracks.length < 5) {
      addTracks(await searchTracks(token, `${rideConfig.searchTerms} ${genreTerms}`));
    }
  } else {
    const [batch1, batch2] = await Promise.all([
      searchTracks(token, `${rideConfig.searchTerms} ${genreTerms}`),
      searchTracks(token, `${genreTerms} workout ${rideConfig.searchTerms}`),
    ]);
    addTracks(batch1);
    addTracks(batch2);
  }

  if (rawTracks.length === 0) throw new Error('No tracks found for this combination');

  // Enrich tracks with BPM data from Deezer, then filter by ride type range
  const enriched = await enrichWithBpm(rawTracks);
  const filtered = filterByBpm(enriched, rideConfig.minBpm, rideConfig.maxBpm);

  // Strip bpm field from final response (internal use only)
  return { tracks: filtered.map(({ bpm, ...track }) => track) };
}

export { RIDE_CONFIG, GENRE_MAP };
