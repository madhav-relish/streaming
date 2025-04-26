/**
 * This script refreshes the content data from the Streaming API
 * It should be run as a scheduled job (e.g., daily)
 * 
 * Example cron job:
 * 0 0 * * * cd /path/to/project && pnpm ts-node scripts/refresh-content.ts
 */

import { streamingService } from "../src/server/services/streaming-service";

async function refreshContent() {
  console.log("Starting content refresh job at", new Date().toISOString());
  
  try {
    // Default to US region, but can be configured
    const region = process.env.CONTENT_REGION || "us";
    
    const result = await streamingService.refreshAllContent(region);
    
    console.log("Content refresh completed successfully:", result);
    console.log("Job completed at", new Date().toISOString());
    
    process.exit(0);
  } catch (error) {
    console.error("Error refreshing content:", error);
    process.exit(1);
  }
}

// Run the refresh job
refreshContent();
