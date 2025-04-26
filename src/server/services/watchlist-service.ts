import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Custom error class for watchlist service errors
 */
export class WatchlistServiceError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: Error) {
    super(message);
    this.name = "WatchlistServiceError";
  }
}

/**
 * Service to handle user watchlists
 */
export class WatchlistService {
  /**
   * Get a user's watchlist
   */
  async getUserWatchlist(userId: string) {
    try {
      const watchlistItems = await prisma.watchlist.findMany({
        where: { userId },
        include: {
          movie: {
            include: {
              genres: true,
              streamingOptions: true,
            },
          },
          tvShow: {
            include: {
              genres: true,
              streamingOptions: true,
            },
          },
        },
        orderBy: {
          addedAt: "desc",
        },
      });

      return watchlistItems;
    } catch (error) {
      console.error("Error fetching user watchlist:", error);
      throw new WatchlistServiceError(
        `Failed to fetch watchlist: ${error.message}`,
        "DATABASE_ERROR",
        error
      );
    }
  }

  /**
   * Add an item to a user's watchlist
   */
  async addToWatchlist(userId: string, contentType: "movie" | "tv", contentId: string) {
    try {
      // Check if the item is already in the watchlist
      const existingItem = await prisma.watchlist.findFirst({
        where: {
          userId,
          ...(contentType === "movie"
            ? { movieId: contentId }
            : { tvShowId: contentId }),
        },
      });

      if (existingItem) {
        return existingItem; // Item already in watchlist
      }

      // Add the item to the watchlist
      const watchlistItem = await prisma.watchlist.create({
        data: {
          user: {
            connect: { id: userId },
          },
          ...(contentType === "movie"
            ? { movie: { connect: { id: contentId } } }
            : { tvShow: { connect: { id: contentId } } }),
        },
        include: {
          movie: {
            include: {
              genres: true,
              streamingOptions: true,
            },
          },
          tvShow: {
            include: {
              genres: true,
              streamingOptions: true,
            },
          },
        },
      });

      return watchlistItem;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        throw new WatchlistServiceError(
          `Content not found: ${contentId}`,
          'CONTENT_NOT_FOUND',
          error
        );
      } else {
        throw new WatchlistServiceError(
          `Failed to add to watchlist: ${error.message}`,
          'DATABASE_ERROR',
          error
        );
      }
    }
  }

  /**
   * Remove an item from a user's watchlist
   */
  async removeFromWatchlist(userId: string, watchlistItemId: string) {
    try {
      // Check if the item exists and belongs to the user
      const watchlistItem = await prisma.watchlist.findFirst({
        where: {
          id: watchlistItemId,
          userId,
        },
      });

      if (!watchlistItem) {
        throw new WatchlistServiceError(
          "Watchlist item not found or does not belong to user",
          "ITEM_NOT_FOUND"
        );
      }

      // Remove the item from the watchlist
      await prisma.watchlist.delete({
        where: {
          id: watchlistItemId,
        },
      });

      return { success: true, message: "Item removed from watchlist" };
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      
      if (error instanceof WatchlistServiceError) {
        throw error;
      }
      
      throw new WatchlistServiceError(
        `Failed to remove from watchlist: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }

  /**
   * Check if an item is in a user's watchlist
   */
  async isInWatchlist(userId: string, contentType: "movie" | "tv", contentId: string) {
    try {
      const watchlistItem = await prisma.watchlist.findFirst({
        where: {
          userId,
          ...(contentType === "movie"
            ? { movieId: contentId }
            : { tvShowId: contentId }),
        },
      });

      return {
        isInWatchlist: !!watchlistItem,
        watchlistItemId: watchlistItem?.id,
      };
    } catch (error) {
      console.error("Error checking watchlist:", error);
      throw new WatchlistServiceError(
        `Failed to check watchlist: ${error.message}`,
        'DATABASE_ERROR',
        error
      );
    }
  }
}

// Export a singleton instance
export const watchlistService = new WatchlistService();
