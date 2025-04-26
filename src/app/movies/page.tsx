import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";
import { InfiniteScrollMovies } from "@/components/content/infinite-scroll-movies";

export const metadata = {
  title: "Movies | StreamHub",
  description: "Browse and discover movies from all your favorite streaming platforms in one place.",
};

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const session = await auth();
  const itemsPerPage = 30;
  const country = "in"; // Use India as the default country

  try {
    // Fetch initial movies from the database (or API if not cached)
    const movies = await streamingService.getPopularMovies(country, 1, itemsPerPage);

    // Format movie data for content grid
    const formattedMovies = movies.map((movie) => ({
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
        genres: movie.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
        streamingServices: movie.streamingOptions.map((option: any) => ({
          name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
          url: option.url
        }))
      }
    }));

    // If we don't have enough data from the database yet, use mock data
    if (formattedMovies.length < 10) {
      // Mock data for movies with fullContent
      const mockMovies = [
        {
          id: "tt0111161",
          title: "The Shawshank Redemption",
          posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
          type: "movie" as const,
          year: "1994",
          rating: 8.7,
          streamingServices: ["netflix", "hbo"],
          fullContent: {
            overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
            backdropPath: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
            releaseDate: "1994-09-23",
            genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
            streamingServices: [
              { name: "Netflix", url: "https://www.netflix.com/title/70005379" },
              { name: "HBO", url: "https://www.hbo.com/movies/the-shawshank-redemption" }
            ]
          }
        },
        {
          id: "tt0068646",
          title: "The Godfather",
          posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
          type: "movie" as const,
          year: "1972",
          rating: 8.7,
          streamingServices: ["paramount"],
          fullContent: {
            overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
            backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
            releaseDate: "1972-03-14",
            genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
            streamingServices: [
              { name: "Paramount", url: "https://www.paramountplus.com/movies/godfather/LpH_xLcPJoF8JpLdcbQHVPIbxe0Jckkg/" }
            ]
          }
        },
        // Add more mock movies with fullContent...
      ];

      // Generate more mock data
      const generateMoreMovies = (count: number) => {
        const result = [...mockMovies];
        while (result.length < count) {
          const originalMovies = mockMovies.slice(0, Math.min(mockMovies.length, count - result.length));
          const newMovies = originalMovies.map(movie => ({
            ...movie,
            id: movie.id + "_" + result.length,
            rating: Math.round((movie.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
            fullContent: movie.fullContent ? {
              ...movie.fullContent,
              streamingServices: movie.fullContent.streamingServices
            } : undefined
          }));
          result.push(...newMovies);
        }
        return result.slice(0, count);
      };

      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Movies</h1>
          <InfiniteScrollMovies
            initialMovies={generateMoreMovies(itemsPerPage)}
            userId={session?.user?.id || null}
            useMockData={true}
          />
        </div>
      );
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Movies</h1>
        <InfiniteScrollMovies
          initialMovies={formattedMovies}
          userId={session?.user?.id || null}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading movies:", error);

    // Fallback to a simple error page
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading the movies. Please try again later.
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
