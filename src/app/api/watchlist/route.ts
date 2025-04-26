import { NextRequest, NextResponse } from "next/server";
import { watchlistService } from "@/server/services/watchlist-service";
import { auth } from "@/server/auth";

/**
 * GET /api/watchlist
 * Get the current user's watchlist
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const watchlistItems = await watchlistService.getUserWatchlist(session.user.id);

    return NextResponse.json({ watchlistItems });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add an item to the current user's watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Missing required fields: contentType, contentId" },
        { status: 400 }
      );
    }

    if (contentType !== "movie" && contentType !== "tv") {
      return NextResponse.json(
        { error: "Invalid contentType. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    const watchlistItem = await watchlistService.addToWatchlist(
      session.user.id,
      contentType,
      contentId
    );

    return NextResponse.json({ watchlistItem });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    
    if (error.code === 'CONTENT_NOT_FOUND') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 }
    );
  }
}
