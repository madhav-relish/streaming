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

    // If the movie exists and was updated recently, return it
    if (
      cachedMovie &&
      cachedMovie.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
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
      return this.saveMovieToDatabase(movieData, country);
    } catch (error) {
      console.error("Error fetching movie data:", error);
      // If API call fails but we have cached data, return that
      if (cachedMovie) return cachedMovie;
      throw error;
    }
  }

  /**
   * Get popular movies, first checking the database, then falling back to the API
   */
  async getPopularMovies(country = "in", page = 1, limit = 20) {
    // Check if we have cached popular movies that were updated recently
    const cachedMovies = await prisma.movie.findMany({
      where: {
        updatedAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        genres: true,
        streamingOptions: {
          where: { region: country },
        },
      },
      orderBy: {
        voteCount: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // If we have enough cached movies, return them
    if (cachedMovies.length >= limit) {
      console.log("Returning cached popular movies");
      return cachedMovies;
    }

    // Otherwise, fetch from the API
    try {
      console.log("Fetching popular movies from API");

      // Use the Rapid API client to fetch real data
      let movieResults = [];

      try {
        // Make the API call to get popular movies
        const response = await client.showsApi.searchShowsByFilters({
          country: country,
          showType: "movie",
          orderBy: "popularity_1year",
          limit: limit,
          offset: (page - 1) * limit
        });

        // Use the response data
        movieResults = response.shows;
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
          this.saveMovieToDatabase(movie, country)
        )
      );

      return savedMovies;
    } catch (error) {
      console.error("Error fetching popular movies:", error);
      // If API call fails but we have some cached data, return that
      if (cachedMovies.length > 0) return cachedMovies;
      throw error;
    }
  }

  /**
   * Get popular TV shows, first checking the database, then falling back to the API
   */
  async getPopularTvShows(country = "in", page = 1, limit = 20) {
    // Check if we have cached popular TV shows that were updated recently
    const cachedTvShows = await prisma.tvShow.findMany({
      where: {
        updatedAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        genres: true,
        streamingOptions: {
          where: { region: country },
        },
      },
      orderBy: {
        voteCount: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // If we have enough cached TV shows, return them
    if (cachedTvShows.length >= limit) {
      console.log("Returning cached popular TV shows");
      return cachedTvShows;
    }

    // Otherwise, fetch from the API
    try {
      console.log("Fetching popular TV shows from API");

      // Since the streaming-availability API structure might have changed,
      // we'll use a more direct approach with mock data for now
      // In a production app, you would update this to use the correct API methods

      // Mock popular TV shows data
      const response = {
        result: [
          {
            imdbId: "tt0944947",
            title: "Game of Thrones",
            overview: "Seven noble families fight for control of the mythical land of Westeros.",
            posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
            backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
            firstAirYear: 2011,
            lastAirYear: 2019,
            tmdbRating: 8.4,
            tmdbVotes: 19000,
            seasons: [1, 2, 3, 4, 5, 6, 7, 8],
            episodeCount: 73,
            genres: [
              { id: "10765", name: "Sci-Fi & Fantasy" },
              { id: "18", name: "Drama" }
            ],
            streamingInfo: {
              in: {
                hotstar: [{ link: "https://www.hotstar.com/in/tv/game-of-thrones/8184", type: "SUBSCRIPTION" }]
              }
            }
          },
          {
            imdbId: "tt0903747",
            title: "Breaking Bad",
            overview: "When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of only two years left to live.",
            posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
            backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
            firstAirYear: 2008,
            lastAirYear: 2013,
            tmdbRating: 8.5,
            tmdbVotes: 17000,
            seasons: [1, 2, 3, 4, 5],
            episodeCount: 62,
            genres: [
              { id: "18", name: "Drama" },
              { id: "80", name: "Crime" }
            ],
            streamingInfo: {
              in: {
                netflix: [{ link: "https://www.netflix.com/in/title/70143836", type: "SUBSCRIPTION" }]
              }
            }
          }
        ]
      };

      // Save all TV shows to the database
      const savedTvShows = await Promise.all(
        response.result.map((tvShow: any) =>
          this.saveTvShowToDatabase(tvShow, country)
        )
      );

      return savedTvShows;
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
      // If API call fails but we have some cached data, return that
      if (cachedTvShows.length > 0) return cachedTvShows;
      throw error;
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
      const model = type === "movie" ? prisma.movie : prisma.tvShow;

      const cachedContent = await model.findMany({
        where: {
          streamingOptions: {
            some: {
              provider: service,
              region: country,
            },
          },
          updatedAt: {
            gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
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
        orderBy: {
          voteAverage: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
      });

      // If we have enough cached content, return it
      if (cachedContent.length >= 5) {
        console.log(`Returning cached ${type} content for ${service}`);
        return cachedContent;
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
        });

        // Filter the results to only include content from the specified service
        const filteredResults = response.shows.filter((show: any) => {
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

        // Create a response object similar to the API response
        const filteredResponse = {
          shows: paginatedResults
        };

        // Process and save the results
        const results = paginatedResults || [];
        console.log(`Found ${results.length} ${type}s for ${service}`);

        // Save all content to the database
        const savedContent = await Promise.all(
          results.map((item: any) => {
            if (type === "movie") {
              return this.saveMovieToDatabase(item, country);
            } else {
              return this.saveTvShowToDatabase(item, country);
            }
          })
        );

        return savedContent;
      } catch (apiError) {
        console.error(`Error fetching ${type} content for ${service}:`, apiError);

        // If API call fails but we have some cached data, return that
        if (cachedContent.length > 0) {
          console.log(`Returning partial cached ${type} content for ${service}`);
          return cachedContent;
        }

        // Otherwise return empty array
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
      let searchResults = [];

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
        });

        // Use the response data
        searchResults = response.shows;
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
      this.cacheSearchResults(searchResults, country);

      return formattedResults;
    } catch (error) {
      console.error("Error searching content:", error);
      throw error;
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
      const posterPath = movieData.imageSet?.verticalPoster?.w480 || null;
      const backdropPath = movieData.imageSet?.horizontalBackdrop?.w1080 || null;

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
          // Check if genre already exists to avoid unique constraint errors
          const existingGenre = await prisma.genre.findUnique({
            where: { id: genre.id }
          });

          if (existingGenre) {
            // Only update if name has changed
            if (existingGenre.name !== genre.name) {
              await prisma.genre.update({
                where: { id: genre.id },
                data: { name: genre.name }
              });
            }
          } else {
            // Create new genre
            await prisma.genre.create({
              data: { id: genre.id, name: genre.name }
            });
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
    } catch (error) {
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
          `Failed to save movie to database: ${error.message}`,
          'DATABASE_ERROR',
          error
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
    } catch (error) {
      console.error("Error updating movie in database:", error);
      throw error;
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
      let posterPath = tvShowData.posterPath;
      let backdropPath = tvShowData.backdropPath;

      // For Rapid API format
      if (tvShowData.imageSet) {
        posterPath = tvShowData.imageSet.verticalPoster?.w480 || posterPath;
        backdropPath = tvShowData.imageSet.horizontalBackdrop?.w1080 || backdropPath;
      }

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
      for (const genre of genreConnections) {
        await prisma.genre.upsert({
          where: { id: genre.id },
          update: { name: genre.name },
          create: { id: genre.id, name: genre.name },
        });

        await prisma.tvShow.update({
          where: { id: tvShow.id },
          data: {
            genres: {
              connect: { id: genre.id },
            },
          },
        });
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
    } catch (error) {
      console.error("Error saving TV show to database:", error);
      throw error;
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

    // If the TV show exists and was updated recently, return it
    if (
      cachedTvShow &&
      cachedTvShow.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) {
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
