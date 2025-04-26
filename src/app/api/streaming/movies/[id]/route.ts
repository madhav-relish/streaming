import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/streaming/movies/[id]
 * Get a specific movie by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country") || "us";

    const movie = await streamingService.getMovie(id, country);

    if (!movie) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ movie });
  } catch (error) {
    console.error(`Error fetching movie ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}
