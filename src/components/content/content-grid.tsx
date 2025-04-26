"use client";

import { ContentCard } from "@/components/content/content-card";
import { cn } from "@/lib/utils";

interface ContentGridProps {
  items: {
    id: string;
    title: string;
    posterPath: string | null;
    type: "movie" | "tv";
    year?: string | null;
    rating?: number | null;
    streamingServices?: string[];
    watchlistItemId?: string; // ID of the watchlist item (if in watchlist)
    fullContent?: {
      overview?: string | null;
      backdropPath?: string | null;
      releaseDate?: string | null;
      runtime?: number | null;
      genres?: { id: string; name: string }[];
      streamingServices?: { name: string; url: string }[];
    };
  }[];
  className?: string;
  onAddToWatchlist?: (id: string, type: "movie" | "tv") => void;
  onRemoveFromWatchlist?: (watchlistItemId: string) => void;
  watchlistIds?: string[];
  userId?: string | null;
  emptyMessage?: string;
}

export function ContentGrid({
  items,
  className,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  watchlistIds = [],
  userId = null,
  emptyMessage = "No content found",
}: ContentGridProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
        className
      )}
    >
      {items.map((item) => (
        <ContentCard
          key={`${item.type}-${item.id}`}
          id={item.id}
          title={item.title}
          posterPath={item.posterPath}
          type={item.type}
          year={item.year}
          rating={item.rating}
          streamingServices={item.streamingServices}
          isInWatchlist={watchlistIds.includes(item.id)}
          onAddToWatchlist={
            onAddToWatchlist && !watchlistIds.includes(item.id)
              ? () => onAddToWatchlist(item.id, item.type)
              : onRemoveFromWatchlist && item.watchlistItemId
              ? () => onRemoveFromWatchlist(item.watchlistItemId!)
              : undefined
          }
          watchlistAction={watchlistIds.includes(item.id) ? "remove" : "add"}
          userId={userId}
          fullContent={item.fullContent}
        />
      ))}
    </div>
  );
}
