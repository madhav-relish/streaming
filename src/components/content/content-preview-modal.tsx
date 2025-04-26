import React from "react";
import Link from "next/link";
import { Play, Star, X, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRuntime } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";

interface ContentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    id: string;
    title: string;
    overview?: string | null;
    posterPath?: string | null;
    backdropPath?: string | null;
    releaseDate?: string | null;
    runtime?: number | null;
    voteAverage?: number | null;
    genres?: { id: string; name: string }[];
    streamingServices?: { name: string; url: string }[];
    type: "movie" | "tv";
  } | null;
  isInWatchlist?: boolean;
  watchlistItemId?: string;
  userId?: string | null;
}

export function ContentPreviewModal({
  open,
  onOpenChange,
  content,
  isInWatchlist = false,
  watchlistItemId = "",
  userId,
}: ContentPreviewModalProps) {
  if (!content) return null;

  const releaseYear = content.releaseDate
    ? new Date(content.releaseDate).getFullYear()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-6 w-6 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Backdrop Image */}
        <div className="relative w-full h-[40vh] overflow-hidden">
          <SafeImage
            src={content.backdropPath}
            alt={content.title}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/10" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Poster (hidden on small screens) */}
              <div className="hidden md:block flex-shrink-0 w-32 rounded-lg overflow-hidden shadow-lg">
                <SafeImage
                  src={content.posterPath}
                  alt={content.title}
                  width={128}
                  height={192}
                  className="w-full h-auto"
                />
              </div>

              {/* Details */}
              <div className="flex-grow space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  {content.title}{" "}
                  {releaseYear && (
                    <span className="text-muted-foreground">({releaseYear})</span>
                  )}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {content.voteAverage && (
                    <>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{content.voteAverage.toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                    </>
                  )}
                  {content.runtime && (
                    <>
                      <span>{formatRuntime(content.runtime)}</span>
                      <span className="text-muted-foreground">•</span>
                    </>
                  )}
                  {releaseYear && <span>{releaseYear}</span>}
                </div>

                {content.genres && content.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {content.genres.map((genre) => (
                      <Link key={genre.id} href={`/genres/${genre.id}`}>
                        <Badge variant="secondary">{genre.name}</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Overview */}
          {content.overview && (
            <DialogDescription className="text-foreground">
              {content.overview.length > 200
                ? `${content.overview.substring(0, 200)}...`
                : content.overview}
            </DialogDescription>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {content.streamingServices && content.streamingServices.length > 0 ? (
              <Button asChild>
                <Link href={`/watch/${content.type}/${content.id}?service=${encodeURIComponent(content.streamingServices[0].name)}&url=${encodeURIComponent(content.streamingServices[0].url)}&title=${encodeURIComponent(content.title)}&poster=${encodeURIComponent(content.posterPath || '')}`}>
                  <Play className="mr-2 h-5 w-5" />
                  Watch on {content.streamingServices[0].name}
                </Link>
              </Button>
            ) : (
              <Button disabled>
                <Play className="mr-2 h-5 w-5" />
                Not Available for Streaming
              </Button>
            )}

            {userId ? (
              <WatchlistButton
                contentId={content.id}
                contentType={content.type}
                isInWatchlist={isInWatchlist}
                watchlistItemId={watchlistItemId}
                variant="outline"
              />
            ) : (
              <Button variant="outline" asChild>
                <Link href="/api/auth/signin">Sign in to add to Watchlist</Link>
              </Button>
            )}

            <Button variant="outline" asChild>
              <Link href={content.type === "tv" ? `/tv-shows/${content.id}` : `/movies/${content.id}`}>
                <Info className="mr-2 h-5 w-5" />
                More Details
              </Link>
            </Button>
          </div>

          {/* Streaming Options */}
          {content.streamingServices && content.streamingServices.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Where to Watch</h3>
              <div className="flex flex-wrap gap-2">
                {content.streamingServices.map((service, index) => (
                  <Button key={index} asChild variant="outline" size="sm">
                    <Link href={`/watch/${content.type}/${content.id}?service=${encodeURIComponent(service.name)}&url=${encodeURIComponent(service.url)}&title=${encodeURIComponent(content.title)}&poster=${encodeURIComponent(content.posterPath || '')}`}>
                      {service.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
