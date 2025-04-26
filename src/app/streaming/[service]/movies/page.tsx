import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";
import { ContentGrid } from "@/components/content/content-grid";
import { streamingServices } from "@/lib/streaming-api";
import Image from "next/image";
import { notFound } from "next/navigation";

interface StreamingServiceMoviesPageProps {
  params: {
    service: string;
  };
}

export default async function StreamingServiceMoviesPage({ params }: StreamingServiceMoviesPageProps) {
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
    const movies = await streamingService.getContentByService(service, "in", "movie", 1, 50);

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
          <h1 className="text-3xl font-bold">{serviceInfo.name} Movies</h1>
        </div>

        <ContentGrid
          items={formattedMovies}
          userId={session?.user?.id || null}
          emptyMessage={`No movies found on ${serviceInfo.name}`}
        />
      </div>
    );
  } catch (error) {
    console.error(`Error loading movies for ${service}:`, error);

    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading movies for {serviceInfo.name}. Please try again later.
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
