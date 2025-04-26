import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const country = searchParams.get("country") || "in";
    
    // Fetch movies from the database (or API if not cached)
    const movies = await streamingService.getPopularMovies(country, page, limit);
    
    // Format movie data for content grid
    const formattedMovies = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      type: "movie" as const,
      year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : "",
      rating: movie.voteAverage,
      streamingServices: movie.streamingOptions.map((option: any) => option.provider),
      fullContent: {
        overview: movie.overview,
        backdropPath: movie.backdropPath,
        releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : null,
        genres: movie.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
        streamingServices: movie.streamingOptions.map((option: any) => ({
          name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
          url: option.url
        }))
      }
    }));
    
    return NextResponse.json(formattedMovies);
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
