const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Cadence (RPM) → Music BPM: standard cycling convention is 2x cadence
const RIDE_CONFIG = {
  hiit: {
    label: 'HIIT',
    description: 'High-intensity intervals — push hard, recover, repeat',
    minTempo: 180,
    maxTempo: 200,
    targetEnergy: 0.9,
  },
  tabata: {
    label: 'Tabata',
    description: '20s on, 10s off — 8 rounds of maximum effort',
    minTempo: 180,
    maxTempo: 200,
    targetEnergy: 0.9,
  },
  zone_endurance: {
    label: 'Zone Endurance',
    description: 'Sustained moderate effort — build your base',
    minTempo: 150,
    maxTempo: 170,
    targetEnergy: 0.65,
  },
  climb: {
    label: 'Climb',
    description: 'Dig deep, heavy resistance — conquer the hill',
    minTempo: 110,
    maxTempo: 130,
    targetEnergy: 0.75,
  },
  recovery: {
    label: 'Recovery',
    description: 'Easy effort — let your body rebuild',
    minTempo: 140,
    maxTempo: 180,
    targetEnergy: 0.5,
  },
};

// Map display genre names to Spotify seed_genre slugs
const GENRE_MAP = {
  Pop: 'pop',
  Rock: 'rock',
  Country: 'country',
  EDM: 'edm',
  'Hip-Hop/Rap': 'hip-hop',
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

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function getPlaylist(rideType, genre) {
  const rideConfig = RIDE_CONFIG[rideType];
  if (!rideConfig) throw new Error(`Unknown ride type: ${rideType}`);

  const seedGenre = GENRE_MAP[genre];
  if (!seedGenre) throw new Error(`Unknown genre: ${genre}`);

  const token = await getAccessToken();

  const params = new URLSearchParams({
    seed_genres: seedGenre,
    min_tempo: rideConfig.minTempo,
    max_tempo: rideConfig.maxTempo,
    target_energy: rideConfig.targetEnergy,
    limit: 20,
    market: 'US',
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Spotify recommendations failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json();

  return data.tracks.map((track) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    albumArt: track.album.images[1]?.url || track.album.images[0]?.url || null,
    durationMs: track.duration_ms,
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url,
  }));
}

export { RIDE_CONFIG, GENRE_MAP };
