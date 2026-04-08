import { NextResponse } from 'next/server';
import { getPlaylist } from '@/lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rideType = searchParams.get('rideType');
  const genre = searchParams.get('genre');
  const artistsParam = searchParams.get('artists');
  if (process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== 'true') {
    const cfToken = searchParams.get('cf-turnstile-response');
    if (!cfToken) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: cfToken,
      }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Human verification failed' }, { status: 403 });
    }
  }

  if (!rideType || !genre) {
    return NextResponse.json(
      { error: 'Missing rideType or genre parameter' },
      { status: 400 }
    );
  }

  // artists is an optional comma-separated list
  const artists = artistsParam
    ? artistsParam.split(',').map((a) => a.trim()).filter(Boolean).slice(0, 5)
    : [];

  try {
    const { tracks } = await getPlaylist(rideType, genre, artists);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('Playlist API error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
