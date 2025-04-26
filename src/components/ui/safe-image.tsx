"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

// Global cache of failed image URLs
const failedImageCache = new Set<string>();

// Initialize from localStorage if available
if (typeof window !== "undefined") {
  try {
    const cachedUrls = localStorage.getItem("failed_image_urls");
    if (cachedUrls) {
      const urls = JSON.parse(cachedUrls);
      urls.forEach((url: string) => failedImageCache.add(url));
    }
  } catch (error) {
    console.error("Error loading image cache:", error);
  }
}

// Save to localStorage
const saveFailedImageCache = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "failed_image_urls",
        JSON.stringify(Array.from(failedImageCache))
      );
    } catch (error) {
      console.error("Error saving image cache:", error);
    }
  }
};

export interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate a fallback image URL based on the alt text
  const getDefaultFallback = () => {
    const size = props.fill
      ? "1280x720"
      : `${props.width || 300}x${props.height || 450}`;
    return `https://placehold.co/${size}.png?text=${encodeURIComponent(
      alt.substring(0, 20)
    )}`;
  };

  useEffect(() => {
    // Handle empty, null, or undefined src
    if (!src || src === "") {
      setImgSrc(fallbackSrc || getDefaultFallback());
      setIsLoading(false);
      return;
    }

    // Check if this image URL has failed before
    if (failedImageCache.has(src)) {
      console.log(`Using fallback for previously failed image: ${src}`);
      setImgSrc(fallbackSrc || getDefaultFallback());
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Valid src, use it
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src, alt, fallbackSrc]);

  const handleError = () => {
    console.error(`Image failed to load: ${imgSrc}`);

    // Add to failed image cache
    if (src) {
      failedImageCache.add(src);
      saveFailedImageCache();
    }

    setImgSrc(fallbackSrc || getDefaultFallback());
    setHasError(true);
    setIsLoading(false);
  };

  // Don't render anything if we don't have a valid src
  if (imgSrc === null) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted">
        <span className="text-xs text-muted-foreground">{alt}</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="flex items-center justify-center w-full h-full bg-muted animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}

      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        className={`${props.className || ""} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      />
    </>
  );
}
