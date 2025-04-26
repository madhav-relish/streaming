import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "@/components/home/content-section";
import { getImageUrl } from "@/lib/utils";
import { auth } from "@/server/auth";
import { watchlistService } from "@/server/services/watchlist-service";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";

interface TvShowPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: TvShowPageProps) {
  // In a real app, fetch TV show details from API
  const tvShowId = params.id;

  // Mock TV show data
  const mockTvShows = [
    {
      id: "tt0944947",
      title: "Game of Thrones",
      overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond.",
      posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      firstAirDate: "2011-04-17",
      lastAirDate: "2019-05-19",
      numberOfSeasons: 8,
      numberOfEpisodes: 73,
      voteAverage: 8.4,
      genres: [
        { id: 10765, name: "Sci-Fi & Fantasy" },
        { id: 18, name: "Drama" },
        { id: 10759, name: "Action & Adventure" },
      ],
      streamingServices: [
        { name: "HBO Max", url: "https://www.hbomax.com/series/urn:hbo:series:GVU2cggagzYNJjhsJATwo" },
      ],
    },
    {
      id: "tt0903747",
      title: "Breaking Bad",
      overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime.",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      firstAirDate: "2008-01-20",
      lastAirDate: "2013-09-29",
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      voteAverage: 8.5,
      genres: [
        { id: 18, name: "Drama" },
        { id: 80, name: "Crime" },
      ],
      streamingServices: [
        { name: "Netflix", url: "https://www.netflix.com/title/70143836" },
      ],
    },
  ];

  const tvShow = mockTvShows.find((t) => t.id === tvShowId);

  if (!tvShow) {
    return {
      title: "TV Show Not Found | StreamHub",
      description: "The requested TV show could not be found.",
    };
  }

  return {
    title: `${tvShow.title} | StreamHub`,
    description: tvShow.overview.substring(0, 160) + "...",
  };
}

export default async function TvShowPage({ params }: TvShowPageProps) {
  const tvShowId = params.id;
  const session = await auth();

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

  // Mock TV show data
  const mockTvShows = [
    {
      id: "tt0944947",
      title: "Game of Thrones",
      overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond.",
      posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      firstAirDate: "2011-04-17",
      lastAirDate: "2019-05-19",
      numberOfSeasons: 8,
      numberOfEpisodes: 73,
      voteAverage: 8.4,
      genres: [
        { id: 10765, name: "Sci-Fi & Fantasy" },
        { id: 18, name: "Drama" },
        { id: 10759, name: "Action & Adventure" },
      ],
      streamingServices: [
        { name: "HBO Max", url: "https://www.hbomax.com/series/urn:hbo:series:GVU2cggagzYNJjhsJATwo" },
      ],
    },
    {
      id: "tt0903747",
      title: "Breaking Bad",
      overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime.",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      firstAirDate: "2008-01-20",
      lastAirDate: "2013-09-29",
      numberOfSeasons: 5,
      numberOfEpisodes: 62,
      voteAverage: 8.5,
      genres: [
        { id: 18, name: "Drama" },
        { id: 80, name: "Crime" },
      ],
      streamingServices: [
        { name: "Netflix", url: "https://www.netflix.com/title/70143836" },
      ],
    },
  ];

  const tvShow = mockTvShows.find((t) => t.id === tvShowId);

  if (!tvShow) {
    notFound();
  }

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
  const firstAirYear = new Date(tvShow.firstAirDate).getFullYear();
  const lastAirYear = new Date(tvShow.lastAirDate).getFullYear();
  const yearRange = firstAirYear === lastAirYear
    ? firstAirYear.toString()
    : `${firstAirYear}–${lastAirYear}`;

  return (
    <div>
      {/* Hero Section with Backdrop */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(tvShow.backdropPath, "backdrop")}
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
              <Image
                src={getImageUrl(tvShow.posterPath, "poster")}
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
                <span className="text-muted-foreground">•</span>
                <span>{tvShow.numberOfSeasons} {tvShow.numberOfSeasons === 1 ? "Season" : "Seasons"}</span>
                <span className="text-muted-foreground">•</span>
                <span>{tvShow.numberOfEpisodes} Episodes</span>
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
                    <a href={tvShow.streamingServices[0].url} target="_blank" rel="noopener noreferrer">
                      <Play className="mr-2 h-5 w-5" />
                      Watch on {tvShow.streamingServices[0].name}
                    </a>
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
                <a href={service.url} target="_blank" rel="noopener noreferrer">
                  {service.name}
                </a>
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
