"use client";

import Link from "next/link";
import { Play, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { truncateText } from "@/lib/utils";
import { SafeImage } from "@/components/ui/safe-image";

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
        <SafeImage
          src={backdropPath}
          alt={title}
          fill
          className="object-cover"
          priority
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
            {streamingServices.length > 0 && (
              <Button asChild size="lg">
                <Link href={watchUrl}>
                  <Play className="mr-2 h-5 w-5" />
                  Watch Now
                </Link>
              </Button>
            )}

            {onAddToWatchlist && (
              <Button variant="outline" size="lg" onClick={onAddToWatchlist}>
                <Plus className="mr-2 h-5 w-5" />
                Add to Watchlist
              </Button>
            )}

            <Button variant={streamingServices.length > 0 ? "ghost" : "default"} size="lg" asChild>
              <Link href={detailsUrl}>More Info</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
