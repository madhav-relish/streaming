import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";
import { ContentGrid } from "@/components/content/content-grid";
import { streamingServices } from "@/lib/streaming-services";
import Image from "next/image";
import { notFound } from "next/navigation";

interface StreamingServiceTvShowsPageProps {
  params: {
    service: string;
  };
}

export default async function StreamingServiceTvShowsPage({ params }: StreamingServiceTvShowsPageProps) {
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
    // Fetch TV shows for this service
    const tvShows = await streamingService.getContentByService(service, "in", "series", 1, 50);

    // Format the data
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
          <h1 className="text-3xl font-bold">{serviceInfo.name} TV Shows</h1>
        </div>

        <ContentGrid
          items={formattedTvShows}
          userId={session?.user?.id || null}
          emptyMessage={`No TV shows found on ${serviceInfo.name}`}
        />
      </div>
    );
  } catch (error) {
    console.error(`Error loading TV shows for ${service}:`, error);

    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading TV shows for {serviceInfo.name}. Please try again later.
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
