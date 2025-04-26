"use client";

import { useEffect, useState } from "react";
import { ContentGrid } from "@/components/content/content-grid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollMoviesProps {
  initialMovies: any[];
  userId?: string | null;
  useMockData?: boolean;
}

export function InfiniteScrollMovies({
  initialMovies,
  userId = null,
  useMockData = false,
}: InfiniteScrollMoviesProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 400px 0px", // Load more content when user is 400px from the bottom
  });

  useEffect(() => {
    // Reset state when initialMovies change
    setMovies(initialMovies);
    setPage(1);
    setHasMore(true);
  }, [initialMovies]);

  useEffect(() => {
    const loadMoreMovies = async () => {
      if (inView && hasMore && !loading) {
        setLoading(true);
        try {
          const nextPage = page + 1;
          
          if (useMockData) {
            // Generate mock data for the next page
            const newMovies = generateMockMovies(nextPage);
            setMovies((prevMovies) => [...prevMovies, ...newMovies]);
            setPage(nextPage);
            
            // Simulate end of data after 10 pages
            if (nextPage >= 10) {
              setHasMore(false);
            }
          } else {
            // Fetch real data from the API
            const response = await fetch(`/api/movies?page=${nextPage}&limit=20`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch movies: ${response.status}`);
            }
            
            const newMovies = await response.json();
            
            if (newMovies.length === 0) {
              setHasMore(false);
            } else {
              setMovies((prevMovies) => [...prevMovies, ...newMovies]);
              setPage(nextPage);
            }
          }
        } catch (error) {
          console.error("Error loading more movies:", error);
          setHasMore(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMoreMovies();
  }, [inView, hasMore, loading, page, useMockData]);

  // Function to generate mock movies for infinite scrolling
  const generateMockMovies = (pageNum: number) => {
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
    ];

    // Generate new movies with unique IDs based on the page number
    return mockMovies.map(movie => ({
      ...movie,
      id: `${movie.id}_page${pageNum}_${Math.random().toString(36).substring(2, 9)}`,
      rating: Math.round((movie.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
      fullContent: movie.fullContent ? {
        ...movie.fullContent,
        streamingServices: movie.fullContent.streamingServices
      } : undefined
    }));
  };

  return (
    <div>
      <ContentGrid
        items={movies}
        userId={userId}
        emptyMessage="No movies found"
      />
      
      {hasMore && (
        <div 
          ref={ref} 
          className="flex justify-center items-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more movies...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && movies.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No more movies to load
        </div>
      )}
    </div>
  );
}
