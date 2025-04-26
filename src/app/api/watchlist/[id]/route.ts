import { NextRequest, NextResponse } from "next/server";
import { watchlistService } from "@/server/services/watchlist-service";
import { auth } from "@/server/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * DELETE /api/watchlist/[id]
 * Remove an item from the current user's watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    const result = await watchlistService.removeFromWatchlist(
      session.user.id,
      id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    
    if (error.code === 'ITEM_NOT_FOUND') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/watchlist/[id]
 * Check if an item is in the current user's watchlist
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const contentType = searchParams.get("type") as "movie" | "tv";

    if (!contentType) {
      return NextResponse.json(
        { error: "Missing required query parameter: type" },
        { status: 400 }
      );
    }

    if (contentType !== "movie" && contentType !== "tv") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    const result = await watchlistService.isInWatchlist(
      session.user.id,
      contentType,
      id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return NextResponse.json(
      { error: "Failed to check watchlist" },
      { status: 500 }
    );
  }
}
