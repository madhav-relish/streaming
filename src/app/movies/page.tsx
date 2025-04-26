import { ContentGrid } from "@/components/content/content-grid";
import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";

export const metadata = {
  title: "Movies | StreamHub",
  description: "Browse and discover movies from all your favorite streaming platforms in one place.",
};

export default async function MoviesPage() {
  const session = await auth();

  try {
    // Fetch movies from the database (or API if not cached)
    const movies = await streamingService.getPopularMovies("us", 1, 30);

    // Format movie data for content grid
    const formattedMovies = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      type: "movie" as const,
      year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : "",
      rating: movie.voteAverage,
      streamingServices: movie.streamingOptions.map((option: any) => option.provider),
    }));

    // If we don't have enough data from the database yet, use mock data
    if (formattedMovies.length < 10) {
      // Mock data for movies
      const mockMovies = [
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
          id: "tt0068646",
          title: "The Godfather",
          posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
          type: "movie" as const,
          year: "1972",
          rating: 8.7,
          streamingServices: ["paramount"],
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
          id: "tt0167260",
          title: "The Lord of the Rings: The Return of the King",
          posterPath: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
          type: "movie" as const,
          year: "2003",
          rating: 8.5,
          streamingServices: ["hbo", "prime"],
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
        {
          id: "tt0133093",
          title: "The Matrix",
          posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
          type: "movie" as const,
          year: "1999",
          rating: 8.3,
          streamingServices: ["hbo", "netflix"],
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
          id: "tt0073486",
          title: "One Flew Over the Cuckoo's Nest",
          posterPath: "/3jcbDmRFiQ83drXNOvRDeKHxS0C.jpg",
          type: "movie" as const,
          year: "1975",
          rating: 8.5,
          streamingServices: ["hbo", "prime"],
        },
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
          }));
          result.push(...newMovies);
        }
        return result.slice(0, count);
      };

      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Movies</h1>
          <ContentGrid items={generateMoreMovies(30)} />
        </div>
      );
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Movies</h1>
        <ContentGrid items={formattedMovies} />
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
