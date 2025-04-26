"use client";

// Cache to remember failed image URLs using localStorage for persistence
const CACHE_KEY = 'failed_image_urls';
let failedImageCache: Set<string> | null = null;

// Initialize the cache from localStorage
function initializeCache(): Set<string> {
  if (failedImageCache) return failedImageCache;

  if (typeof window !== 'undefined') {
    try {
      const cachedUrls = localStorage.getItem(CACHE_KEY);
      failedImageCache = new Set(cachedUrls ? JSON.parse(cachedUrls) : []);
    } catch (error) {
      console.error('Error loading image cache from localStorage:', error);
      failedImageCache = new Set();
    }
  } else {
    failedImageCache = new Set();
  }

  return failedImageCache;
}

// Save the cache to localStorage
function saveCache(): void {
  if (typeof window !== 'undefined' && failedImageCache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify([...failedImageCache]));
    } catch (error) {
      console.error('Error saving image cache to localStorage:', error);
    }
  }
}

export function markImageAsFailed(url: string): void {
  const cache = initializeCache();
  cache.add(url);
  saveCache();
}

export function hasImageFailed(url: string): boolean {
  const cache = initializeCache();
  return cache.has(url);
}
