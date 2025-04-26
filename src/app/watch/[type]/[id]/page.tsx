"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmbeddedPlayer } from "@/components/content/embedded-player";

interface WatchPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function WatchPage({ params }: WatchPageProps) {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "Unknown Service";
  const url = searchParams.get("url");

  // Determine the content type for display
  const contentType = params.type === "movie" ? "movie" : "TV show";

  // Get the back URL
  const backUrl = params.type === "movie"
    ? `/movies/${params.id}`
    : `/tv-shows/${params.id}`;

  if (!url) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">No Streaming URL Provided</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find a streaming URL for this content.
          </p>
          <Button asChild>
            <Link href={backUrl}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {contentType} details
          </Link>
        </Button>

        <div className="text-sm text-muted-foreground">
          Watching on {service}
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open in new tab
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>

      <EmbeddedPlayer
        url={url}
        serviceName={service}
        fallbackText={`This ${contentType} can't be embedded`}
      />
    </div>
  );
}
