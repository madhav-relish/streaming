"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { streamingService } from "@/server/services/streaming-service";
import { useEffect, useState } from "react";

interface WatchPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function WatchPage({ params }: WatchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "Unknown Service";
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Content";
  const posterUrl = searchParams.get("poster") || null;

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isOpened, setIsOpened] = useState(false);

  // Validate content type
  const contentType = params.type === "movie" ? "movie" :
                     params.type === "tv" ? "tv" : null;

  if (!contentType || !url) {
    notFound();
  }

  // Get the back URL
  const backUrl = `/${contentType}s/${params.id}`;

  // Handle auto-redirect countdown
  useEffect(() => {
    if (countdown === null) {
      setCountdown(5);
    } else if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isOpened) {
      window.open(url, '_blank');
      setIsOpened(true);
    }
  }, [countdown, url, isOpened]);

  // Handle opening the streaming service
  const handleOpenService = () => {
    window.open(url, '_blank');
    setIsOpened(true);
    setCountdown(null);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {contentType} details
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Watch {title}</h1>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {posterUrl && (
              <div className="w-40 h-60 relative rounded-md overflow-hidden flex-shrink-0">
                <SafeImage
                  src={posterUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground mb-4">
                Available on <span className="font-medium text-foreground">{service}</span>
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">Why am I seeing this page?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Streaming services like {service} use security measures to prevent their content from being
                  embedded directly within other websites or applications. This is to protect their content
                  and prevent unauthorized embedding.
                </p>
                <p className="text-sm text-muted-foreground">
                  To watch this content, you'll need to open it directly on {service}'s website.
                  Don't worry - you can easily return to this app afterward.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" onClick={handleOpenService}>
                  <Play className="mr-2 h-5 w-5" />
                  {isOpened ? "Open Again" : countdown !== null ? `Opening in ${countdown}s...` : "Watch Now"}
                </Button>

                <Button variant="outline" size="lg" asChild>
                  <Link href={backUrl}>
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isOpened ? "Content opened in a new tab" : "Click 'Watch Now' to open content"}
            </p>

            <Button variant="ghost" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Manually
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
