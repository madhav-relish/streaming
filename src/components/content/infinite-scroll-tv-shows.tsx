"use client";

import { useEffect, useState } from "react";
import { ContentGrid } from "@/components/content/content-grid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollTvShowsProps {
  initialTvShows: any[];
  userId?: string | null;
  useMockData?: boolean;
}

export function InfiniteScrollTvShows({
  initialTvShows,
  userId = null,
  useMockData = false,
}: InfiniteScrollTvShowsProps) {
  const [tvShows, setTvShows] = useState(initialTvShows);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 400px 0px", // Load more content when user is 400px from the bottom
  });

  useEffect(() => {
    // Reset state when initialTvShows change
    setTvShows(initialTvShows);
    setPage(1);
    setHasMore(true);
  }, [initialTvShows]);

  useEffect(() => {
    const loadMoreTvShows = async () => {
      if (inView && hasMore && !loading) {
        setLoading(true);
        try {
          const nextPage = page + 1;
          
          if (useMockData) {
            // Generate mock data for the next page
            const newTvShows = generateMockTvShows(nextPage);
            setTvShows((prevTvShows) => [...prevTvShows, ...newTvShows]);
            setPage(nextPage);
            
            // Simulate end of data after 10 pages
            if (nextPage >= 10) {
              setHasMore(false);
            }
          } else {
            // Fetch real data from the API
            const response = await fetch(`/api/tv-shows?page=${nextPage}&limit=20`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch TV shows: ${response.status}`);
            }
            
            const newTvShows = await response.json();
            
            if (newTvShows.length === 0) {
              setHasMore(false);
            } else {
              setTvShows((prevTvShows) => [...prevTvShows, ...newTvShows]);
              setPage(nextPage);
            }
          }
        } catch (error) {
          console.error("Error loading more TV shows:", error);
          setHasMore(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMoreTvShows();
  }, [inView, hasMore, loading, page, useMockData]);

  // Function to generate mock TV shows for infinite scrolling
  const generateMockTvShows = (pageNum: number) => {
    const mockTvShows = [
      {
        id: "tt0944947",
        title: "Game of Thrones",
        posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
        type: "tv" as const,
        year: "2011",
        rating: 8.4,
        streamingServices: ["hbo"],
        fullContent: {
          overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond.",
          backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
          releaseDate: "2011-04-17",
          genres: [{ id: "10765", name: "Sci-Fi & Fantasy" }, { id: "18", name: "Drama" }],
          streamingServices: [
            { name: "HBO", url: "https://www.hbo.com/game-of-thrones" }
          ]
        }
      },
      {
        id: "tt0903747",
        title: "Breaking Bad",
        posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        type: "tv" as const,
        year: "2008",
        rating: 8.5,
        streamingServices: ["netflix"],
        fullContent: {
          overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live. He becomes filled with a sense of fearlessness and an unrelenting desire to secure his family's financial future at any cost as he enters the dangerous world of drugs and crime.",
          backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
          releaseDate: "2008-01-20",
          genres: [{ id: "18", name: "Drama" }],
          streamingServices: [
            { name: "Netflix", url: "https://www.netflix.com/title/70143836" }
          ]
        }
      },
    ];

    // Generate new TV shows with unique IDs based on the page number
    return mockTvShows.map(tvShow => ({
      ...tvShow,
      id: `${tvShow.id}_page${pageNum}_${Math.random().toString(36).substring(2, 9)}`,
      rating: Math.round((tvShow.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
      fullContent: tvShow.fullContent ? {
        ...tvShow.fullContent,
        streamingServices: tvShow.fullContent.streamingServices
      } : undefined
    }));
  };

  return (
    <div>
      <ContentGrid
        items={tvShows}
        userId={userId}
        emptyMessage="No TV shows found"
      />
      
      {hasMore && (
        <div 
          ref={ref} 
          className="flex justify-center items-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more TV shows...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && tvShows.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No more TV shows to load
        </div>
      )}
    </div>
  );
}
