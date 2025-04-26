import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to get image URL for posters and backdrops
export function getImageUrl(path: string | null | undefined, size: "poster" | "backdrop" = "poster"): string {
  // Default placeholder images (using PNG format instead of SVG)
  const placeholderPoster = "https://placehold.co/342x513.png?text=No+Image";
  const placeholderBackdrop = "https://placehold.co/1280x720.png?text=No+Image";

  // Import the image cache functions
  let hasImageFailed = () => false;
  if (typeof window !== 'undefined') {
    try {
      // Try to dynamically import the image cache functions
      const cachedUrls = localStorage.getItem('failed_image_urls');
      if (cachedUrls) {
        const failedUrls = new Set(JSON.parse(cachedUrls));
        hasImageFailed = (url: string) => failedUrls.has(url);
      }
    } catch (error) {
      console.error('Error loading image cache:', error);
    }
  }

  if (!path) {
    return size === "poster" ? placeholderPoster : placeholderBackdrop;
  }

  // Generate the final URL based on the path
  let finalUrl: string | null = null;

  // Check if the path is already a full URL
  if (path.startsWith('http')) {
    finalUrl = path;

    // If it's a Rapid API URL, we can use it directly
    if (path.includes('cdn.movieofthenight.com')) {
      try {
        // For Rapid API, we have different sizes available
        // Example: https://cdn.movieofthenight.com/show/82/poster/vertical/en/480.jpg
        if (size === "poster") {
          // If it already contains the size we want, use it
          if (path.includes('/480.jpg')) {
            finalUrl = path;
          } else {
            // Otherwise, try to replace the size
            finalUrl = path.replace(/\/\d+\.jpg/, '/480.jpg');
          }
        } else {
          // For backdrops, use horizontal images
          // Try to extract the base path and use the horizontal version
          const basePath = path.match(/(.+)\/poster\/vertical\/(.+)/);
          if (basePath && basePath.length > 2) {
            const queryString = basePath[2].includes('?')
              ? basePath[2].substring(basePath[2].indexOf('?'))
              : '';
            finalUrl = `${basePath[1]}/backdrop/horizontal/1080.jpg${queryString}`;
          } else {
            // If we can't extract the base path, use the original
            finalUrl = path;
          }
        }
      } catch (error) {
        console.error("Error processing Rapid API image URL:", error);
        finalUrl = size === "poster" ? placeholderPoster : placeholderBackdrop;
      }
    } else {
      // For other URLs, use as is
      finalUrl = path;
    }
  }
  // If path starts with a slash, assume it's a TMDB path
  else if (path.startsWith('/')) {
    try {
      // TMDB image base URL
      const baseUrl = "https://image.tmdb.org/t/p/";

      // Image sizes
      const posterSizes = {
        small: "w185",
        medium: "w342",
        large: "w500",
        original: "original",
      };

      const backdropSizes = {
        small: "w300",
        medium: "w780",
        large: "w1280",
        original: "original",
      };

      // Default size
      const defaultSize = size === "poster" ? posterSizes.medium : backdropSizes.medium;

      finalUrl = `${baseUrl}${defaultSize}${path}`;
    } catch (error) {
      console.error("Error processing TMDB image URL:", error);
      finalUrl = size === "poster" ? placeholderPoster : placeholderBackdrop;
    }
  }
  // If we get here, the path is neither a full URL nor a TMDB path
  else {
    finalUrl = size === "poster" ? placeholderPoster : placeholderBackdrop;
  }

  // Check if this URL has failed before
  if (typeof window !== 'undefined' && finalUrl.startsWith('http')) {
    try {
      if (hasImageFailed(finalUrl)) {
        console.log(`Using placeholder for previously failed image: ${finalUrl}`);
        return size === "poster" ? placeholderPoster : placeholderBackdrop;
      }
    } catch (error) {
      console.error("Error checking image cache:", error);
    }
  }

  // Make sure we never return an empty string
  if (!finalUrl || finalUrl === "") {
    return size === "poster" ? placeholderPoster : placeholderBackdrop;
  }

  return finalUrl;
}

// Format runtime from minutes to hours and minutes
export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return "Unknown";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

// Format date to readable format
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Truncate text with ellipsis
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + "...";
}

// Generate a random number between min and max (inclusive)
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a random item from an array
export function getRandomItem<T>(array: T[]): T {
  return array[getRandomNumber(0, array.length - 1)];
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}