"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink, RefreshCcw, Maximize, Minimize, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InAppBrowserProps {
  url: string;
  serviceName: string;
  contentTitle: string;
  contentType: "movie" | "tv";
  contentId: string;
  onBack?: () => void;
}

export function InAppBrowser({ 
  url, 
  serviceName, 
  contentTitle,
  contentType,
  contentId,
  onBack 
}: InAppBrowserProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Handle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => {
            setError(`Error attempting to enable fullscreen: ${err.message}`);
          });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => {
            setError(`Error attempting to exit fullscreen: ${err.message}`);
          });
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push(`/${contentType}s/${contentId}`);
    }
  };

  // Handle iframe load errors
  const handleIframeError = () => {
    setError("Unable to load content in the embedded viewer. This streaming service may not allow embedding.");
    setIsLoading(false);
  };

  // Refresh the iframe content
  const refreshContent = () => {
    setIsLoading(true);
    setError(null);
    
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-[85vh]'} bg-background`}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to details</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="text-sm font-medium truncate max-w-[200px] md:max-w-md">
            {contentTitle} <span className="text-muted-foreground">on {serviceName}</span>
          </div>
        </div>
        
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={refreshContent}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isFullscreen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()}>
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close fullscreen</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="relative flex-grow">
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading content from {serviceName}...</p>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="max-w-md p-6 bg-card rounded-lg shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4">Unable to Load Content</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={refreshContent}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* The iframe */}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={handleIframeError}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        />
      </div>
      
      {/* Footer with help text */}
      {!isFullscreen && (
        <div className="p-3 bg-muted text-sm text-center">
          <p>
            Having trouble viewing? Try{" "}
            <button onClick={toggleFullscreen} className="text-primary underline">
              fullscreen mode
            </button>{" "}
            or{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              open in a new tab
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
