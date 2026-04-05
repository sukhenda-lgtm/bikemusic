'use client';

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SongCard({ track, index }) {
  return (
    <a
      href={track.spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] hover:border-orange-500 hover:bg-[#242424] transition-all duration-200"
    >
      {/* Track number */}
      <span className="text-[#555] text-sm font-mono w-6 text-right shrink-0 group-hover:text-orange-500 transition-colors">
        {index + 1}
      </span>

      {/* Album art */}
      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#2a2a2a]">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.album}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#555]">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Title & artist */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">
          {track.title}
        </p>
        <p className="text-[#a3a3a3] text-xs truncate mt-0.5">{track.artist}</p>
      </div>

      {/* BPM */}
      {track.bpm != null && (
        <span className="text-orange-500 text-xs font-mono font-bold shrink-0">
          {Math.round(track.bpm)} BPM
        </span>
      )}

      {/* Duration */}
      <span className="text-[#666] text-xs font-mono shrink-0">
        {formatDuration(track.durationMs)}
      </span>

      {/* Spotify icon */}
      <svg
        className="w-4 h-4 text-[#1DB954] shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    </a>
  );
}
