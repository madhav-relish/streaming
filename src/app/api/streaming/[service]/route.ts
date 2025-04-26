import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { streamingServices } from "@/lib/streaming-services";

export async function GET(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params;
    
    // Check if this is a valid service
    if (!streamingServices[service]) {
      return NextResponse.json(
        { error: "Invalid streaming service" },
        { status: 404 }
      );
    }
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const country = searchParams.get("country") || "in";
    const type = searchParams.get("type") as "movie" | "series" || "movie";
    
    // Fetch content for this service
    const content = await streamingService.getContentByService(service, country, type, page, limit);
    
    // Format the data
    const formattedContent = content.map((item: any) => {
      if (type === "movie") {
        return {
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          type: "movie" as const,
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : "",
          rating: item.voteAverage,
          streamingServices: item.streamingOptions.map((option: any) => option.provider),
          fullContent: {
            overview: item.overview,
            backdropPath: item.backdropPath,
            releaseDate: item.releaseDate ? item.releaseDate.toISOString() : null,
            runtime: item.runtime,
            genres: item.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
            streamingServices: item.streamingOptions.map((option: any) => ({
              name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
              url: option.url
            }))
          }
        };
      } else {
        return {
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          type: "tv" as const,
          year: item.firstAirDate ? new Date(item.firstAirDate).getFullYear().toString() : "",
          rating: item.voteAverage,
          streamingServices: item.streamingOptions.map((option: any) => option.provider),
          fullContent: {
            overview: item.overview,
            backdropPath: item.backdropPath,
            releaseDate: item.firstAirDate ? item.firstAirDate.toISOString() : null,
            runtime: item.episodeRuntime?.[0] || null,
            genres: item.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
            streamingServices: item.streamingOptions.map((option: any) => ({
              name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
              url: option.url
            }))
          }
        };
      }
    });
    
    return NextResponse.json(formattedContent);
  } catch (error) {
    console.error(`Error fetching content:`, error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}
