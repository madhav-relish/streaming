import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "@/components/home/content-section";
import { formatRuntime } from "@/lib/utils";
import { auth } from "@/server/auth";
import { watchlistService } from "@/server/services/watchlist-service";
import { streamingService } from "@/server/services/streaming-service";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { SafeImage } from "@/components/ui/safe-image";

interface TvShowPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TvShowPageProps) {
  const tvShowId = params.id;
  const country = "in"; // Use India as the default country

  try {
    // Fetch TV show data from the streaming service
    const tvShowData = await streamingService.getTvShow(tvShowId, country);

    if (!tvShowData) {
      return {
        title: "TV Show Not Found | StreamHub",
        description: "The requested TV show could not be found.",
      };
    }

    // Format the description
    const description = tvShowData.overview
      ? tvShowData.overview.substring(0, 160) + (tvShowData.overview.length > 160 ? "..." : "")
      : "No description available.";

    return {
      title: `${tvShowData.title} | StreamHub`,
      description: description,
    };
  } catch (error) {
    console.error("Error fetching TV show metadata:", error);
    return {
      title: "TV Show Not Found | StreamHub",
      description: "The requested TV show could not be found.",
    };
  }
}

export default async function TvShowPage({ params }: TvShowPageProps) {
  const tvShowId = params.id;
  const session = await auth();
  const country = "in"; // Use India as the default country

  // Check if the TV show is in the user's watchlist
  let isInWatchlist = false;
  let watchlistItemId = "";

  if (session?.user) {
    try {
      const watchlistCheck = await watchlistService.isInWatchlist(
        session.user.id,
        "tv",
        tvShowId
      );
      isInWatchlist = watchlistCheck.isInWatchlist;
      watchlistItemId = watchlistCheck.watchlistItemId || "";
    } catch (error) {
      console.error("Error checking watchlist:", error);
    }
  }

  // Fetch TV show data from the streaming service
  try {
    const tvShowData = await streamingService.getTvShow(tvShowId, country);

    if (!tvShowData) {
      notFound();
    }

    // Format the TV show data for display
    const tvShow = {
      id: tvShowData.id,
      title: tvShowData.title,
      overview: tvShowData.overview || "No overview available.",
      posterPath: tvShowData.posterPath,
      backdropPath: tvShowData.backdropPath,
      firstAirDate: tvShowData.firstAirDate ? tvShowData.firstAirDate.toISOString() : null,
      lastAirDate: tvShowData.lastAirDate ? tvShowData.lastAirDate.toISOString() : null,
      numberOfSeasons: tvShowData.numberOfSeasons || 0,
      numberOfEpisodes: tvShowData.numberOfEpisodes || 0,
      voteAverage: tvShowData.voteAverage || 0,
      genres: tvShowData.genres.map(genre => ({
        id: genre.id,
        name: genre.name
      })),
      streamingServices: tvShowData.streamingOptions.map(option => ({
        name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1), // Capitalize provider name
        url: option.url
      }))
    };

  // Mock similar TV shows
  const similarTvShows = [
    {
      id: "tt0475784",
      title: "Westworld",
      posterPath: "/8MfgyFHf7XEboZJPZXCIDqqiz6e.jpg",
      type: "tv" as const,
      year: "2016",
      rating: 8.1,
      streamingServices: ["hbo"],
    },
    {
      id: "tt1520211",
      title: "The Walking Dead",
      posterPath: "/xf9wuDcqlUPWABZNeDKPbZUjWx0.jpg",
      type: "tv" as const,
      year: "2010",
      rating: 7.9,
      streamingServices: ["netflix", "amc+"],
    },
    {
      id: "tt2306299",
      title: "Vikings",
      posterPath: "/bQLrHIRNEkE3PdIWQrZHynQZazu.jpg",
      type: "tv" as const,
      year: "2013",
      rating: 7.9,
      streamingServices: ["netflix", "prime"],
    },
    {
      id: "tt5180504",
      title: "The Witcher",
      posterPath: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
      type: "tv" as const,
      year: "2019",
      rating: 8.0,
      streamingServices: ["netflix"],
    },
    {
      id: "tt0108778",
      title: "Friends",
      posterPath: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
      type: "tv" as const,
      year: "1994",
      rating: 8.4,
      streamingServices: ["hbo", "netflix"],
    },
  ];

  // Extract years from air dates
  const firstAirYear = tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear() : null;
  const lastAirYear = tvShow.lastAirDate ? new Date(tvShow.lastAirDate).getFullYear() : null;
  const yearRange = !firstAirYear ? "Unknown" :
                    !lastAirYear || firstAirYear === lastAirYear ?
                    firstAirYear.toString() :
                    `${firstAirYear}–${lastAirYear}`;

  return (
    <div>
      {/* Hero Section with Backdrop */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <SafeImage
            src={tvShow.backdropPath}
            alt={tvShow.title}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/10" />
        </div>

        {/* Content */}
        <div className="container relative h-full flex items-end pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="hidden md:block flex-shrink-0 w-64 rounded-lg overflow-hidden shadow-lg">
              <SafeImage
                src={tvShow.posterPath}
                alt={tvShow.title}
                width={256}
                height={384}
                className="w-full h-auto"
              />
            </div>

            {/* Details */}
            <div className="flex-grow space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                {tvShow.title} <span className="text-muted-foreground">({yearRange})</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{tvShow.voteAverage.toFixed(1)}</span>
                </div>
                {tvShow.numberOfSeasons > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>{tvShow.numberOfSeasons} {tvShow.numberOfSeasons === 1 ? "Season" : "Seasons"}</span>
                  </>
                )}
                {tvShow.numberOfEpisodes > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span>{tvShow.numberOfEpisodes} Episodes</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {tvShow.genres.map((genre) => (
                  <Link key={genre.id} href={`/genres/${genre.id}`}>
                    <Badge variant="secondary">{genre.name}</Badge>
                  </Link>
                ))}
              </div>

              <p className="text-lg text-muted-foreground max-w-3xl">
                {tvShow.overview}
              </p>

              <div className="flex flex-wrap gap-3 pt-4">
                {tvShow.streamingServices.length > 0 ? (
                  <Button asChild size="lg">
                    <Link href={`/watch/tv/${tvShow.id}?service=${encodeURIComponent(tvShow.streamingServices[0].name)}&url=${encodeURIComponent(tvShow.streamingServices[0].url)}&title=${encodeURIComponent(tvShow.title)}&poster=${encodeURIComponent(tvShow.posterPath || '')}`}>
                      <Play className="mr-2 h-5 w-5" />
                      Watch on {tvShow.streamingServices[0].name}
                    </Link>
                  </Button>
                ) : (
                  <Button disabled size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Not Available for Streaming
                  </Button>
                )}

                {session?.user ? (
                  <WatchlistButton
                    contentId={tvShow.id}
                    contentType="tv"
                    isInWatchlist={isInWatchlist}
                    watchlistItemId={watchlistItemId}
                    variant="outline"
                    size="lg"
                  />
                ) : (
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/api/auth/signin">Sign in to add to Watchlist</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Options */}
      {tvShow.streamingServices.length > 0 && (
        <div className="container py-8 border-b">
          <h2 className="text-2xl font-bold mb-4">Where to Watch</h2>
          <div className="flex flex-wrap gap-4">
            {tvShow.streamingServices.map((service, index) => (
              <Button key={index} asChild variant="outline">
                <Link href={`/watch/tv/${tvShow.id}?service=${encodeURIComponent(service.name)}&url=${encodeURIComponent(service.url)}&title=${encodeURIComponent(tvShow.title)}&poster=${encodeURIComponent(tvShow.posterPath || '')}`}>
                  {service.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Similar TV Shows */}
      <ContentSection
        title="Similar TV Shows"
        items={similarTvShows}
      />
    </div>
  );
}
