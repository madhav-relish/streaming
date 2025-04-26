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

export const streamingServices: Record<string, StreamingService> = {
  // Global streaming services
  netflix: {
    name: "Netflix",
    logo: "/images/streaming/netflix.png",
    url: "https://www.netflix.com/",
  },
  prime: {
    name: "Amazon Prime",
    logo: "/images/streaming/prime.png",
    url: "https://www.primevideo.com/",
  },
  disney: {
    name: "Disney+ Hotstar",
    logo: "/images/streaming/disney.png",
    url: "https://www.hotstar.com/",
  },
  apple: {
    name: "Apple TV+",
    logo: "/images/streaming/apple.png",
    url: "https://tv.apple.com/",
  },

  // Indian streaming services
  hotstar: {
    name: "Hotstar",
    logo: "/images/streaming/hotstar.png",
    url: "https://www.hotstar.com/",
  },
  sonyliv: {
    name: "SonyLIV",
    logo: "/images/streaming/sonyliv.png",
    url: "https://www.sonyliv.com/",
  },
  zee5: {
    name: "ZEE5",
    logo: "/images/streaming/zee5.png",
    url: "https://www.zee5.com/",
  },
  jiocinema: {
    name: "JioCinema",
    logo: "/images/streaming/jiocinema.png",
    url: "https://www.jiocinema.com/",
  },
  mxplayer: {
    name: "MX Player",
    logo: "/images/streaming/mxplayer.png",
    url: "https://www.mxplayer.in/",
  },
  voot: {
    name: "Voot",
    logo: "/images/streaming/voot.png",
    url: "https://www.voot.com/",
  },
  altbalaji: {
    name: "ALTBalaji",
    logo: "/images/streaming/altbalaji.png",
    url: "https://www.altbalaji.com/",
  },

  // Other international services available in India
  mubi: {
    name: "MUBI",
    logo: "/images/streaming/mubi.png",
    url: "https://mubi.com/",
  },

  // US services (kept for compatibility)
  hbo: {
    name: "HBO Max",
    logo: "/images/streaming/hbo.png",
    url: "https://www.hbomax.com/",
  },
  hulu: {
    name: "Hulu",
    logo: "/images/streaming/hulu.png",
    url: "https://www.hulu.com/",
  },
  paramount: {
    name: "Paramount+",
    logo: "/images/streaming/paramount.png",
    url: "https://www.paramountplus.com/",
  },
  peacock: {
    name: "Peacock",
    logo: "/images/streaming/peacock.png",
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
