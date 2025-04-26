"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getImageUrl, truncateText } from "@/lib/utils";

interface HeroSectionProps {
  title: string;
  overview: string;
  backdropPath: string;
  id: string;
  type: "movie" | "tv";
  year?: string;
  streamingServices?: Array<{
    name: string;
    url: string;
  }>;
  onAddToWatchlist?: () => void;
}

export function HeroSection({
  title,
  overview,
  backdropPath,
  id,
  type,
  year,
  streamingServices = [],
  onAddToWatchlist,
}: HeroSectionProps) {
  const detailsUrl = type === "movie" ? `/movies/${id}` : `/tv-shows/${id}`;
  const watchUrl = streamingServices.length > 0 ? streamingServices[0].url : detailsUrl;

  return (
    <div className="relative w-full h-[70vh] overflow-hidden">
      {/* Backdrop Image */}
      <div className="absolute inset-0 bg-muted">
        <Image
          src={getImageUrl(backdropPath, "backdrop")}
          alt={title}
          fill
          className="object-cover"
          priority
          onError={(e) => {
            // Fallback to a placeholder if the image fails to load
            const target = e.target as HTMLImageElement;
            target.src = "https://placehold.co/1280x720?text=" + encodeURIComponent(title);
            target.onerror = null; // Prevent infinite error loop
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/10" />
      </div>

      {/* Content */}
      <div className="container relative h-full flex flex-col justify-end pb-16">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {title} {year && <span className="text-muted-foreground">({year})</span>}
          </h1>
          <p className="text-lg text-muted-foreground">
            {truncateText(overview, 200)}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href={watchUrl}>
                <Play className="mr-2 h-5 w-5" />
                Watch Now
              </Link>
            </Button>

            <Button variant="outline" size="lg" onClick={onAddToWatchlist}>
              <Plus className="mr-2 h-5 w-5" />
              Add to Watchlist
            </Button>

            <Button variant="ghost" size="lg" asChild>
              <Link href={detailsUrl}>More Info</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
