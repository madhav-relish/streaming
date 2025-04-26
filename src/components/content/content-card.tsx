"use client";

import Link from "next/link";
import { Heart, Loader2, Trash, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { truncateText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SafeImage } from "@/components/ui/safe-image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContentPreviewModal } from "./content-preview-modal";

interface ContentCardProps {
  id: string;
  title: string;
  posterPath: string | null;
  type: "movie" | "tv";
  year?: string | null;
  rating?: number | null;
  streamingServices?: string[];
  onAddToWatchlist?: () => void;
  isInWatchlist?: boolean;
  watchlistAction?: "add" | "remove";
  watchlistItemId?: string;
  userId?: string | null;
  // Additional data for modal
  fullContent?: {
    overview?: string | null;
    backdropPath?: string | null;
    releaseDate?: string | null;
    runtime?: number | null;
    genres?: { id: string; name: string }[];
    streamingServices?: { name: string; url: string }[];
  };
}

export function ContentCard({
  id,
  title,
  posterPath,
  type,
  year,
  rating,
  streamingServices = [],
  onAddToWatchlist,
  isInWatchlist = false,
  watchlistItemId = "",
  userId,
  fullContent,
}: ContentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const href = type === "movie" ? `/movies/${id}` : `/tv-shows/${id}`;

  // Prepare content data for modal
  const modalContent = fullContent
    ? {
        id,
        title,
        posterPath,
        type,
        overview: fullContent.overview,
        backdropPath: fullContent.backdropPath,
        releaseDate: fullContent.releaseDate,
        runtime: fullContent.runtime,
        voteAverage: rating,
        genres: fullContent.genres,
        streamingServices: fullContent.streamingServices,
      }
    : null;

  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col group cursor-pointer">
        <div
          className="relative overflow-hidden"
          onClick={() => modalContent && setIsModalOpen(true)}
        >
          <div className="aspect-[2/3] relative overflow-hidden bg-muted">
            <SafeImage
              src={posterPath}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {rating && (
            <div className="absolute top-2 right-2 flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded-md">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <CardContent
          className="p-4 flex-grow"
          onClick={() => modalContent && setIsModalOpen(true)}
        >
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
            {truncateText(title, 40)}
          </h3>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            {year && <span>{year}</span>}
            {type === "movie" ? (
              <Badge variant="outline" className="ml-2">
                Movie
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2">
                TV
              </Badge>
            )}
          </div>
          {streamingServices && streamingServices.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {streamingServices.map((service) => (
                <Badge key={service} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                No streaming info
              </Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isInWatchlist ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddToWatchlist) onAddToWatchlist();
                  }}
                  disabled={!onAddToWatchlist}
                >
                  {isInWatchlist ? (
                    <>
                      <Trash className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  ) : (
                    <>
                      <Heart
                        className={`h-4 w-4 mr-2 ${isInWatchlist ? "fill-current" : ""}`}
                      />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isInWatchlist
                  ? "Remove from your watchlist"
                  : "Add to your watchlist"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      {/* Preview Modal */}
      {modalContent && (
        <ContentPreviewModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          content={modalContent}
          isInWatchlist={isInWatchlist}
          watchlistItemId={watchlistItemId}
          userId={userId}
        />
      )}
    </>
  );
}
