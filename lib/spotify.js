const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const RIDE_CONFIG = {
  hiit: {
    label: 'HIIT',
    description: 'High-intensity intervals — push hard, recover, repeat',
    cadence: '90–100 RPM',
    searchTerms: 'HIIT high intensity interval workout',
  },
  tabata: {
    label: 'Tabata',
    description: '20s on, 10s off — 8 rounds of maximum effort',
    cadence: '90–100 RPM',
    searchTerms: 'Tabata high intensity workout',
  },
  zone_endurance: {
    label: 'Zone Endurance',
    description: 'Sustained moderate effort — build your base',
    cadence: '75–85 RPM',
    searchTerms: 'endurance cardio steady workout',
  },
  climb: {
    label: 'Climb',
    description: 'Dig deep, heavy resistance — conquer the hill',
    cadence: '55–65 RPM',
    searchTerms: 'cycling climb power grind workout',
  },
  recovery: {
    label: 'Recovery',
    description: 'Easy effort — let your body rebuild',
    cadence: '70–90 RPM',
    searchTerms: 'recovery cool down easy ride',
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

export async function getPlaylist(rideType, genre, artists = []) {
  const rideConfig = RIDE_CONFIG[rideType];
  if (!rideConfig) throw new Error(`Unknown ride type: ${rideType}`);

  const genreTerms = GENRE_MAP[genre];
  if (!genreTerms) throw new Error(`Unknown genre: ${genre}`);

  const token = await getAccessToken();
  const seenIds = new Set();
  const tracks = [];

  function addTracks(items) {
    for (const track of items) {
      if (!track?.id || seenIds.has(track.id)) continue;
      seenIds.add(track.id);
      tracks.push(mapTrack(track));
    }
  }

  if (artists.length > 0) {
    // Fetch up to 10 tracks per artist using the artist: search qualifier
    await Promise.all(
      artists.map(async (name) => {
        const items = await searchTracks(token, `artist:"${name}"`);
        addTracks(items);
      })
    );

    // If artists returned very few tracks, backfill with keyword search
    if (tracks.length < 5) {
      const items = await searchTracks(
        token,
        `${rideConfig.searchTerms} ${genreTerms}`
      );
      addTracks(items);
    }
  } else {
    // No artists — use two keyword searches for ~20 tracks
    const [batch1, batch2] = await Promise.all([
      searchTracks(token, `${rideConfig.searchTerms} ${genreTerms}`),
      searchTracks(token, `${genreTerms} workout ${rideConfig.searchTerms}`),
    ]);
    addTracks(batch1);
    addTracks(batch2);
  }

  if (tracks.length === 0) throw new Error('No tracks found for this combination');

  return { tracks };
}

export { RIDE_CONFIG, GENRE_MAP };
