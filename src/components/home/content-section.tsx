"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentGrid } from "@/components/content/content-grid";
import { ContentCard } from "@/components/content/content-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ContentSectionProps {
  title: string;
  viewAllHref?: string;
  items: {
    id: string;
    title: string;
    posterPath: string | null;
    type: "movie" | "tv";
    year?: string | null;
    rating?: number | null;
    streamingServices?: string[];
    // Additional data for modal
    fullContent?: {
      overview?: string | null;
      backdropPath?: string | null;
      releaseDate?: string | null;
      runtime?: number | null;
      genres?: { id: string; name: string }[];
      streamingServices?: { name: string; url: string }[];
    };
  }[];
  onAddToWatchlist?: (id: string, type: "movie" | "tv") => void;
  watchlistIds?: string[];
  userId?: string | null;
}

export function ContentSection({
  title,
  viewAllHref,
  items,
  onAddToWatchlist,
  watchlistIds = [],
  userId,
}: ContentSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {viewAllHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref} className="flex items-center">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground">
              We couldn't find any {title.toLowerCase()} to display at this time.
            </p>
          </div>
        ) : (
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4">
              {items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="w-[200px] shrink-0">
                  <ContentCard
                    id={item.id}
                    title={item.title}
                    posterPath={item.posterPath}
                    type={item.type}
                    year={item.year}
                    rating={item.rating}
                    streamingServices={item.streamingServices}
                    isInWatchlist={watchlistIds?.includes(item.id)}
                    onAddToWatchlist={
                      onAddToWatchlist
                        ? () => onAddToWatchlist(item.id, item.type)
                        : undefined
                    }
                    userId={userId}
                    fullContent={item.fullContent}
                    watchlistItemId={watchlistIds?.includes(item.id) ? item.id : ""}
                  />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </section>
  );
}
