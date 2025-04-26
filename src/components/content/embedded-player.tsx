"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbeddedPlayerProps {
  url: string;
  serviceName: string;
  fallbackText?: string;
}

export function EmbeddedPlayer({
  url,
  serviceName,
  fallbackText = "This streaming service doesn't support embedding",
}: EmbeddedPlayerProps) {
  const [iframeSupported, setIframeSupported] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setIframeSupported(data.supported);
      } catch (error) {
        console.error("Error checking iframe support:", error);
        setError("Failed to check if this content can be embedded");
        setIframeSupported(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkIframeSupport();
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Watch on {serviceName}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  if (!iframeSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <h2 className="text-xl font-semibold mb-4">{fallbackText}</h2>
        <p className="text-muted-foreground mb-6">
          Unfortunately, {serviceName} doesn't allow their content to be embedded in other websites.
          You can still watch this content by clicking the button below.
        </p>
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Watch on {serviceName}
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={url}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={`Watch on ${serviceName}`}
      />
    </div>
  );
}
