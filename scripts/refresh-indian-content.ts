import { streamingService } from "../src/server/services/streaming-service";

async function refreshIndianContent() {
  console.log("Starting Indian content refresh...");

  try {
    // Refresh all content with India as the country
    const result = await streamingService.refreshAllContent("in");

    console.log("Content refresh completed successfully!");
    console.log(`Movies refreshed: ${result.moviesRefreshed}`);
    console.log(`TV shows refreshed: ${result.tvShowsRefreshed}`);
    console.log(`Trending items refreshed: ${result.trendingRefreshed}`);

    process.exit(0);
  } catch (error) {
    console.error("Error refreshing content:", error);
    process.exit(1);
  }
}

// Run the refresh function
refreshIndianContent();
