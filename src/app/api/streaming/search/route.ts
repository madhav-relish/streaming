import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";

/**
 * GET /api/streaming/search
 * Search for movies and TV shows
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const country = searchParams.get("country") || "us";
    const type = searchParams.get("type") as "movie" | "series" | undefined;
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const results = await streamingService.searchContent(query, country, type, page);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching content:", error);
    return NextResponse.json(
      { error: "Failed to search content" },
      { status: 500 }
    );
  }
}
