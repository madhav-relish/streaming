import { PrismaClient } from "@prisma/client";
import * as streamingAvailability from "streaming-availability";
import { env } from "@/env";
import type { Movie } from "../../types/movie";

const prisma = new PrismaClient();

// Initialize the Streaming Availability API client
const client = new streamingAvailability.Client(
  new streamingAvailability.Configuration({
    apiKey: env.STREAMING_API_KEY,
  })
);

/**
 * Custom error class for streaming service errors
 */
export class StreamingServiceError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: Error) {
    super(message);
    this.name = "StreamingServiceError";
  }
}

/**
 * Service to handle streaming content data, with database caching
 */
export class StreamingService {
  /**
   * Get the total count of movies in the database
   */
  async getMovieCount(country = "in") {
    try {
      const count = await prisma.movie.count({
        where: {
          streamingOptions: {
            some: {
              region: country,
            },
          },
        },
      });

      // If we have a reasonable number of movies in the database, return that count
      if (count > 0) {
        return count;
      }

      // Otherwise, return a default count that will allow for multiple pages
      return 200; // This will give about 7 pages with 30 items per page
    } catch (error) {
      console.error("Error getting movie count:", error);
      return 200; // Default fallback
    }
  }

  /**
   * Get the total count of TV shows in the database
   */
  async getTvShowCount(country = "in") {
    try {
      const count = await prisma.tvShow.count({
        where: {
          streamingOptions: {
            some: {
              region: country,
            },
          },
        },
      });

      // If we have a reasonable number of TV shows in the database, return that count
      if (count > 0) {
        return count;
      }

      // Otherwise, return a default count that will allow for multiple pages
      return 200; // This will give about 7 pages with 30 items per page
    } catch (error) {
      console.error("Error getting TV show count:", error);
      return 200; // Default fallback
    }
  }

