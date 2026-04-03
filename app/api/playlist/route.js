import { NextResponse } from 'next/server';
import { getPlaylist } from '@/lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rideType = searchParams.get('rideType');
  const genre = searchParams.get('genre');

  if (!rideType || !genre) {
    return NextResponse.json(
      { error: 'Missing rideType or genre parameter' },
      { status: 400 }
    );
  }

  try {
    const tracks = await getPlaylist(rideType, genre);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('Playlist API error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
