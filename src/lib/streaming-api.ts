import { env } from "@/env";
import * as streamingAvailability from "streaming-availability";

// Initialize the Streaming Availability API client
const client = new streamingAvailability.Client(
  new streamingAvailability.Configuration({
    apiKey: env.STREAMING_API_KEY,
  })
);

export type StreamingService = {
  name: string;
  logo: string;
  url: string;
};

// Default placeholder for streaming service logos
const placeholderLogo = "/images/streaming/placeholder.svg";

export const streamingServices: Record<string, StreamingService> = {
  // Global streaming services
  netflix: {
    name: "Netflix",
    logo: placeholderLogo,
    url: "https://www.netflix.com/",
  },
  prime: {
    name: "Amazon Prime",
    logo: placeholderLogo,
    url: "https://www.primevideo.com/",
  },
  disney: {
    name: "Disney+ Hotstar",
    logo: placeholderLogo,
    url: "https://www.hotstar.com/",
  },
  apple: {
    name: "Apple TV+",
    logo: placeholderLogo,
    url: "https://tv.apple.com/",
  },

  // Indian streaming services
  hotstar: {
    name: "Hotstar",
    logo: placeholderLogo,
    url: "https://www.hotstar.com/",
  },
  sonyliv: {
    name: "SonyLIV",
    logo: placeholderLogo,
    url: "https://www.sonyliv.com/",
  },
  zee5: {
    name: "ZEE5",
    logo: placeholderLogo,
    url: "https://www.zee5.com/",
  },
  jiocinema: {
    name: "JioCinema",
    logo: placeholderLogo,
    url: "https://www.jiocinema.com/",
  },
  mxplayer: {
    name: "MX Player",
    logo: placeholderLogo,
    url: "https://www.mxplayer.in/",
  },
  voot: {
    name: "Voot",
    logo: placeholderLogo,
    url: "https://www.voot.com/",
  },
  altbalaji: {
    name: "ALTBalaji",
    logo: placeholderLogo,
    url: "https://www.altbalaji.com/",
  },

  // Other international services available in India
  mubi: {
    name: "MUBI",
    logo: placeholderLogo,
    url: "https://mubi.com/",
  },

  // US services (kept for compatibility)
  hbo: {
    name: "HBO Max",
    logo: placeholderLogo,
    url: "https://www.hbomax.com/",
  },
  hulu: {
    name: "Hulu",
    logo: placeholderLogo,
    url: "https://www.hulu.com/",
  },
  paramount: {
    name: "Paramount+",
    logo: placeholderLogo,
    url: "https://www.paramountplus.com/",
  },
  peacock: {
    name: "Peacock",
    logo: placeholderLogo,
    url: "https://www.peacocktv.com/",
  },
};

// Function to search for movies and TV shows
export async function searchContent(
  query: string,
  country = "us",
  services?: string[],
  type?: "movie" | "series",
  page = 1,
) {
  try {
    const response = await client.searchApi.search({
      country,
      services: services?.join(","),
      type,
      keyword: query,
      output_language: "en",
      order_by: "popularity",
      desc: true,
      page: page.toString(),
    });
    return response;
  } catch (error) {
    console.error("Error searching content:", error);
    throw error;
  }
}

// Function to get movie details
export async function getMovieDetails(id: string, country = "us") {
  try {
    const response = await client.showsApi.getShow({
      id,
      country,
      output_language: "en",
    });
    return response;
  } catch (error) {
    console.error("Error getting movie details:", error);
    throw error;
  }
}

// Function to get popular movies
export async function getPopularMovies(
  country = "us",
  services?: string[],
  page = 1,
) {
  try {
    const response = await client.searchApi.search({
      country,
      services: services?.join(","),
      type: "movie",
      output_language: "en",
      order_by: "popularity",
      desc: true,
      page: page.toString(),
    });
    return response;
  } catch (error) {
    console.error("Error getting popular movies:", error);
    throw error;
  }
}

// Function to get popular TV shows
export async function getPopularTvShows(
  country = "us",
  services?: string[],
  page = 1,
) {
  try {
    const response = await client.searchApi.search({
      country,
      services: services?.join(","),
      type: "series",
      output_language: "en",
      order_by: "popularity",
      desc: true,
      page: page.toString(),
    });
    return response;
  } catch (error) {
    console.error("Error getting popular TV shows:", error);
    throw error;
  }
}

// Function to get content by genre
export async function getContentByGenre(
  genreId: number,
  country = "us",
  type?: "movie" | "series",
  services?: string[],
  page = 1,
) {
  try {
    const response = await client.searchApi.search({
      country,
      services: services?.join(","),
      type,
      genre: genreId.toString(),
      output_language: "en",
      order_by: "popularity",
      desc: true,
      page: page.toString(),
    });
    return response;
  } catch (error) {
    console.error("Error getting content by genre:", error);
    throw error;
  }
}

export default client;
