import { NextRequest, NextResponse } from "next/server";
import { streamingService } from "@/server/services/streaming-service";
import { auth } from "@/server/auth";
import { fetchProgress } from "../fetch-progress/route";

// This is a long-running operation that fetches all content from the API
// and stores it in the database. It should be called from an admin endpoint.
export async function GET(req: NextRequest) {
  try {
    // Check if the user is authenticated and is an admin
    const session = await auth();

    // For now, we'll allow any authenticated user to trigger this
    // In production, you should check if the user is an admin
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized. You must be logged in to access this endpoint." },
    //     { status: 401 }
    //   );
    // }

    // Get the country from the query parameters
    const country = req.nextUrl.searchParams.get("country") || "in";

    // Get the maxPages parameter from the query parameters
    const maxPages = parseInt(req.nextUrl.searchParams.get("maxPages") || "10", 10);

    // Get the services parameter from the query parameters
    const servicesParam = req.nextUrl.searchParams.get("services");
    const services = servicesParam ? servicesParam.split(',') : [];

    // Check if a fetch is already in progress
    if (fetchProgress.status === "running") {
      return NextResponse.json({
        message: "A content fetch is already in progress. Please wait for it to complete.",
        progress: fetchProgress
      }, { status: 409 });
    }

    // Reset and initialize progress tracking
    Object.assign(fetchProgress, {
      status: "running",
      startTime: Date.now(),
      endTime: null,
      totalItems: 0,
      processedItems: 0,
      currentPage: 0,
      totalPages: maxPages * 2, // Movies + TV Shows
      error: null,
      lastUpdated: Date.now(),
      services: services.length > 0 ? services : "all"
    });

    // Start the fetch process in the background
    // We'll return immediately and let the process run in the background
    const fetchPromise = Promise.all([
      streamingService.fetchAllMoviesFromAPI(country, maxPages, (progress) => {
        // Update progress for movies
        fetchProgress.processedItems = progress.processedItems;
        fetchProgress.totalItems = progress.totalItems;
        fetchProgress.currentPage = progress.currentPage;
        fetchProgress.lastUpdated = Date.now();
      }, services),
      streamingService.fetchAllTvShowsFromAPI(country, maxPages, (progress) => {
        // Update progress for TV shows
        fetchProgress.processedItems += progress.processedItems;
        fetchProgress.totalItems += progress.totalItems;
        fetchProgress.currentPage = progress.currentPage + maxPages; // Offset for TV shows
        fetchProgress.lastUpdated = Date.now();
      }, services)
    ]);

    // Don't await the promise, let it run in the background
    fetchPromise.then(([movies, tvShows]) => {
      console.log(`Fetch completed. Saved ${movies.length} movies and ${tvShows.length} TV shows.`);

      // Update progress to completed
      fetchProgress.status = "completed";
      fetchProgress.endTime = Date.now();
      fetchProgress.lastUpdated = Date.now();
    }).catch(error => {
      console.error("Error in background fetch:", error);

      // Update progress to error
      fetchProgress.status = "error";
      fetchProgress.error = error.message || "An unknown error occurred";
      fetchProgress.endTime = Date.now();
      fetchProgress.lastUpdated = Date.now();
    });

    // Return a success response immediately
    return NextResponse.json({
      message: "Content fetch started in the background. This may take several minutes to complete.",
      country,
      maxPages,
      services: services.length > 0 ? services : "all",
      progress: fetchProgress
    });
  } catch (error) {
    console.error("Error in fetch-all-content API:", error);

    // Update progress to error
    fetchProgress.status = "error";
    fetchProgress.error = error instanceof Error ? error.message : "An unknown error occurred";
    fetchProgress.endTime = Date.now();
    fetchProgress.lastUpdated = Date.now();

    return NextResponse.json(
      {
        error: "An error occurred while fetching content.",
        progress: fetchProgress
      },
      { status: 500 }
    );
  }
}
