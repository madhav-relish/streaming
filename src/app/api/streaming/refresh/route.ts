import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";

/**
 * POST /api/streaming/refresh
 * Refresh all content data from the API
 * This endpoint should be called by a scheduled job
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure the request is authenticated and authorized
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the country from the request body or use default
    const body = await request.json().catch(() => ({}));
    const country = body.country || "us";

    // Refresh all content
    const result = await streamingService.refreshAllContent(country);

    return NextResponse.json({
      message: "Content refresh completed successfully",
      result,
    });
  } catch (error) {
    console.error("Error refreshing content:", error);
    return NextResponse.json(
      { error: "Failed to refresh content" },
      { status: 500 }
    );
  }
}
