"use client";

import { useEffect, useState } from "react";
import { ContentGrid } from "@/components/content/content-grid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollGridProps {
  initialItems: any[];
  fetchMoreItems: (page: number) => Promise<any[]>;
  userId?: string | null;
  emptyMessage?: string;
  onAddToWatchlist?: (id: string, type: "movie" | "tv") => void;
  onRemoveFromWatchlist?: (watchlistItemId: string) => void;
  watchlistIds?: string[];
}

export function InfiniteScrollGrid({
  initialItems,
  fetchMoreItems,
  userId = null,
  emptyMessage = "No content found",
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlistIds = [],
}: InfiniteScrollGridProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 400px 0px", // Load more content when user is 400px from the bottom
  });

  useEffect(() => {
    // Reset state when initialItems change
    setItems(initialItems);
    setPage(1);
    setHasMore(true);
  }, [initialItems]);

  useEffect(() => {
    const loadMoreItems = async () => {
      if (inView && hasMore && !loading) {
        setLoading(true);
        try {
          const nextPage = page + 1;
          const newItems = await fetchMoreItems(nextPage);
          
          if (newItems.length === 0) {
            setHasMore(false);
          } else {
            setItems((prevItems) => [...prevItems, ...newItems]);
            setPage(nextPage);
          }
        } catch (error) {
          console.error("Error loading more items:", error);
          setHasMore(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMoreItems();
  }, [inView, hasMore, loading, page, fetchMoreItems]);

  return (
    <div>
      <ContentGrid
        items={items}
        userId={userId}
        emptyMessage={emptyMessage}
        onAddToWatchlist={onAddToWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
        watchlistIds={watchlistIds}
      />
      
      {hasMore && (
        <div 
          ref={ref} 
          className="flex justify-center items-center py-8"
        >
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No more content to load
        </div>
      )}
    </div>
  );
}
