import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { streamingService } from "@/server/services/streaming-service";

export const streamingRouter = createTRPCRouter({
  getContentByServices: publicProcedure
    .input(
      z.object({
        services: z.array(z.string()),
        country: z.string().default("in"),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        // Fetch content for each service and combine
        const allContent = [];
        
        // Process each service
        for (const service of input.services) {
          try {
            // Fetch movies for this service
            const movies = await streamingService.getContentByService(
              service, 
              input.country, 
              "movie", 
              1, 
              Math.ceil(input.limit / 2)
            );
            
            // Add type field to each movie
            const formattedMovies = movies.map((movie: any) => ({
              ...movie,
              type: "movie"
            }));
            
            // Fetch TV shows for this service
            const tvShows = await streamingService.getContentByService(
              service, 
              input.country, 
              "series", 
              1, 
              Math.ceil(input.limit / 2)
            );
            
            // Add type field to each TV show
            const formattedTvShows = tvShows.map((tvShow: any) => ({
              ...tvShow,
              type: "tv"
            }));
            
            // Add all content to the combined array
            allContent.push(...formattedMovies, ...formattedTvShows);
          } catch (error) {
            console.error(`Error fetching content for ${service}:`, error);
            // Continue with other services even if one fails
          }
        }
        
        // Remove duplicates (same content might be available on multiple services)
        const uniqueContent = allContent.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        
        // Sort by popularity (vote average)
        uniqueContent.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
        
        // Limit the number of results
        return uniqueContent.slice(0, input.limit);
      } catch (error) {
        console.error("Error getting content by services:", error);
        return [];
      }
    }),
});
