import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentSection } from "@/components/home/content-section";
import { getImageUrl, formatRuntime } from "@/lib/utils";
import { auth } from "@/server/auth";
import { watchlistService } from "@/server/services/watchlist-service";
import { streamingService } from "@/server/services/streaming-service";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";

interface MoviePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: MoviePageProps) {
  const movieId = params.id;
  const country = "in"; // Use India as the default country

  try {
    // Fetch movie data from the streaming service
    const movieData = await streamingService.getMovie(movieId, country);

    if (!movieData) {
      return {
        title: "Movie Not Found | StreamHub",
        description: "The requested movie could not be found.",
      };
    }

    // Format the description
    const description = movieData.overview
      ? movieData.overview.substring(0, 160) + (movieData.overview.length > 160 ? "..." : "")
      : "No description available.";

    return {
      title: `${movieData.title} | StreamHub`,
      description: description,
    };
  } catch (error) {
    console.error("Error fetching movie metadata:", error);
    return {
      title: "Movie Not Found | StreamHub",
      description: "The requested movie could not be found.",
    };
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const movieId = params.id;
  const session = await auth();
  const country = "in"; // Use India as the default country

  // Check if the movie is in the user's watchlist
  let isInWatchlist = false;
  let watchlistItemId = "";

  if (session?.user) {
    try {
      const watchlistCheck = await watchlistService.isInWatchlist(
        session.user.id,
        "movie",
        movieId
      );
      isInWatchlist = watchlistCheck.isInWatchlist;
      watchlistItemId = watchlistCheck.watchlistItemId || "";
    } catch (error) {
      console.error("Error checking watchlist:", error);
    }
  }

  // Fetch movie data from the streaming service
  try {
    const movieData = await streamingService.getMovie(movieId, country);

    if (!movieData) {
      notFound();
    }

    // Format the movie data for display
    const movie = {
      id: movieData.id,
      title: movieData.title,
      overview: movieData.overview || "No overview available.",
      posterPath: movieData.posterPath,
      backdropPath: movieData.backdropPath,
      releaseDate: movieData.releaseDate ? movieData.releaseDate.toISOString() : null,
      runtime: movieData.runtime || 0,
      voteAverage: movieData.voteAverage || 0,
      genres: movieData.genres.map(genre => ({
        id: genre.id,
        name: genre.name
      })),
      streamingServices: movieData.streamingOptions.map(option => ({
        name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1), // Capitalize provider name
        url: option.url
      }))
    };

    // Mock similar movies (in a real app, you would fetch these from an API)
    const similarMovies = [
      {
        id: "tt0071562",
        title: "The Godfather: Part II",
        posterPath: "/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg",
        type: "movie" as const,
        year: "1974",
        rating: 8.6,
        streamingServices: ["paramount"],
      },
      {
        id: "tt0099685",
        title: "Goodfellas",
        posterPath: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
        type: "movie" as const,
        year: "1990",
        rating: 8.5,
        streamingServices: ["netflix"],
      },
      {
        id: "tt0110912",
        title: "Pulp Fiction",
        posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
        type: "movie" as const,
        year: "1994",
        rating: 8.5,
        streamingServices: ["netflix"],
      },
      {
        id: "tt0137523",
        title: "Fight Club",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        type: "movie" as const,
        year: "1999",
        rating: 8.4,
        streamingServices: ["hulu", "prime"],
      },
      {
        id: "tt0109830",
        title: "Forrest Gump",
        posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
        type: "movie" as const,
        year: "1994",
        rating: 8.4,
        streamingServices: ["netflix", "paramount"],
      },
    ];

    // Extract year from release date
    const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

    return (
      <div>
      {/* Hero Section with Backdrop */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(movie.backdropPath, "backdrop")}
            alt={movie.title}
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
                src={getImageUrl(movie.posterPath, "poster")}
                alt={movie.title}
                width={256}
                height={384}
                className="w-full h-auto"
              />
            </div>

            {/* Details */}
            <div className="flex-grow space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                {movie.title} <span className="text-muted-foreground">({releaseYear})</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{movie.voteAverage.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span>{formatRuntime(movie.runtime)}</span>
                <span className="text-muted-foreground">•</span>
                <span>{releaseYear}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Link key={genre.id} href={`/genres/${genre.id}`}>
                    <Badge variant="secondary">{genre.name}</Badge>
                  </Link>
                ))}
              </div>

              <p className="text-lg text-muted-foreground max-w-3xl">
                {movie.overview}
              </p>

              <div className="flex flex-wrap gap-3 pt-4">
                {movie.streamingServices.length > 0 ? (
                  <Button asChild size="lg">
                    <Link href={`/watch/movie/${movie.id}?service=${encodeURIComponent(movie.streamingServices[0].name)}&url=${encodeURIComponent(movie.streamingServices[0].url)}&title=${encodeURIComponent(movie.title)}&poster=${encodeURIComponent(movie.posterPath || '')}`}>
                      <Play className="mr-2 h-5 w-5" />
                      Watch on {movie.streamingServices[0].name}
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
                    contentId={movie.id}
                    contentType="movie"
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
      {movie.streamingServices.length > 0 && (
        <div className="container py-8 border-b">
          <h2 className="text-2xl font-bold mb-4">Where to Watch</h2>
          <div className="flex flex-wrap gap-4">
            {movie.streamingServices.map((service, index) => (
              <Button key={index} asChild variant="outline">
                <Link href={`/watch/movie/${movie.id}?service=${encodeURIComponent(service.name)}&url=${encodeURIComponent(service.url)}&title=${encodeURIComponent(movie.title)}&poster=${encodeURIComponent(movie.posterPath || '')}`}>
                  {service.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Similar Movies */}
      <ContentSection
        title="Similar Movies"
        items={similarMovies}
      />
    </div>
    );
  } catch (error) {
    console.error("Error fetching movie data:", error);
    notFound();
  }
}
