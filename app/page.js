'use client';

import { useState } from 'react';
import SongCard from '@/components/SongCard';

const RIDE_TYPES = [
  {
    id: 'hiit',
    label: 'HIIT',
    description: 'High-intensity intervals',
    cadence: '90–100 RPM',
    icon: '⚡',
  },
  {
    id: 'tabata',
    label: 'Tabata',
    description: '20s on / 10s off',
    cadence: '90–100 RPM',
    icon: '🔥',
  },
  {
    id: 'zone_endurance',
    label: 'Zone Endurance',
    description: 'Sustained moderate effort',
    cadence: '75–85 RPM',
    icon: '💪',
  },
  {
    id: 'climb',
    label: 'Climb',
    description: 'Heavy resistance, uphill grind',
    cadence: '55–65 RPM',
    icon: '⛰️',
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Easy, relaxed pace',
    cadence: '70–90 RPM',
    icon: '🌀',
  },
];

const GENRES = ['Pop', 'Rock', 'Country', 'EDM', 'Hip-Hop/Rap'];

function formatDuration(tracks) {
  const totalMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);
  const totalMin = Math.round(totalMs / 60000);
  return `${totalMin} min`;
}

export default function Home() {
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasResults, setHasResults] = useState(false);

  async function handleGenerate() {
    if (!selectedRide || !selectedGenre) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/playlist?rideType=${selectedRide}&genre=${encodeURIComponent(selectedGenre)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setTracks(data.tracks);
      setHasResults(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setHasResults(false);
    setTracks([]);
    setSelectedRide(null);
    setSelectedGenre(null);
    setError(null);
  }

  const rideLabel = RIDE_TYPES.find((r) => r.id === selectedRide)?.label;
  const canGenerate = selectedRide && selectedGenre;

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
            <button
              onClick={handleReset}
              className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
            >
              ← Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {!hasResults ? (
          <>
            {/* Hero */}
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-black tracking-tighter mb-3 leading-none">
                FIND YOUR
                <span className="text-orange-500"> RHYTHM</span>
              </h1>
              <p className="text-[#a3a3a3] text-lg">
                Choose your ride and your sound. We&apos;ll handle the rest.
              </p>
            </div>

            {/* Ride Type Selection */}
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
                    <div className="font-bold text-sm uppercase tracking-wide">
                      {ride.label}
                    </div>
                    <div className="text-[#a3a3a3] text-xs mt-1">{ride.description}</div>
                    <div className="text-orange-400 text-xs font-mono mt-2">{ride.cadence}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Genre Selection */}
            <section className="mb-10">
              <h2 className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-4">
                02 — Choose Your Genre
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

            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-8">
              <p className="text-orange-500 text-xs font-bold tracking-widest uppercase mb-2">
                Your Playlist
              </p>
              <h1 className="text-4xl font-black tracking-tight mb-1">
                {rideLabel} <span className="text-[#555]">×</span> {selectedGenre}
              </h1>
              <p className="text-[#666] text-sm">
                {tracks.length} songs · {formatDuration(tracks)} · Click any song to open in Spotify
              </p>
            </div>

            {/* Song List */}
            <div className="flex flex-col gap-2 mb-8">
              {tracks.map((track, i) => (
                <SongCard key={track.id} track={track} index={i} />
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-[#141414] border-2 border-[#2a2a2a] hover:border-orange-500 hover:text-orange-500 transition-all duration-200"
            >
              {loading ? 'Refreshing...' : '↻ Generate New Playlist'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
