import Link from "next/link";
import { redirect } from "next/navigation";
import { ContentGrid } from "@/components/content/content-grid";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { watchlistService } from "@/server/services/watchlist-service";

export const metadata = {
  title: "My Watchlist | StreamHub",
  description: "Manage your watchlist of movies and TV shows.",
};

export default async function WatchlistPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  try {
    // Fetch the user's watchlist from the database
    const watchlistItems = await watchlistService.getUserWatchlist(session.user.id);

    // Format the watchlist items for the ContentGrid component
    const formattedWatchlist = watchlistItems.map(item => {
      if (item.movie) {
        return {
          id: item.movie.id,
          title: item.movie.title,
          posterPath: item.movie.posterPath,
          type: "movie" as const,
          year: item.movie.releaseDate ? new Date(item.movie.releaseDate).getFullYear().toString() : "",
          rating: item.movie.voteAverage,
          streamingServices: item.movie.streamingOptions.map(option => option.provider),
          watchlistItemId: item.id,
        };
      } else if (item.tvShow) {
        return {
          id: item.tvShow.id,
          title: item.tvShow.title,
          posterPath: item.tvShow.posterPath,
          type: "tv" as const,
          year: item.tvShow.firstAirDate ? new Date(item.tvShow.firstAirDate).getFullYear().toString() : "",
          rating: item.tvShow.voteAverage,
          streamingServices: item.tvShow.streamingOptions.map(option => option.provider),
          watchlistItemId: item.id,
        };
      }
      return null;
    }).filter(Boolean);

    // If we don't have any watchlist items, use mock data for now
    if (formattedWatchlist.length === 0) {
      // Mock watchlist data (in a real app, this would come from the database)
      const mockWatchlist = [
        {
          id: "tt0111161",
          title: "The Shawshank Redemption",
          posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
          type: "movie" as const,
          year: "1994",
          rating: 8.7,
          streamingServices: ["netflix", "hbo"],
        },
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
          id: "tt0468569",
          title: "The Dark Knight",
          posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          type: "movie" as const,
          year: "2008",
          rating: 8.5,
          streamingServices: ["hbo", "netflix"],
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
      ];

      return (
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Watchlist</h1>
            <Button asChild variant="outline">
              <Link href="/">Discover More</Link>
            </Button>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start adding movies and TV shows to your watchlist to keep track of what you want to watch.
            </p>
            <Button asChild>
              <Link href="/">Discover Content</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <Button asChild variant="outline">
            <Link href="/">Discover More</Link>
          </Button>
        </div>

        <ContentGrid
          items={formattedWatchlist}
          watchlistIds={formattedWatchlist.map(item => item.id)}
          onRemoveFromWatchlist={(id, type) => {
            // This will be handled by client components
          }}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching watchlist:", error);

    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading your watchlist. Please try again later.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Refresh Page
        </Button>
      </div>
    );
  }
}
