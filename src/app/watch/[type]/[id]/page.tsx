"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WatchPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function WatchPage({ params }: WatchPageProps) {
  const searchParams = useSearchParams();
  const service = searchParams.get("service");
  const url = searchParams.get("url");
  const [iframeSupported, setIframeSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the URL can be embedded in an iframe
    const checkIframeSupport = async () => {
      if (!url) return;
      
      try {
        // Try to fetch the X-Frame-Options header
        const response = await fetch("/api/check-iframe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });
        
        const data = await response.json();
        setIframeSupported(data.supported);
      } catch (error) {
        console.error("Error checking iframe support:", error);
        setIframeSupported(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkIframeSupport();
  }, [url]);

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

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : iframeSupported ? (
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={url}
            className="absolute top-0 left-0 w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={`Watch ${contentType}`}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <h1 className="text-2xl font-bold mb-4">
            This streaming service doesn't support embedding
          </h1>
          <p className="text-muted-foreground mb-6">
            Unfortunately, {service} doesn't allow their content to be embedded in other websites.
            You can still watch this {contentType} by clicking the button below.
          </p>
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Watch on {service}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
