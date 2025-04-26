"use client";

import { useState } from "react";
import { Heart, Loader2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface WatchlistButtonProps {
  contentId: string;
  contentType: "movie" | "tv";
  isInWatchlist: boolean;
  watchlistItemId?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function WatchlistButton({
  contentId,
  contentType,
  isInWatchlist,
  watchlistItemId,
  variant = "outline",
  size = "sm",
  className,
}: WatchlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleWatchlistAction = async () => {
    setIsLoading(true);

    try {
      if (isInWatchlist && watchlistItemId) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlist/${watchlistItemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to remove from watchlist");
        }

        toast({
          title: "Removed from watchlist",
          description: "The item has been removed from your watchlist.",
        });
      } else {
        // Add to watchlist
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contentId,
            contentType,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to add to watchlist");
        }

        toast({
          title: "Added to watchlist",
          description: "The item has been added to your watchlist.",
        });
      }

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error handling watchlist action:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isInWatchlist ? "default" : variant}
      size={size}
      className={className}
      onClick={handleWatchlistAction}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isInWatchlist ? (
        <Trash className="h-4 w-4 mr-2" />
      ) : (
        <Heart className={`h-4 w-4 mr-2 ${isInWatchlist ? "fill-current" : ""}`} />
      )}
      {isInWatchlist ? "Remove" : "Add to Watchlist"}
    </Button>
  );
}
