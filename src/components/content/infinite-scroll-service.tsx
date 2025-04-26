"use client";

import { useEffect, useState } from "react";
import { ContentGrid } from "@/components/content/content-grid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollServiceProps {
  initialContent: any[];
  service: string;
  contentType?: "movie" | "series";
  userId?: string | null;
  useMockData?: boolean;
}

export function InfiniteScrollService({
  initialContent,
  service,
  contentType = "movie",
  userId = null,
  useMockData = false,
}: InfiniteScrollServiceProps) {
  const [content, setContent] = useState(initialContent);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 400px 0px", // Load more content when user is 400px from the bottom
  });

  useEffect(() => {
    // Reset state when initialContent change
    setContent(initialContent);
    setPage(1);
    setHasMore(true);
  }, [initialContent, service, contentType]);

  useEffect(() => {
    const loadMoreContent = async () => {
      if (inView && hasMore && !loading) {
        setLoading(true);
        try {
          const nextPage = page + 1;
          
          if (useMockData) {
            // Generate mock data for the next page
            const newContent = generateMockContent(nextPage, service, contentType);
            setContent((prevContent) => [...prevContent, ...newContent]);
            setPage(nextPage);
            
            // Simulate end of data after 10 pages
            if (nextPage >= 10) {
              setHasMore(false);
            }
          } else {
            // Fetch real data from the API
            const response = await fetch(`/api/streaming/${service}?page=${nextPage}&limit=20&type=${contentType}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch content: ${response.status}`);
            }
            
            const newContent = await response.json();
            
            if (newContent.length === 0) {
              setHasMore(false);
            } else {
              setContent((prevContent) => [...prevContent, ...newContent]);
              setPage(nextPage);
            }
          }
        } catch (error) {
          console.error(`Error loading more ${contentType}s:`, error);
          setHasMore(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMoreContent();
  }, [inView, hasMore, loading, page, service, contentType, useMockData]);

  // Function to generate mock content for infinite scrolling
  const generateMockContent = (pageNum: number, service: string, type: string) => {
    const mockMovies = [
      {
        id: "tt0111161",
        title: "The Shawshank Redemption",
        posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        type: "movie" as const,
        year: "1994",
        rating: 8.7,
        streamingServices: [service],
        fullContent: {
          overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
          backdropPath: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
          releaseDate: "1994-09-23",
          genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
          streamingServices: [
            { name: service.charAt(0).toUpperCase() + service.slice(1), url: `https://www.${service}.com/title/70005379` }
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
        streamingServices: [service],
        fullContent: {
          overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
          backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
          releaseDate: "1972-03-14",
          genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
          streamingServices: [
            { name: service.charAt(0).toUpperCase() + service.slice(1), url: `https://www.${service}.com/title/godfather` }
          ]
        }
      },
    ];

    const mockTvShows = [
      {
        id: "tt0944947",
        title: "Game of Thrones",
        posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
        type: "tv" as const,
        year: "2011",
        rating: 8.4,
        streamingServices: [service],
        fullContent: {
          overview: "Seven noble families fight for control of the mythical land of Westeros.",
          backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
          releaseDate: "2011-04-17",
          genres: [{ id: "10765", name: "Sci-Fi & Fantasy" }, { id: "18", name: "Drama" }],
          streamingServices: [{ name: service.charAt(0).toUpperCase() + service.slice(1), url: `https://www.${service}.com/title/game-of-thrones` }]
        }
      },
      {
        id: "tt0903747",
        title: "Breaking Bad",
        posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        type: "tv" as const,
        year: "2008",
        rating: 8.5,
        streamingServices: [service],
        fullContent: {
          overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
          backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
          releaseDate: "2008-01-20",
          genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
          streamingServices: [{ name: service.charAt(0).toUpperCase() + service.slice(1), url: `https://www.${service}.com/title/breaking-bad` }]
        }
      },
    ];

    const mockContent = type === "movie" ? mockMovies : mockTvShows;

    // Generate new content with unique IDs based on the page number
    return mockContent.map(item => ({
      ...item,
      id: `${item.id}_page${pageNum}_${Math.random().toString(36).substring(2, 9)}`,
      rating: Math.round((item.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
      fullContent: item.fullContent ? {
        ...item.fullContent,
        streamingServices: item.fullContent.streamingServices
      } : undefined
    }));
  };

  const contentTypeLabel = contentType === "movie" ? "movies" : "TV shows";

  return (
    <div>
      <ContentGrid
        items={content}
        userId={userId}
        emptyMessage={`No ${contentTypeLabel} found on ${service}`}
      />
      
      {hasMore && (
        <div 
          ref={ref} 
          className="flex justify-center items-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more {contentTypeLabel}...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && content.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No more {contentTypeLabel} to load
        </div>
      )}
    </div>
  );
}
