import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";

/**
 * GET /api/streaming/tv-shows
 * Get popular TV shows
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country") || "us";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const tvShows = await streamingService.getPopularTvShows(country, page, limit);

    return NextResponse.json({ tvShows });
  } catch (error) {
    console.error("Error fetching popular TV shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular TV shows" },
      { status: 500 }
    );
  }
}
