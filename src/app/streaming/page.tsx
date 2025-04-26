import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentSection } from "@/components/home/content-section";
import { streamingServices } from "@/lib/streaming-services";
import Image from "next/image";

export default async function StreamingPage() {
  // Get user session
  const session = await auth();

  // Define the streaming services we want to show tabs for
  const services = [
    "prime",
    "netflix",
    "hotstar",
    "sonyliv",
    "zee5",
    "jiocinema",
    "mxplayer",
    "voot",
  ];

  // Fetch content for each streaming service
  const serviceContent = await Promise.all(
    services.map(async (service) => {
      try {
        // Fetch movies for this service
        const movies = await streamingService.getContentByService(service, "in", "movie", 1, 10);

        // Fetch TV shows for this service
        const tvShows = await streamingService.getContentByService(service, "in", "series", 1, 10);

        // Format the data
        const formattedMovies = movies.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          posterPath: movie.posterPath,
          type: "movie" as const,
          year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : "",
          rating: movie.voteAverage,
          streamingServices: movie.streamingOptions.map((option: any) => option.provider),
          fullContent: {
            overview: movie.overview,
            backdropPath: movie.backdropPath,
            releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : null,
            runtime: movie.runtime,
            genres: movie.genres,
            streamingServices: movie.streamingOptions.map((option: any) => ({
              name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
              url: option.url
            }))
          }
        }));

        const formattedTvShows = tvShows.map((tvShow: any) => ({
          id: tvShow.id,
          title: tvShow.title,
          posterPath: tvShow.posterPath,
          type: "tv" as const,
          year: tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear().toString() : "",
          rating: tvShow.voteAverage,
          streamingServices: tvShow.streamingOptions.map((option: any) => option.provider),
          fullContent: {
            overview: tvShow.overview,
            backdropPath: tvShow.backdropPath,
            releaseDate: tvShow.firstAirDate ? tvShow.firstAirDate.toISOString() : null,
            runtime: tvShow.episodeRuntime?.[0] || null,
            genres: tvShow.genres,
            streamingServices: tvShow.streamingOptions.map((option: any) => ({
              name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
              url: option.url
            }))
          }
        }));

        return {
          service,
          movies: formattedMovies,
          tvShows: formattedTvShows,
        };
      } catch (error) {
        console.error(`Error fetching content for ${service}:`, error);
        return {
          service,
          movies: [],
          tvShows: [],
        };
      }
    })
  );

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Streaming Services</h1>

      <Tabs defaultValue={services[0]} className="w-full">
        <TabsList className="mb-6 flex flex-wrap h-auto">
          {services.map((service) => {
            const serviceInfo = streamingServices[service];
            return (
              <TabsTrigger key={service} value={service} className="flex items-center gap-2 py-2">
                <div className="relative w-6 h-6">
                  <Image
                    src={serviceInfo?.logo || "/images/streaming/placeholder.svg"}
                    alt={serviceInfo?.name || service}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                {serviceInfo?.name || service}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {serviceContent.map(({ service, movies, tvShows }) => (
          <TabsContent key={service} value={service} className="space-y-8">
            <ContentSection
              title={`${streamingServices[service]?.name || service} Movies`}
              viewAllHref={`/streaming/${service}/movies`}
              items={movies}
              userId={session?.user?.id || null}
            />

            <ContentSection
              title={`${streamingServices[service]?.name || service} TV Shows`}
              viewAllHref={`/streaming/${service}/tv-shows`}
              items={tvShows}
              userId={session?.user?.id || null}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
