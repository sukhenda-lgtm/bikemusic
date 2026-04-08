'use client';

import { useState, useRef } from 'react';
import Turnstile from 'react-turnstile';
import SongCard from '@/components/SongCard';

const RIDE_TYPES = [
  { id: 'hiit', label: 'HIIT', description: 'High-intensity intervals', cadence: '90–100 RPM', icon: '⚡' },
  { id: 'tabata', label: 'Tabata', description: '20s on / 10s off', cadence: '90–100 RPM', icon: '🔥' },
  { id: 'zone_endurance', label: 'Zone Endurance', description: 'Sustained moderate effort', cadence: '75–85 RPM', icon: '💪' },
  { id: 'climb', label: 'Climb', description: 'Heavy resistance, uphill grind', cadence: '55–65 RPM', icon: '⛰️' },
  { id: 'recovery', label: 'Recovery', description: 'Easy, relaxed pace', cadence: '70–90 RPM', icon: '🌀' },
];

const GENRES = ['Pop', 'Rock', 'Country', 'EDM', 'Hip-Hop/Rap'];

const MUSIC_MODES = [
  {
    id: 'genre',
    label: 'Browse by Genre',
    description: "Pick a genre and we'll find matching workout tracks",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
  },
  {
    id: 'artists',
    label: 'Choose Your Artists',
    description: 'Enter up to 5 artists or bands you want to ride to',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
];

const ARTIST_PLACEHOLDERS = ['Beyoncé', 'AC/DC', 'Post Malone', 'Taylor Swift', 'Eminem'];

function formatDuration(tracks) {
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
  const totalMin = Math.round(totalMs / 60000);
  return `${totalMin} min`;
}

export default function Home() {
  const [selectedRide, setSelectedRide] = useState(null);
  const [musicMode, setMusicMode] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [artists, setArtists] = useState(['', '', '', '', '']);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasResults, setHasResults] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isCustomView, setIsCustomView] = useState(false);
  const isDev = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === 'true';
  const [turnstileToken, setTurnstileToken] = useState(isDev ? 'dev' : null);
  const [turnstileStatus, setTurnstileStatus] = useState('loading'); // 'loading' | 'verified' | 'error'
  const turnstileRef = useRef(null);

  function selectMode(mode) {
    setMusicMode(mode);
    if (mode === 'genre') setArtists(['', '', '', '', '']);
    if (mode === 'artists') setSelectedGenre(null);
  }

  function updateArtist(index, value) {
    setArtists((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function clearArtist(index) {
    setArtists((prev) => prev.map((a, i) => (i === index ? '' : a)));
  }

  function toggleSong(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function buildCustomPlaylist() {
    setIsCustomView(true);
  }

  function backToFullResults() {
    setIsCustomView(false);
  }

  const filledArtists = artists.filter((a) => a.trim());
  const canGenerate =
    selectedRide &&
    musicMode &&
    (musicMode === 'genre' ? !!selectedGenre : filledArtists.length > 0) &&
    !!turnstileToken;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    setIsCustomView(false);

    const params = new URLSearchParams({ rideType: selectedRide });
    if (musicMode === 'genre') {
      params.set('genre', selectedGenre);
    } else {
      params.set('genre', 'Pop');
      params.set('artists', filledArtists.join(','));
    }
    params.set('cf-turnstile-response', turnstileToken);

    try {
      const res = await fetch(`/api/playlist?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setTracks(data.tracks);
      setHasResults(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }

  function handleReset() {
    setHasResults(false);
    setTracks([]);
    setSelectedRide(null);
    setMusicMode(null);
    setSelectedGenre(null);
    setArtists(['', '', '', '', '']);
    setError(null);
    setSelectedIds(new Set());
    setIsCustomView(false);
  }

  const rideLabel = RIDE_TYPES.find((r) => r.id === selectedRide)?.label;
  const displayTracks = isCustomView ? tracks.filter((t) => selectedIds.has(t.id)) : tracks;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">BIKE MUSIC</span>
          </div>
          {hasResults && (
            <button onClick={handleReset} className="text-sm text-[#a3a3a3] hover:text-white transition-colors">
              ← Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 pb-32">
        {!hasResults ? (
          <>
            {/* Hero */}
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-black tracking-tighter mb-3 leading-none">
                FIND YOUR<span className="text-orange-500"> RHYTHM</span>
              </h1>
              <p className="text-[#a3a3a3] text-lg">
                Choose your ride and your sound. We&apos;ll handle the rest.
              </p>
            </div>

            {/* Step 01 — Ride Type */}
            <section className="mb-10">
              <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                01 — Select Your Ride
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RIDE_TYPES.map((ride) => (
                  <button
                    key={ride.id}
                    onClick={() => setSelectedRide(ride.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRide === ride.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-[#2a2a2a] bg-[#141414] hover:border-[#444]'
                    }`}
                  >
                    <div className="text-2xl mb-2">{ride.icon}</div>
                    <div className="font-bold text-sm uppercase tracking-wide">{ride.label}</div>
                    <div className="text-[#a3a3a3] text-xs mt-1">{ride.description}</div>
                    <div className="text-orange-400 text-xs font-mono mt-2">{ride.cadence}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Step 02 — Music Mode */}
            <section className="mb-10">
              <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                02 — How Do You Want to Pick Your Music?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MUSIC_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => selectMode(mode.id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      musicMode === mode.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-[#2a2a2a] bg-[#141414] hover:border-[#444]'
                    }`}
                  >
                    <div className={`mb-3 ${musicMode === mode.id ? 'text-orange-400' : 'text-[#666]'}`}>
                      {mode.icon}
                    </div>
                    <div className="font-bold text-sm uppercase tracking-wide mb-1">{mode.label}</div>
                    <div className="text-[#a3a3a3] text-xs leading-relaxed">{mode.description}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Step 03 — Genre or Artists */}
            {musicMode === 'genre' && (
              <section className="mb-10">
                <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                  03 — Choose Your Genre
                </h2>
                <div className="flex flex-wrap gap-3">
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-5 py-2.5 rounded-full border-2 font-semibold text-sm transition-all duration-200 ${
                        selectedGenre === genre
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-[#2a2a2a] text-[#a3a3a3] hover:border-[#555] hover:text-white'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {musicMode === 'artists' && (
              <section className="mb-10">
                <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">
                  03 — Enter Your Artists
                </h2>
                <p className="text-[#666] text-xs mb-4">
                  Add up to 5 artists or bands. Songs will be pulled from their Spotify catalogs.
                </p>
                <div className="flex flex-col gap-3">
                  {artists.map((value, i) => (
                    <div key={i} className="relative">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateArtist(i, e.target.value)}
                        placeholder={`Artist ${i + 1} — e.g. ${ARTIST_PLACEHOLDERS[i]}`}
                        className="w-full bg-[#141414] border-2 border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] focus:outline-none focus:border-orange-500 transition-colors pr-10"
                      />
                      {value && (
                        <button
                          onClick={() => clearArtist(i)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors text-lg leading-none"
                          aria-label="Clear artist"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {filledArtists.length > 0 && (
                  <p className="text-[#666] text-xs mt-3">
                    Songs will be drawn from: <span className="text-orange-400">{filledArtists.join(', ')}</span>
                  </p>
                )}
              </section>
            )}

            {/* DEBUG — remove after diagnosis */}
            <p className="text-[10px] font-mono text-[#555] text-center mb-2">
              bypass: {isDev ? 'yes' : 'no'} | status: {turnstileStatus} | key: {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? '✓ set' : '✗ missing'} | token: {turnstileToken ? '✓' : '✗'}
            </p>

            {!isDev && (
              <div className="flex flex-col items-center mb-4 gap-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onVerify={(token) => { setTurnstileToken(token); setTurnstileStatus('verified'); }}
                  onExpire={() => { setTurnstileToken(null); setTurnstileStatus('loading'); }}
                  onError={(code) => { console.error('Turnstile error:', code); setTurnstileToken(null); setTurnstileStatus('error'); }}
                  theme="dark"
                />
                {turnstileStatus === 'error' && (
                  <p className="text-red-400 text-xs">Verification failed — please refresh the page and try again.</p>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all duration-200 ${
                canGenerate && !loading
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-[#1f1f1f] text-[#555] cursor-not-allowed'
              }`}
            >
              {loading ? 'Building Your Playlist...' : 'Generate Playlist'}
            </button>

            {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}
          </>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-2">
                {isCustomView ? 'Your Custom Playlist' : 'Your Playlist'}
              </p>
              <h1 className="text-4xl font-black tracking-tight mb-1">
                {rideLabel}
                {musicMode === 'genre' && (
                  <> <span className="text-[#555]">×</span> {selectedGenre}</>
                )}
              </h1>
              {musicMode === 'artists' && filledArtists.length > 0 && (
                <p className="text-[#a3a3a3] text-sm mb-1">{filledArtists.join(', ')}</p>
              )}
              <p className="text-[#666] text-sm">
                {displayTracks.length} songs · {formatDuration(displayTracks)} · Click any song to open in Spotify
              </p>
            </div>

            {/* Custom view controls */}
            {isCustomView && (
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={backToFullResults}
                  className="text-sm text-[#a3a3a3] hover:text-white transition-colors flex items-center gap-1"
                >
                  ← Back to full results
                </button>
                <span className="text-[#333]">·</span>
                <span className="text-xs text-[#666]">
                  {selectedIds.size} of {tracks.length} songs selected
                </span>
              </div>
            )}

            {/* Song List */}
            <div className="flex flex-col gap-2 mb-8">
              {displayTracks.map((track, i) => (
                <SongCard
                  key={track.id}
                  track={track}
                  index={i}
                  selectable={!isCustomView}
                  selected={selectedIds.has(track.id)}
                  onToggle={() => toggleSong(track.id)}
                />
              ))}
            </div>

            {/* Refresh (only in full results, not custom view) */}
            {!isCustomView && (
              <>
                {!isDev && (
                  <div className="flex flex-col items-center mb-4 gap-2">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onVerify={(token) => { setTurnstileToken(token); setTurnstileStatus('verified'); }}
                      onExpire={() => { setTurnstileToken(null); setTurnstileStatus('loading'); }}
                      onError={(code) => { console.error('Turnstile error:', code); setTurnstileToken(null); setTurnstileStatus('error'); }}
                      theme="dark"
                    />
                    {turnstileStatus === 'error' && (
                      <p className="text-red-400 text-xs">Verification failed — please refresh the page and try again.</p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !turnstileToken}
                  className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-[#141414] border-2 border-[#2a2a2a] hover:border-orange-500 hover:text-orange-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : '↻ Generate New Playlist'}
                </button>
              </>
            )}
          </>
        )}
      </main>

      {/* Sticky action bar — shown when songs are selected in full results view */}
      {hasResults && !isCustomView && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] px-6 py-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-sm">
                {selectedIds.size} song{selectedIds.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-[#666] text-xs">
                {formatDuration(tracks.filter((t) => selectedIds.has(t.id)))} total
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={buildCustomPlaylist}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
              >
                Build My Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
