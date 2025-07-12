import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get('genre');
  const duration = searchParams.get('duration');
  const movieId = searchParams.get('id');

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API key missing' }, { status: 500 });
  }

  if (movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json({ error: 'TMDB error', status: res.status }, { status: 500 });
      }
      const details = await res.json();
      return NextResponse.json(details);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
    }
  }

  const genreMap: Record<string, number> = {
    Action: 28,
    Comedy: 35,
    Drama: 18,
    Horror: 27,
    Romance: 10749,
    'Sci-Fi': 878,
  };
  const genreId = genre && genreMap[genre] ? genreMap[genre] : undefined;

  let url = `https://api.themoviedb.org/3/discover/movie?`;
  const params = new URLSearchParams();
  params.append('api_key', TMDB_API_KEY);
  if (genreId) params.append('with_genres', String(genreId));
  if (duration) params.append('with_runtime.lte', String(duration));
  params.append('sort_by', 'popularity.desc');
  params.append('include_adult', 'false');
  params.append('language', 'en-US');
  url += params.toString();

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'TMDB error', status: res.status }, { status: 500 });
    }
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return NextResponse.json({ error: 'No results from TMDB' }, { status: 500 });
    }

    const moviesWithDetails = await Promise.all(
      data.results.slice(0, 6).map(async (movie: any) => {
        try {
          const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
          const details = await detailsRes.json();
          return {
            ...movie,
            runtime: details.runtime,
            overview: details.overview || movie.overview,
          };
        } catch {
          return movie;
        }
      })
    );

    const filtered = moviesWithDetails.filter(
      (m: any) => m.poster_path && m.overview && m.runtime
    );
    
    return NextResponse.json({ results: filtered });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
