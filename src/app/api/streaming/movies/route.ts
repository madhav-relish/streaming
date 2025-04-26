import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";

/**
 * GET /api/streaming/movies
 * Get popular movies
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country") || "in";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const movies = await streamingService.getPopularMovies(country, page, limit);

    return NextResponse.json({ movies });
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular movies" },
      { status: 500 }
    );
  }
}