  /**
   * Fetch all available movies from the API and store them in the database
   * This is a long-running operation that should be called from an admin endpoint
   */
  async fetchAllMoviesFromAPI(
    country = "in",
    maxPages = 10,
    progressCallback?: (progress: {
      processedItems: number;
      totalItems: number;
      currentPage: number;
    }) => void,
    services: string[] = []
  ) {
    console.log(`Starting to fetch all movies from API for country: ${country}`);
    if (services.length > 0) {
      console.log(`Filtering for services: ${services.join(', ')}`);
    } else {
      console.log(`Fetching for all services`);
    }

    const limit = 100; // Maximum allowed by the API
    let totalFetched = 0;
    let allMovies: any[] = [];
    let estimatedTotal = maxPages * limit; // Initial estimate
    let currentPage = 1;

    try {
      // Use auto-pagination to fetch movies
      console.log(`Using auto-pagination to fetch up to ${maxPages} pages of movies`);

      // Create the auto-pagination iterator
      const moviesIterator = client.showsApi.searchShowsByFiltersWithAutoPagination({
        country: country,
        showType: "movie",
        orderBy: "popularity_1year",
        limit: limit,
      } as any, maxPages);

      // Initialize a batch of movies to process
      let movieBatch: any[] = [];
      let batchCount = 0;
      const batchSize = 20; // Process in smaller batches to show progress

      // Update initial progress
      if (progressCallback) {
        progressCallback({
          processedItems: totalFetched,
          totalItems: estimatedTotal,
          currentPage: currentPage
        });
      }

      // Iterate through all movies from auto-pagination
      for await (const movie of moviesIterator) {
        // Add movie to the current batch
        movieBatch.push(movie);

        // When batch is full or on the last item, process it
        if (movieBatch.length >= batchSize) {
          batchCount++;
          console.log(`Processing movie batch ${batchCount} with ${movieBatch.length} movies`);

          // Filter movies by service if services are specified
          let filteredMovies = movieBatch;
          if (services.length > 0) {
            filteredMovies = movieBatch.filter((movie: any) => {
              // Check if the movie is available on any of the specified services
              if (!movie.streamingOptions || !movie.streamingOptions[country]) {
                return false;
              }

              return movie.streamingOptions[country].some((option: any) => {
                const serviceId = option.service?.id;

                // Special handling for Indian services
                if (country === "in" && serviceId === "disney" && services.includes("hotstar")) {
                  return true;
                }

                return services.includes(serviceId);
              });
            });

            console.log(`Filtered batch to ${filteredMovies.length} movies available on specified services`);
          }

          // Save filtered movies to database
          const savedMovies = await Promise.all(
            filteredMovies.map((movie: any) => this.saveMovieToDatabase(movie, country).catch(error => {
              console.error(`Error saving movie ${movie.imdbId}:`, error);
              return null;
            }))
          );

          // Filter out null values (failed saves)
          const validSavedMovies = savedMovies.filter(movie => movie !== null);
          allMovies = [...allMovies, ...validSavedMovies];

          // Update counts
          totalFetched += filteredMovies.length;
          currentPage = Math.ceil(totalFetched / limit) + 1;

          // Update progress
          if (progressCallback) {
            progressCallback({
              processedItems: totalFetched,
              totalItems: estimatedTotal,
              currentPage: currentPage
            });
          }

          // Clear the batch
          movieBatch = [];

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Process any remaining movies in the last batch
      if (movieBatch.length > 0) {
        console.log(`Processing final movie batch with ${movieBatch.length} movies`);

        // Filter movies by service if services are specified
        let filteredMovies = movieBatch;
        if (services.length > 0) {
          filteredMovies = movieBatch.filter((movie: any) => {
            // Check if the movie is available on any of the specified services
            if (!movie.streamingOptions || !movie.streamingOptions[country]) {
              return false;
            }

            return movie.streamingOptions[country].some((option: any) => {
              const serviceId = option.service?.id;

              // Special handling for Indian services
              if (country === "in" && serviceId === "disney" && services.includes("hotstar")) {
                return true;
              }

              return services.includes(serviceId);
            });
          });

          console.log(`Filtered final batch to ${filteredMovies.length} movies available on specified services`);
        }

        // Save filtered movies to database
        const savedMovies = await Promise.all(
          filteredMovies.map((movie: any) => this.saveMovieToDatabase(movie, country).catch(error => {
            console.error(`Error saving movie ${movie.imdbId}:`, error);
            return null;
          }))
        );

        // Filter out null values (failed saves)
        const validSavedMovies = savedMovies.filter(movie => movie !== null);
        allMovies = [...allMovies, ...validSavedMovies];

        // Update counts
        totalFetched += filteredMovies.length;
      }

      // Update estimated total based on what we've found
      estimatedTotal = totalFetched;

      // Final progress update
      if (progressCallback) {
        progressCallback({
          processedItems: totalFetched,
          totalItems: estimatedTotal,
          currentPage: maxPages
        });
      }

      console.log(`Completed fetching all movies. Total fetched: ${totalFetched}, Successfully saved: ${allMovies.length}`);
      return allMovies;
    } catch (error) {
      console.error("Error in fetchAllMoviesFromAPI:", error);
      throw error;
    }
  }

  /**
   * Fetch all available TV shows from the API and store them in the database
   * This is a long-running operation that should be called from an admin endpoint
   */
  async fetchAllTvShowsFromAPI(
    country = "in",
    maxPages = 10,
    progressCallback?: (progress: {
      processedItems: number;
      totalItems: number;
      currentPage: number;
    }) => void,
    services: string[] = []
  ) {
    console.log(`Starting to fetch all TV shows from API for country: ${country}`);
    if (services.length > 0) {
      console.log(`Filtering for services: ${services.join(', ')}`);
    } else {
      console.log(`Fetching for all services`);
    }

    const limit = 100; // Maximum allowed by the API
    let totalFetched = 0;
    let allTvShows: any[] = [];
    let estimatedTotal = maxPages * limit; // Initial estimate
    let currentPage = 1;

    try {
      // Use auto-pagination to fetch TV shows
      console.log(`Using auto-pagination to fetch up to ${maxPages} pages of TV shows`);

      // Create the auto-pagination iterator
      const tvShowsIterator = client.showsApi.searchShowsByFiltersWithAutoPagination({
        country: country,
        showType: "series",
        orderBy: "popularity_1year",
        limit: limit,
      } as any, maxPages);

      // Initialize a batch of TV shows to process
      let tvShowBatch: any[] = [];
      let batchCount = 0;
      const batchSize = 20; // Process in smaller batches to show progress

      // Update initial progress
      if (progressCallback) {
        progressCallback({
          processedItems: totalFetched,
          totalItems: estimatedTotal,
          currentPage: currentPage
        });
      }

      // Iterate through all TV shows from auto-pagination
      for await (const tvShow of tvShowsIterator) {
        // Add TV show to the current batch
        tvShowBatch.push(tvShow);

        // When batch is full or on the last item, process it
        if (tvShowBatch.length >= batchSize) {
          batchCount++;
          console.log(`Processing TV show batch ${batchCount} with ${tvShowBatch.length} shows`);

          // Filter TV shows by service if services are specified
          let filteredTvShows = tvShowBatch;
          if (services.length > 0) {
            filteredTvShows = tvShowBatch.filter((tvShow: any) => {
              // Check if the TV show is available on any of the specified services
              if (!tvShow.streamingOptions || !tvShow.streamingOptions[country]) {
                return false;
              }

              return tvShow.streamingOptions[country].some((option: any) => {
                const serviceId = option.service?.id;

                // Special handling for Indian services
                if (country === "in" && serviceId === "disney" && services.includes("hotstar")) {
                  return true;
                }

                return services.includes(serviceId);
              });
            });

            console.log(`Filtered batch to ${filteredTvShows.length} TV shows available on specified services`);
          }

          // Save filtered TV shows to database
          const savedTvShows = await Promise.all(
            filteredTvShows.map((tvShow: any) => this.saveTvShowToDatabase(tvShow, country).catch(error => {
              console.error(`Error saving TV show ${tvShow.imdbId}:`, error);
              return null;
            }))
          );

          // Filter out null values (failed saves)
          const validSavedTvShows = savedTvShows.filter(tvShow => tvShow !== null);
          allTvShows = [...allTvShows, ...validSavedTvShows];

          // Update counts
          totalFetched += filteredTvShows.length;
          currentPage = Math.ceil(totalFetched / limit) + 1;

          // Update progress
          if (progressCallback) {
            progressCallback({
              processedItems: totalFetched,
              totalItems: estimatedTotal,
              currentPage: currentPage
            });
          }

          // Clear the batch
          tvShowBatch = [];

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Process any remaining TV shows in the last batch
      if (tvShowBatch.length > 0) {
        console.log(`Processing final TV show batch with ${tvShowBatch.length} shows`);

        // Filter TV shows by service if services are specified
        let filteredTvShows = tvShowBatch;
        if (services.length > 0) {
          filteredTvShows = tvShowBatch.filter((tvShow: any) => {
            // Check if the TV show is available on any of the specified services
            if (!tvShow.streamingOptions || !tvShow.streamingOptions[country]) {
              return false;
            }

            return tvShow.streamingOptions[country].some((option: any) => {
              const serviceId = option.service?.id;

              // Special handling for Indian services
              if (country === "in" && serviceId === "disney" && services.includes("hotstar")) {
                return true;
              }

              return services.includes(serviceId);
            });
          });

          console.log(`Filtered final batch to ${filteredTvShows.length} TV shows available on specified services`);
        }

        // Save filtered TV shows to database
        const savedTvShows = await Promise.all(
          filteredTvShows.map((tvShow: any) => this.saveTvShowToDatabase(tvShow, country).catch(error => {
            console.error(`Error saving TV show ${tvShow.imdbId}:`, error);
            return null;
          }))
        );

        // Filter out null values (failed saves)
        const validSavedTvShows = savedTvShows.filter(tvShow => tvShow !== null);
        allTvShows = [...allTvShows, ...validSavedTvShows];

        // Update counts
        totalFetched += filteredTvShows.length;
      }

      // Update estimated total based on what we've found
      estimatedTotal = totalFetched;

      // Final progress update
      if (progressCallback) {
        progressCallback({
          processedItems: totalFetched,
          totalItems: estimatedTotal,
          currentPage: maxPages
        });
      }

      console.log(`Completed fetching all TV shows. Total fetched: ${totalFetched}, Successfully saved: ${allTvShows.length}`);
      return allTvShows;
    } catch (error) {
      console.error("Error in fetchAllTvShowsFromAPI:", error);
      throw error;
    }
  }

  /**
   * Get a movie by its ID, first checking the database, then falling back to the API
   */
  async getMovie(id: string, country = "in") {
    // First, try to get the movie from the database
    const cachedMovie = await prisma.movie.findUnique({
      where: { id },
      include: {
        genres: true,
        streamingOptions: {
          where: { region: country },
        },
      },
    });

    // If the movie exists in the database, return it
    if (cachedMovie) {
      console.log("Returning cached movie data for", id);
      return cachedMovie;
    }

    // Otherwise, fetch from the API
    try {
      console.log("Fetching movie data from API for", id);

      // Use the Rapid API client to fetch real data
      let movieData;

      try {
        // Make the API call to get the movie data
        // Ensure the ID is in the correct format (remove 'tt' prefix if present)
        const formattedId = id.startsWith('tt') ? id : `tt${id}`;

        const response = await client.showsApi.getShow({
          id: formattedId,
          country: country
        });

        // Use the response data
        movieData = response;
        console.log(`Successfully fetched data for ${id} from Rapid API`);
      } catch (apiError) {
        console.error("Error fetching from Rapid API:", apiError);

        // Fallback to default data if API call fails
        movieData = {
          itemType: "show",
          showType: "movie",
          id: id,
          imdbId: id,
          title: "Unknown Movie",
          overview: "No information available for this movie.",
          releaseYear: null,
          genres: [],
          rating: null,
          runtime: null,
          imageSet: {
            verticalPoster: {},
            horizontalBackdrop: {}
          },
          streamingOptions: {}
        };
      }

      // If the movie already exists in the database, update it
      if (cachedMovie) {
        return this.updateMovieInDatabase(movieData, country);
      }

      // Otherwise, create a new movie record
      return this.saveMovieToDatabase(movieData as any, country);
    } catch (error: any) {
      console.error("Error fetching movie data:", error);
      // If API call fails but we have cached data, return that
      if (cachedMovie) return cachedMovie;
      throw error;
    }
  }

  /**
   * Get popular movies from the database with pagination
   */
  async getPopularMovies(country = "in", page = 1, limit = 20) {
    try {
      // Get movies from the database with pagination
      const movies = await prisma.movie.findMany({
        where: {
          streamingOptions: {
            some: {
              region: country,
            },
          },
        },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
        orderBy: [
          { voteAverage: "desc" },
          { title: "asc" },
        ],
        take: limit,
        skip: (page - 1) * limit,
      });

      // If we have movies in the database, return them
      if (movies.length > 0) {
        console.log(`Returning ${movies.length} movies from database for page ${page}`);
        return movies;
      }

      // If we don't have any movies in the database, fetch from the API
      console.log("No movies found in database, fetching from API");

      // Use the Rapid API client to fetch real data
      let movieResults: any[] = [];

      try {
        // Make the API call to get popular movies
        const response = await client.showsApi.searchShowsByFilters({
          country: country,
          showType: "movie",
          orderBy: "popularity_1year",
          limit: limit,
          offset: (page - 1) * limit
        } as any); // Type assertion to bypass TypeScript error

        // Use the response data
        movieResults = response.shows || [];
        console.log(`Successfully fetched ${movieResults.length} popular movies from Rapid API`);
      } catch (apiError) {
        console.error("Error fetching popular movies from Rapid API:", apiError);

        // Fallback to a list of popular movie IDs if API call fails
        console.log("Falling back to predefined popular movies");

        // Use our predefined list of popular movies
        const popularMovieIds = [
          "tt0111161", // The Shawshank Redemption
          "tt0068646", // The Godfather
          "tt0468569", // The Dark Knight
          "tt0071562", // The Godfather: Part II
          "tt0050083", // 12 Angry Men
        ];

        // Fetch each movie individually
        for (const movieId of popularMovieIds) {
          try {
            const movieData = await client.showsApi.getShow({
              id: movieId,
              country: country
            });
            movieResults.push(movieData);
          } catch (error) {
            console.error(`Error fetching movie ${movieId}:`, error);
          }
        }
      }

      // Save all movies to the database
      const savedMovies = await Promise.all(
        movieResults.map((movie: any) =>
          this.saveMovieToDatabase(movie, country).catch(error => {
            console.error(`Error saving movie ${movie.imdbId}:`, error);
            return null;
          })
        )
      );

      // Filter out null values (failed saves)
      const validSavedMovies = savedMovies.filter(movie => movie !== null);

      if (validSavedMovies.length > 0) {
        return validSavedMovies;
      }

      // If we couldn't fetch or save any movies, return an empty array
      return [];
    } catch (error) {
      console.error("Error in getPopularMovies:", error);
      // Return an empty array instead of throwing an error
      return [];
    }
  }

  /**
   * Get popular TV shows from the database with pagination
   */
  async getPopularTvShows(country = "in", page = 1, limit = 20) {
    try {
      // Get TV shows from the database with pagination
      const tvShows = await prisma.tvShow.findMany({
        where: {
          streamingOptions: {
            some: {
              region: country,
            },
          },
        },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
        orderBy: [
          { voteAverage: "desc" },
          { title: "asc" },
        ],
        take: limit,
        skip: (page - 1) * limit,
      });

      // If we have TV shows in the database, return them
      if (tvShows.length > 0) {
        console.log(`Returning ${tvShows.length} TV shows from database for page ${page}`);
        return tvShows;
      }

      // If we don't have any TV shows in the database, fetch from the API
      console.log("No TV shows found in database, fetching from API");

      // Use the Rapid API client to fetch real data
      let tvShowResults: any[] = [];

      try {
        // Make the API call to get popular TV shows
        const response = await client.showsApi.searchShowsByFilters({
          country: country,
          showType: "series",
          orderBy: "popularity_1year",
          limit: limit,
          offset: (page - 1) * limit
        } as any); // Type assertion to bypass TypeScript error

        // Use the response data
        tvShowResults = response.shows || [];
        console.log(`Successfully fetched ${tvShowResults.length} popular TV shows from Rapid API`);
      } catch (apiError) {
        console.error("Error fetching popular TV shows from Rapid API:", apiError);

        // Fallback to a list of popular TV show IDs if API call fails
        console.log("Falling back to predefined popular TV shows");

        // Use our predefined list of popular TV shows
        const popularTvShowIds = [
          "tt0944947", // Game of Thrones
          "tt0903747", // Breaking Bad
          "tt0108778", // Friends
          "tt0475784", // Westworld
          "tt1520211", // The Walking Dead
        ];

        // Fetch each TV show individually
        for (const tvShowId of popularTvShowIds) {
          try {
            const tvShowData = await client.showsApi.getShow({
              id: tvShowId,
              country: country
            });
            tvShowResults.push(tvShowData);
          } catch (error) {
            console.error(`Error fetching TV show ${tvShowId}:`, error);
          }
        }
      }

      // Save all TV shows to the database
      const savedTvShows = await Promise.all(
        tvShowResults.map((tvShow: any) =>
          this.saveTvShowToDatabase(tvShow, country).catch(error => {
            console.error(`Error saving TV show ${tvShow.imdbId}:`, error);
            return null;
          })
        )
      );

      // Filter out null values (failed saves)
      const validSavedTvShows = savedTvShows.filter(tvShow => tvShow !== null);

      if (validSavedTvShows.length > 0) {
        return validSavedTvShows;
      }

      // If we couldn't fetch or save any TV shows, return an empty array
      return [];
    } catch (error) {
      console.error("Error in getPopularTvShows:", error);
      // Return an empty array instead of throwing an error
      return [];
    }
  }

  /**
   * Get content by streaming service
   */
  async getContentByService(
    service: string,
    country = "in",
    type?: "movie" | "series",
    page = 1,
    limit = 20
  ) {
    try {
      // First check if we have cached content for this service
      if (type === "movie") {
        const cachedMovies = await prisma.movie.findMany({
          where: {
            streamingOptions: {
              some: {
                provider: service,
                region: country,
              },
            },
          },
          include: {
            genres: true,
            streamingOptions: {
              where: {
                provider: service,
                region: country,
              },
            },
          },
          orderBy: [
            { voteAverage: "desc" },
            { title: "asc" },
          ],
          take: limit,
          skip: (page - 1) * limit,
        });

        // If we have enough cached content, return it
        if (cachedMovies.length > 0) {
          console.log(`Returning ${cachedMovies.length} movies for ${service} from database`);
          return cachedMovies;
        }
      } else {
        const cachedTvShows = await prisma.tvShow.findMany({
          where: {
            streamingOptions: {
              some: {
                provider: service,
                region: country,
              },
            },
          },
          include: {
            genres: true,
            streamingOptions: {
              where: {
                provider: service,
                region: country,
              },
            },
          },
          orderBy: [
            { voteAverage: "desc" },
            { title: "asc" },
          ],
          take: limit,
          skip: (page - 1) * limit,
        });

        // If we have enough cached content, return it
        if (cachedTvShows.length > 0) {
          console.log(`Returning ${cachedTvShows.length} TV shows for ${service} from database`);
          return cachedTvShows;
        }
      }

      // Otherwise, fetch from the API
      console.log(`Fetching ${type} content for ${service} from API`);

      try {
        // Make the API call to search for content by service
        // The Rapid API doesn't have a direct filter for services, so we'll fetch popular content
        // and then filter it on our side
        const response = await client.showsApi.searchShowsByFilters({
          country: country,
          showType: type,
          orderBy: "popularity_1year",
          limit: 100 // Get more results to filter
        } as any); // Type assertion to bypass TypeScript error

        // Filter the results to only include content from the specified service
        const filteredResults = (response.shows || []).filter((show: any) => {
          if (!show.streamingOptions || !show.streamingOptions[country]) {
            return false;
          }

          // Check if any of the streaming options match our service
          return show.streamingOptions[country].some((option: any) => {
            // Get the service ID
            const serviceId = option.service?.id;

            // Check if it matches our service (with special handling for Indian services)
            if (country === "in") {
              // Map service IDs to our supported providers
              if (service === "hotstar" && serviceId === "disney") return true;
              if (service === "zee5" && serviceId === "zee5") return true;
              if (service === "sonyliv" && serviceId === "sonyliv") return true;
              if (service === "jiocinema" && serviceId === "jiocinema") return true;
              if (service === "mxplayer" && serviceId === "mxplayer") return true;
              if (service === "voot" && serviceId === "voot") return true;
              if (service === "altbalaji" && serviceId === "altbalaji") return true;

              // Log the service ID for debugging
              console.log(`Checking service ID: ${serviceId} against requested service: ${service}`);
            }

            return serviceId === service;
          });
        });

        // Limit the results
        const paginatedResults = filteredResults.slice((page - 1) * limit, page * limit);

        // Process and save the results
        const results = paginatedResults || [];
        console.log(`Found ${results.length} ${type}s for ${service}`);

        // Save all content to the database
        const savedContent = await Promise.all(
          results.map((item: any) => {
            if (type === "movie") {
              return this.saveMovieToDatabase(item, country).catch(error => {
                console.error(`Error saving movie ${item.imdbId}:`, error);
                return null;
              });
            } else {
              return this.saveTvShowToDatabase(item, country).catch(error => {
                console.error(`Error saving TV show ${item.imdbId}:`, error);
                return null;
              });
            }
          })
        );

        // Filter out null values (failed saves)
        const validSavedContent = savedContent.filter(item => item !== null);

        if (validSavedContent.length > 0) {
          return validSavedContent;
        }

        // If we couldn't fetch or save any content, return an empty array
        return [];
      } catch (apiError) {
        console.error(`Error fetching ${type} content for ${service}:`, apiError);
        // Return empty array
        return [];
      }
    } catch (error) {
      console.error(`Error getting ${type} content for ${service}:`, error);
      return [];
    }
  }

  /**
   * Search for content, using the API directly (no caching for search results)
   */
  async searchContent(query: string, country = "in", type?: "movie" | "series", page = 1, limit = 20) {
    try {
      // Use the Rapid API client to search for content
      let searchResults: any[] = [];

      try {
        // Convert type to showType parameter for the API
        const showType = type === "movie" ? "movie" : type === "series" ? "series" : undefined;

        // Make the API call to search for content
        const response = await client.showsApi.searchShowsByTitle({
          country: country,
          title: query,
          showType: showType,
          limit: limit,
          offset: (page - 1) * limit
        } as any); // Type assertion to bypass TypeScript error

        // Use the response data
        searchResults = response.shows || [];
        console.log(`Successfully searched for "${query}" and found ${searchResults.length} results`);
      } catch (apiError) {
        console.error("Error searching content from Rapid API:", apiError);

        // Fallback to empty results if API call fails
        console.log("Search API call failed, returning empty results");
        searchResults = [];
      }

      // Format the results for the frontend
      const formattedResults = {
        results: searchResults,
        page,
        totalResults: searchResults.length,
        totalPages: Math.ceil(searchResults.length / limit),
      };

      // Save search results to database in the background
      if (searchResults.length > 0) {
        this.cacheSearchResults(searchResults, country).catch(error => {
          console.error("Error caching search results:", error);
        });
      }

      return formattedResults;
    } catch (error) {
      console.error("Error searching content:", error);
      // Return empty results instead of throwing an error
      return {
        results: [],
        page,
        totalResults: 0,
        totalPages: 0,
      };
    }
  }

  /**
   * Cache search results in the database without waiting for completion
   */
  private async cacheSearchResults(results: any[], country: string) {
    try {
      for (const item of results) {
        // Check if it's a movie or TV show based on the showType property
        if (item.showType === "movie") {
          await this.saveMovieToDatabase(item, country).catch(console.error);
        } else if (item.showType === "series") {
          await this.saveTvShowToDatabase(item, country).catch(console.error);
        } else if (item.type === "movie") {
          // For backward compatibility with old format
          await this.saveMovieToDatabase(item, country).catch(console.error);
        } else if (item.type === "series") {
          // For backward compatibility with old format
          await this.saveTvShowToDatabase(item, country).catch(console.error);
        }
      }
    } catch (error) {
      console.error("Error caching search results:", error);
    }
  }

  /**
   * Save a movie to the database
   */
  private async saveMovieToDatabase(movieData: Movie, country: string) {
    try {
      // Extract genre data
      const genreConnections = movieData.genres?.map((genre) => ({
        id: genre.id,
        name: genre.name,
      })) || [];

      // Extract streaming options
      const streamingOptions = this.extractStreamingOptionsFromRapidAPI(movieData, country);

      // Get poster and backdrop paths from the imageSet
      let posterPath = null;
      let backdropPath = null;

      // Check for imageSet in the API response
      if (movieData.imageSet) {
        console.log(`Movie ${movieData.title} has imageSet:`, JSON.stringify(movieData.imageSet, null, 2));

        // Try different image sizes in order of preference for poster
        posterPath =
          movieData.imageSet.verticalPoster?.w780 ||
          movieData.imageSet.verticalPoster?.w500 ||
          movieData.imageSet.verticalPoster?.w342 ||
          movieData.imageSet.verticalPoster?.w154 ||
          movieData.imageSet.verticalPoster?.original ||
          null;

        // Try different image sizes in order of preference for backdrop
        backdropPath =
          movieData.imageSet.horizontalBackdrop?.w1080 ||
          movieData.imageSet.horizontalBackdrop?.w780 ||
          movieData.imageSet.horizontalBackdrop?.w500 ||
          movieData.imageSet.horizontalBackdrop?.original ||
          null;
      }

      // Fallback to other image properties if available
      posterPath = posterPath || (movieData as any).posterURLs?.original || (movieData as any).posterPath || null;
      backdropPath = backdropPath || (movieData as any).backdropURLs?.original || (movieData as any).backdropPath || null;

      // Check if the movie already exists
      const existingMovie = await prisma.movie.findUnique({
        where: { id: movieData.imdbId },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
      });

      // Create or update the movie
      const movie = await prisma.movie.upsert({
        where: { id: movieData.imdbId },
        update: {
          title: movieData.title,
          overview: movieData.overview || null,
          posterPath: posterPath || existingMovie?.posterPath,
          backdropPath: backdropPath || existingMovie?.backdropPath,
          releaseDate: movieData.releaseYear ? new Date(movieData.releaseYear, 0, 1) : existingMovie?.releaseDate,
          voteAverage: movieData.rating || existingMovie?.voteAverage,
          voteCount: existingMovie?.voteCount, // Preserve existing vote count
          runtime: movieData.runtime || existingMovie?.runtime,
          updatedAt: new Date(),
        },
        create: {
          id: movieData.imdbId,
          title: movieData.title,
          overview: movieData.overview || null,
          posterPath: posterPath,
          backdropPath: backdropPath,
          releaseDate: movieData.releaseYear ? new Date(movieData.releaseYear, 0, 1) : null,
          voteAverage: movieData.rating || null,
          voteCount: null, // Not available in the new format
          runtime: movieData.runtime || null,
        },
        include: {
          genres: true,
          streamingOptions: true,
        },
      });

      // Connect genres
      try {
        for (const genre of genreConnections) {
          try {
            // First try to find if the genre already exists by name
            const existingGenreByName = await prisma.genre.findFirst({
              where: { name: genre.name }
            });

            if (existingGenreByName) {
              // Use the existing genre ID
              console.log(`Using existing genre ${existingGenreByName.name} with ID ${existingGenreByName.id} instead of ${genre.id}`);
              genre.id = existingGenreByName.id;
            } else {
              // Try to find by ID
              const existingGenreById = await prisma.genre.findUnique({
                where: { id: genre.id }
              });

              if (existingGenreById) {
                // Update if name has changed
                if (existingGenreById.name !== genre.name) {
                  await prisma.genre.update({
                    where: { id: genre.id },
                    data: { name: genre.name }
                  });
                }
              } else {
                // Create new genre
                try {
                  await prisma.genre.create({
                    data: { id: genre.id, name: genre.name }
                  });
                } catch (createError: any) {
                  // If there's a unique constraint error, try one more time to find by name
                  if (createError.code === 'P2002') {
                    const retryGenre = await prisma.genre.findFirst({
                      where: { name: genre.name }
                    });

                    if (retryGenre) {
                      genre.id = retryGenre.id;
                    } else {
                      // Generate a new ID if we can't create with the provided ID
                      const newId = `genre_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                      await prisma.genre.create({
                        data: { id: newId, name: genre.name }
                      });
                      genre.id = newId;
                    }
                  } else {
                    throw createError;
                  }
                }
              }
            }

            // Connect genre to movie
            await prisma.movie.update({
              where: { id: movie.id },
              data: {
                genres: {
                  connect: { id: genre.id },
                },
              },
            });
          } catch (error: any) {
            console.error(`Error processing genre ${genre.name}:`, error);
            // Continue with the next genre
          }
        }
      } catch (genreError) {
        console.error("Error connecting genres:", genreError);
        // Continue with the process even if genre connection fails
      }

      // Add streaming options
      try {
        // First, delete existing streaming options for this movie and country
        await prisma.streamingOption.deleteMany({
          where: {
            movieId: movie.id,
            region: country,
          },
        });

        // Then add the new streaming options
        for (const option of streamingOptions) {
          // Check if the URL is valid
          if (!option.url || option.url.trim() === "") {
            console.warn(`Skipping invalid streaming URL for ${movie.title} on ${option.provider}`);
            continue;
          }

          await prisma.streamingOption.create({
            data: {
              provider: option.provider,
              region: option.region,
              url: option.url,
              type: option.type,
              movie: {
                connect: { id: movie.id },
              },
            },
          });
        }
      } catch (streamingError) {
        console.error("Error adding streaming options:", streamingError);
        // Continue with the process even if streaming options fail
      }

      // Return the movie with its relationships
      return prisma.movie.findUnique({
        where: { id: movie.id },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
      });
    } catch (error: any) {
      console.error("Error saving movie to database:", error);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        throw new StreamingServiceError(
          `Unique constraint failed when saving movie: ${error.meta?.target}`,
          'DATABASE_CONSTRAINT_ERROR',
          error
        );
      } else if (error.code === 'P2025') {
        throw new StreamingServiceError(
          'Record not found when trying to update movie',
          'DATABASE_RECORD_NOT_FOUND',
          error
        );
      } else {
        throw new StreamingServiceError(
          `Failed to save movie to database: ${error.message || 'Unknown error'}`,
          'DATABASE_ERROR',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Update a movie in the database
   */
  private async updateMovieInDatabase(movieData: any, country: string) {
    try {
      // First, delete existing streaming options for this movie and country
      await prisma.streamingOption.deleteMany({
        where: {
          movieId: movieData.imdbId,
          region: country,
        },
      });

      // Then save the movie as if it were new
      return this.saveMovieToDatabase(movieData, country);
    } catch (error: any) {
      console.error("Error updating movie in database:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Save a TV show to the database
   */
  private async saveTvShowToDatabase(tvShowData: any, country: string) {
    try {
      // Extract genre data
      const genreConnections = tvShowData.genres?.map((genre: any) => ({
        id: genre.id,
        name: genre.name,
      })) || [];

      // Extract streaming options
      let streamingOptions;

      // Check if this is from the Rapid API format
      if (tvShowData.streamingOptions) {
        streamingOptions = this.extractStreamingOptionsFromRapidAPI(tvShowData, country);
      } else {
        streamingOptions = this.extractStreamingOptions(tvShowData, country);
      }

      // Check if the TV show already exists
      const existingTvShow = await prisma.tvShow.findUnique({
        where: { id: tvShowData.imdbId },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
      });

      // Get poster and backdrop paths
      let posterPath = null;
      let backdropPath = null;

      // Check for imageSet in the API response
      if (tvShowData.imageSet) {
        console.log(`TV Show ${tvShowData.title} has imageSet:`, JSON.stringify(tvShowData.imageSet, null, 2));

        // Try different image sizes in order of preference for poster
        posterPath =
          tvShowData.imageSet.verticalPoster?.w780 ||
          tvShowData.imageSet.verticalPoster?.w500 ||
          tvShowData.imageSet.verticalPoster?.w342 ||
          tvShowData.imageSet.verticalPoster?.w154 ||
          tvShowData.imageSet.verticalPoster?.original ||
          null;

        // Try different image sizes in order of preference for backdrop
        backdropPath =
          tvShowData.imageSet.horizontalBackdrop?.w1080 ||
          tvShowData.imageSet.horizontalBackdrop?.w780 ||
          tvShowData.imageSet.horizontalBackdrop?.w500 ||
          tvShowData.imageSet.horizontalBackdrop?.original ||
          null;
      }

      // Fallback to other image properties if available
      posterPath = posterPath || (tvShowData as any).posterURLs?.original || (tvShowData as any).posterPath || null;
      backdropPath = backdropPath || (tvShowData as any).backdropURLs?.original || (tvShowData as any).backdropPath || null;

      // Create or update the TV show
      const tvShow = await prisma.tvShow.upsert({
        where: { id: tvShowData.imdbId },
        update: {
          title: tvShowData.title,
          overview: tvShowData.overview || existingTvShow?.overview,
          posterPath: posterPath || existingTvShow?.posterPath,
          backdropPath: backdropPath || existingTvShow?.backdropPath,
          firstAirDate: tvShowData.firstAirYear ? new Date(tvShowData.firstAirYear, 0, 1) : existingTvShow?.firstAirDate,
          lastAirDate: tvShowData.lastAirYear ? new Date(tvShowData.lastAirYear, 0, 1) : existingTvShow?.lastAirDate,
          voteAverage: tvShowData.tmdbRating || tvShowData.rating || existingTvShow?.voteAverage,
          voteCount: tvShowData.tmdbVotes || existingTvShow?.voteCount,
          numberOfSeasons: tvShowData.seasons?.length || existingTvShow?.numberOfSeasons || 0,
          numberOfEpisodes: tvShowData.episodeCount || existingTvShow?.numberOfEpisodes || 0,
          updatedAt: new Date(),
        },
        create: {
          id: tvShowData.imdbId,
          title: tvShowData.title,
          overview: tvShowData.overview || null,
          posterPath: posterPath || null,
          backdropPath: backdropPath || null,
          firstAirDate: tvShowData.firstAirYear ? new Date(tvShowData.firstAirYear, 0, 1) : null,
          lastAirDate: tvShowData.lastAirYear ? new Date(tvShowData.lastAirYear, 0, 1) : null,
          voteAverage: tvShowData.tmdbRating || tvShowData.rating || null,
          voteCount: tvShowData.tmdbVotes || null,
          numberOfSeasons: tvShowData.seasons?.length || 0,
          numberOfEpisodes: tvShowData.episodeCount || 0,
        },
        include: {
          genres: true,
          streamingOptions: true,
        },
      });

      // Connect genres
      try {
        for (const genre of genreConnections) {
          try {
            // First try to find if the genre already exists by name
            const existingGenreByName = await prisma.genre.findFirst({
              where: { name: genre.name }
            });

            if (existingGenreByName) {
              // Use the existing genre ID
              console.log(`Using existing genre ${existingGenreByName.name} with ID ${existingGenreByName.id} instead of ${genre.id}`);
              genre.id = existingGenreByName.id;
            } else {
              // Try to find by ID
              const existingGenreById = await prisma.genre.findUnique({
                where: { id: genre.id }
              });

              if (existingGenreById) {
                // Update if name has changed
                if (existingGenreById.name !== genre.name) {
                  await prisma.genre.update({
                    where: { id: genre.id },
                    data: { name: genre.name }
                  });
                }
              } else {
                // Create new genre
                try {
                  await prisma.genre.create({
                    data: { id: genre.id, name: genre.name }
                  });
                } catch (createError: any) {
                  // If there's a unique constraint error, try one more time to find by name
                  if (createError.code === 'P2002') {
                    const retryGenre = await prisma.genre.findFirst({
                      where: { name: genre.name }
                    });

                    if (retryGenre) {
                      genre.id = retryGenre.id;
                    } else {
                      // Generate a new ID if we can't create with the provided ID
                      const newId = `genre_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                      await prisma.genre.create({
                        data: { id: newId, name: genre.name }
                      });
                      genre.id = newId;
                    }
                  } else {
                    throw createError;
                  }
                }
              }
            }

            // Connect genre to TV show
            await prisma.tvShow.update({
              where: { id: tvShow.id },
              data: {
                genres: {
                  connect: { id: genre.id },
                },
              },
            });
          } catch (error: any) {
            console.error(`Error processing genre ${genre.name} for TV show:`, error);
            // Continue with the next genre
          }
        }
      } catch (genreError) {
        console.error("Error connecting genres for TV show:", genreError);
        // Continue with the process even if genre connection fails
      }

      // Add streaming options
      try {
        // First, delete existing streaming options for this TV show and country
        await prisma.streamingOption.deleteMany({
          where: {
            tvShowId: tvShow.id,
            region: country,
          },
        });

        // Then add the new streaming options
        for (const option of streamingOptions) {
          // Check if the URL is valid
          if (!option.url || option.url.trim() === "") {
            console.warn(`Skipping invalid streaming URL for ${tvShow.title} on ${option.provider}`);
            continue;
          }

          await prisma.streamingOption.create({
            data: {
              provider: option.provider,
              region: option.region,
              url: option.url,
              type: option.type,
              tvShow: {
                connect: { id: tvShow.id },
              },
            },
          });
        }
      } catch (streamingError) {
        console.error("Error adding streaming options:", streamingError);
        // Continue with the process even if streaming options fail
      }

      // Return the TV show with its relationships
      return prisma.tvShow.findUnique({
        where: { id: tvShow.id },
        include: {
          genres: true,
          streamingOptions: {
            where: { region: country },
          },
        },
      });
    } catch (error: any) {
      console.error("Error saving TV show to database:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Extract streaming options from old API response format
   */
  private extractStreamingOptions(contentData: any, country: string) {
    const options: Array<{
      provider: string;
      region: string;
      url: string;
      type: string;
    }> = [];

    // Map to track providers we've already added
    const addedProviders = new Set<string>();

    // Check if streaming info exists for the specified country
    if (contentData.streamingInfo && contentData.streamingInfo[country]) {
      const countryStreamingInfo = contentData.streamingInfo[country];

      // Iterate through each streaming service
      for (const [provider, providerData] of Object.entries(countryStreamingInfo)) {
        // Each provider might have multiple options (subscription, rent, buy)
        for (const option of providerData as any[]) {
          // Map provider names for India
          let mappedProvider = provider;

          // Map streaming services for India
          if (country === "in") {
            // Map common Indian streaming services
            if (provider === "disney") mappedProvider = "hotstar";
            else if (provider === "curiosity") mappedProvider = "curiosity";
            else if (provider === "zee5") mappedProvider = "zee5";
            else if (provider === "sonyliv") mappedProvider = "sonyliv";
            else if (provider === "jiocinema") mappedProvider = "jiocinema";
            else if (provider === "mxplayer") mappedProvider = "mxplayer";
            else if (provider === "voot") mappedProvider = "voot";
            else if (provider === "altbalaji") mappedProvider = "altbalaji";
            else if (provider === "discovery") mappedProvider = "discovery";

            // Log the provider to help with debugging
            console.log(`Found streaming provider: ${mappedProvider} for content in India`);
          }

          // Skip if the URL is invalid
          if (!option.link || option.link.trim() === "") {
            console.warn(`Skipping invalid streaming URL for content on ${mappedProvider}`);
            continue;
          }

          // Skip if we've already added this provider
          if (addedProviders.has(mappedProvider)) {
            console.log(`Skipping duplicate streaming provider: ${mappedProvider}`);
            continue;
          }

          // Add the provider to our tracking set
          addedProviders.add(mappedProvider);

          options.push({
            provider: mappedProvider,
            region: country,
            url: option.link || "",
            type: option.type || "SUBSCRIPTION",
          });
        }
      }
    }

    return options;
  }

  /**
   * Extract streaming options from Rapid API response format
   */
  private extractStreamingOptionsFromRapidAPI(contentData: Movie, country: string) {
    const options: Array<{
      provider: string;
      region: string;
      url: string;
      type: string;
    }> = [];

    // Map to track providers we've already added
    const addedProviders = new Set<string>();

    // Check if streaming options exist for the specified country
    if (contentData.streamingOptions && contentData.streamingOptions[country]) {
      const countryStreamingOptions = contentData.streamingOptions[country];

      // Iterate through each streaming option
      for (const option of countryStreamingOptions) {
        if (!option.service || !option.service.id || !option.link) {
          continue;
        }

        // Map service IDs to our supported providers
        let provider = option.service.id;

        // Map streaming services for India
        if (country === "in") {
          // Map common Indian streaming services
          if (provider === "disney") provider = "hotstar";
          else if (provider === "curiosity") provider = "curiosity";
          else if (provider === "zee5") provider = "zee5";
          else if (provider === "sonyliv") provider = "sonyliv";
          else if (provider === "jiocinema") provider = "jiocinema";
          else if (provider === "mxplayer") provider = "mxplayer";
          else if (provider === "voot") provider = "voot";
          else if (provider === "altbalaji") provider = "altbalaji";
          else if (provider === "discovery") provider = "discovery";

          // Log the provider to help with debugging
          console.log(`Found streaming provider: ${provider} for content in India`);
        }

        // Skip if the URL is invalid
        if (!option.link || option.link.trim() === "") {
          console.warn(`Skipping invalid streaming URL for content on ${provider}`);
          continue;
        }

        // Skip if we've already added this provider
        if (addedProviders.has(provider)) {
          console.log(`Skipping duplicate streaming provider: ${provider}`);
          continue;
        }

        // Add the provider to our tracking set
        addedProviders.add(provider);

        options.push({
          provider: provider,
          region: country,
          url: option.link || "",
          type: option.type?.toUpperCase() || "SUBSCRIPTION",
        });
      }
    }

    return options;
  }

  /**
   * Refresh all content data from the API (to be run as a scheduled job)
   */
  async refreshAllContent(country = "in") {
    try {
      console.log("Starting content refresh job");

      // Refresh popular movies
      const popularMovies = await this.getPopularMovies(country, 1, 100);
      console.log(`Refreshed ${popularMovies.length} popular movies`);

      // Refresh popular TV shows
      const popularTvShows = await this.getPopularTvShows(country, 1, 100);
      console.log(`Refreshed ${popularTvShows.length} popular TV shows`);

      // Refresh trending content (using mock data for now)
      const trendingItems = [
        {
          imdbId: "tt0111161",
          title: "The Shawshank Redemption",
          type: "movie",
          overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
          posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
          backdropPath: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
          year: 1994,
          tmdbRating: 8.7,
          genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
          streamingInfo: { in: { netflix: [{ link: "https://www.netflix.com/title/tt0111161" }] } }
        },
        {
          imdbId: "tt0068646",
          title: "The Godfather",
          type: "movie",
          overview: "The aging patriarch of an organized crime dynasty transfers control to his son.",
          posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
          backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
          year: 1972,
          tmdbRating: 8.7,
          genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
          streamingInfo: { in: { prime: [{ link: "https://www.primevideo.com/detail/The-Godfather/0HBOP3JYN9Y3PBJ8TH1FQVS0XF" }] } }
        },
        {
          imdbId: "tt8108198",
          title: "Drishyam 2",
          type: "movie",
          overview: "7 years after the case related to Vijay Salgaonkar and his family was closed, a series of unexpected events bring a truth to light that threatens to change everything for the Salgaonkars.",
          posterPath: "/iBR6Jd8vFJEZ3EpqjUMwLUZB1gd.jpg",
          backdropPath: "/2JeIqQpIwdEwwsQJ2QKmJwdZl0W.jpg",
          year: 2022,
          tmdbRating: 7.8,
          genres: [{ id: "18", name: "Drama" }, { id: "53", name: "Thriller" }],
          streamingInfo: { in: { hotstar: [{ link: "https://www.hotstar.com/in/movies/drishyam-2/1260124916" }] } }
        },
        {
          imdbId: "tt15430628",
          title: "Panchayat",
          type: "series",
          overview: "A comedy-drama series about an engineering graduate who joins as a Panchayat secretary in a remote Indian village due to lack of better job options.",
          posterPath: "/9UTWFxBKyPBIQWFJwTxBrCiL0R6.jpg",
          backdropPath: "/5KbJQwRWbD2sSjUmbRkZJ5xpEG.jpg",
          firstAirYear: 2020,
          tmdbRating: 8.9,
          genres: [{ id: "35", name: "Comedy" }, { id: "18", name: "Drama" }],
          streamingInfo: { in: { prime: [{ link: "https://www.primevideo.com/detail/Panchayat/0KEP4A6DWRKFYQFTSU5RXHEAN2" }] } }
        }
      ];

      await this.cacheSearchResults(trendingItems, country);
      console.log(`Refreshed ${trendingItems.length} trending items`);

      console.log("Content refresh job completed");
      return {
        moviesRefreshed: popularMovies.length,
        tvShowsRefreshed: popularTvShows.length,
        trendingRefreshed: trendingItems.length,
      };
    } catch (error) {
      console.error("Error refreshing content:", error);
      throw error;
    }
  }

  /**
   * Get a TV show by its ID, first checking the database, then falling back to the API
   */
  async getTvShow(id: string, country = "in") {
    // First, try to get the TV show from the database
    const cachedTvShow = await prisma.tvShow.findUnique({
      where: { id },
      include: {
        genres: true,
        streamingOptions: {
          where: { region: country },
        },
      },
    });

    // If the TV show exists in the database, return it
    if (cachedTvShow) {
      console.log("Returning cached TV show data for", id);
      return cachedTvShow;
    }

    // Otherwise, fetch from the API
    try {
      console.log("Fetching TV show data from API for", id);

      // Use the Rapid API client to fetch real data
      let tvShowData;

      try {
        // Make the API call to get the TV show data
        // Ensure the ID is in the correct format (remove 'tt' prefix if present)
        const formattedId = id.startsWith('tt') ? id : `tt${id}`;

        const response = await client.showsApi.getShow({
          id: formattedId,
          country: country
        });

        // Use the response data
        tvShowData = response;
        console.log(`Successfully fetched data for ${id} from Rapid API`);
      } catch (apiError) {
        console.error("Error fetching from Rapid API:", apiError);

        // Fallback to default data if API call fails
        tvShowData = {
          itemType: "show",
          showType: "series",
          id: id,
          imdbId: id,
          title: "Unknown TV Show",
          overview: "No information available for this TV show.",
          firstAirYear: null,
          lastAirYear: null,
          genres: [],
          rating: null,
          numberOfSeasons: 0,
          numberOfEpisodes: 0,
          imageSet: {
            verticalPoster: {},
            horizontalBackdrop: {}
          },
          streamingOptions: {}
        };
      }

      // Save the TV show to the database
      return this.saveTvShowToDatabase(tvShowData, country);
    } catch (error) {
      console.error("Error fetching TV show data:", error);
      // If API call fails but we have cached data, return that
      if (cachedTvShow) return cachedTvShow;
      throw error;
    }
  }
}

// Export a singleton instance
export const streamingService = new StreamingService();
