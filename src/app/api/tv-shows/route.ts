import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const country = searchParams.get("country") || "in";
    
    // Fetch TV shows from the database (or API if not cached)
    const tvShows = await streamingService.getPopularTvShows(country, page, limit);
    
    // Format TV show data for content grid
    const formattedTvShows = tvShows.map((tvShow) => ({
      id: tvShow.id,
      title: tvShow.title,
      posterPath: tvShow.posterPath,
      type: "tv" as const,
      year: tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear().toString() : "",
      rating: tvShow.voteAverage,
      streamingServices: tvShow.streamingOptions.map((option: any) => option.provider),
      fullContent: {
        overview: tvShow.overview,
        backdropPath: tvShow.backdropPath,
        releaseDate: tvShow.firstAirDate ? tvShow.firstAirDate.toISOString() : null,
        genres: tvShow.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
        streamingServices: tvShow.streamingOptions.map((option: any) => ({
          name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
          url: option.url
        }))
      }
    }));
    
    return NextResponse.json(formattedTvShows);
  } catch (error) {
    console.error("Error fetching TV shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV shows" },
      { status: 500 }
    );
  }
}
