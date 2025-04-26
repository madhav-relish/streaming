import { ContentGrid } from "@/components/content/content-grid";
import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";

export const metadata = {
  title: "TV Shows | StreamHub",
  description: "Browse and discover TV shows from all your favorite streaming platforms in one place.",
};

export default async function TvShowsPage() {
  const session = await auth();

  try {
    // Fetch TV shows from the database (or API if not cached)
    const tvShows = await streamingService.getPopularTvShows("us", 1, 30);

    // Format TV show data for content grid
    const formattedTvShows = tvShows.map((tvShow) => ({
      id: tvShow.id,
      title: tvShow.title,
      posterPath: tvShow.posterPath,
      type: "tv" as const,
      year: tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear().toString() : "",
      rating: tvShow.voteAverage,
      streamingServices: tvShow.streamingOptions.map((option: any) => option.provider),
    }));

    // If we don't have enough data from the database yet, use mock data
    if (formattedTvShows.length < 10) {
      // Mock data for TV shows
      const mockTvShows = [
        {
          id: "tt0944947",
          title: "Game of Thrones",
          posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
          type: "tv" as const,
          year: "2011",
          rating: 8.4,
          streamingServices: ["hbo"],
        },
        {
          id: "tt0903747",
          title: "Breaking Bad",
          posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
          type: "tv" as const,
          year: "2008",
          rating: 8.5,
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
        {
          id: "tt1475582",
          title: "Sherlock",
          posterPath: "/7WTsnHkbA0zBBsW5HaNudiHVt0B.jpg",
          type: "tv" as const,
          year: "2010",
          rating: 8.4,
          streamingServices: ["netflix", "prime"],
        },
        {
          id: "tt0386676",
          title: "The Office",
          posterPath: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.3,
          streamingServices: ["peacock", "netflix"],
        },
        {
          id: "tt0417299",
          title: "Avatar: The Last Airbender",
          posterPath: "/cHFZA8Tlv03nKTGXhLOYOLtqoSm.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.4,
          streamingServices: ["netflix", "paramount"],
        },
        {
          id: "tt2442560",
          title: "Peaky Blinders",
          posterPath: "/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
          type: "tv" as const,
          year: "2013",
          rating: 8.3,
          streamingServices: ["netflix"],
        },
        {
          id: "tt0141842",
          title: "The Sopranos",
          posterPath: "/6VTGwvfA8zGvMiYSbPLKNUGhpJY.jpg",
          type: "tv" as const,
          year: "1999",
          rating: 8.6,
          streamingServices: ["hbo"],
        },
        {
          id: "tt0460649",
          title: "How I Met Your Mother",
          posterPath: "/b34jPzmB0wZy7EjUZoleXOl2LGn.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.0,
          streamingServices: ["hulu", "disney"],
        },
        {
          id: "tt0773262",
          title: "Dexter",
          posterPath: "/5DHlhR5WHDFGkM5agZqfrtR7oDX.jpg",
          type: "tv" as const,
          year: "2006",
          rating: 8.1,
          streamingServices: ["netflix", "paramount"],
        },
      ];

      // Generate more mock data
      const generateMoreTvShows = (count: number) => {
        const result = [...mockTvShows];
        while (result.length < count) {
          const originalShows = mockTvShows.slice(0, Math.min(mockTvShows.length, count - result.length));
          const newShows = originalShows.map(show => ({
            ...show,
            id: show.id + "_" + result.length,
            rating: Math.round((show.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
          }));
          result.push(...newShows);
        }
        return result.slice(0, count);
      };

      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
          <ContentGrid items={generateMoreTvShows(30)} />
        </div>
      );
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
        <ContentGrid items={formattedTvShows} />
      </div>
    );
  } catch (error) {
    console.error("Error loading TV shows:", error);

    // Fallback to a simple error page
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading the TV shows. Please try again later.
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
