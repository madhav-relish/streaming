"use server";

import { env } from "@/env";
import * as streamingAvailability from "streaming-availability";
import { streamingServices } from "./streaming-services";

// Initialize the Streaming Availability API client
const client = new streamingAvailability.Client(
  new streamingAvailability.Configuration({
    apiKey: env.STREAMING_API_KEY,
  })
);

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
