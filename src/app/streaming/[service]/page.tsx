import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";
import { ContentSection } from "@/components/home/content-section";
import { streamingServices } from "@/lib/streaming-api";
import Image from "next/image";
import { notFound } from "next/navigation";

interface StreamingServicePageProps {
  params: {
    service: string;
  };
}

export default async function StreamingServicePage({ params }: StreamingServicePageProps) {
  // Get user session
  const session = await auth();

  // Get the service from the URL
  const { service } = params;

  // Check if this is a valid service
  if (!streamingServices[service]) {
    notFound();
  }

  // Get service info
  const serviceInfo = streamingServices[service];

  try {
    // Fetch movies for this service
    const movies = await streamingService.getContentByService(service, "in", "movie", 1, 20);

    // Fetch TV shows for this service
    const tvShows = await streamingService.getContentByService(service, "in", "series", 1, 20);

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

    return (
      <div className="container py-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-16 h-16 overflow-hidden rounded-lg">
            <Image
              src={serviceInfo.logo || "/images/streaming/placeholder.svg"}
              alt={serviceInfo.name}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold">{serviceInfo.name}</h1>
        </div>

        <div className="space-y-8">
          <ContentSection
            title={`${serviceInfo.name} Movies`}
            items={formattedMovies}
            userId={session?.user?.id || null}
          />

          <ContentSection
            title={`${serviceInfo.name} TV Shows`}
            items={formattedTvShows}
            userId={session?.user?.id || null}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Error loading content for ${service}:`, error);

    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading content for {serviceInfo.name}. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Refresh Page
        </button>
      </div>
    );
  }
}
