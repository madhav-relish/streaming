import { PrismaClient } from "@prisma/client";
import * as streamingAvailability from "streaming-availability";
import { env } from "@/env";
import { Movie } from "@/types/movie";

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
  async getMovie(id: string, country = "us") {
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
        const response = await client.showsApi.getShow({
          id: id,
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
  async getPopularMovies(country = "us", page = 1, limit = 20) {
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
  async getPopularTvShows(country = "us", page = 1, limit = 20) {
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
              us: {
                hbo: [{ link: "https://www.hbomax.com/series/urn:hbo:series:GVU2cggagzYNJjhsJATwo", type: "SUBSCRIPTION" }]
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
              us: {
                netflix: [{ link: "https://www.netflix.com/title/70143836", type: "SUBSCRIPTION" }]
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
   * Search for content, using the API directly (no caching for search results)
   */
  async searchContent(query: string, country = "us", type?: "movie" | "series", page = 1, limit = 20) {
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

      // Create or update the movie
      const movie = await prisma.movie.upsert({
        where: { id: movieData.imdbId },
        update: {
          title: movieData.title,
          overview: movieData.overview || null,
          posterPath: posterPath,
          backdropPath: backdropPath,
          releaseDate: movieData.releaseYear ? new Date(movieData.releaseYear, 0, 1) : null,
          voteAverage: movieData.rating || null,
          voteCount: null, // Not available in the new format
          runtime: movieData.runtime || null,
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
        for (const option of streamingOptions) {
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
      const streamingOptions = this.extractStreamingOptions(tvShowData, country);

      // Create or update the TV show
      const tvShow = await prisma.tvShow.upsert({
        where: { id: tvShowData.imdbId },
        update: {
          title: tvShowData.title,
          overview: tvShowData.overview,
          posterPath: tvShowData.posterPath,
          backdropPath: tvShowData.backdropPath,
          firstAirDate: tvShowData.firstAirYear ? new Date(tvShowData.firstAirYear, 0, 1) : null,
          lastAirDate: tvShowData.lastAirYear ? new Date(tvShowData.lastAirYear, 0, 1) : null,
          voteAverage: tvShowData.tmdbRating,
          voteCount: tvShowData.tmdbVotes,
          numberOfSeasons: tvShowData.seasons?.length || 0,
          numberOfEpisodes: tvShowData.episodeCount || 0,
          updatedAt: new Date(),
        },
        create: {
          id: tvShowData.imdbId,
          title: tvShowData.title,
          overview: tvShowData.overview,
          posterPath: tvShowData.posterPath,
          backdropPath: tvShowData.backdropPath,
          firstAirDate: tvShowData.firstAirYear ? new Date(tvShowData.firstAirYear, 0, 1) : null,
          lastAirDate: tvShowData.lastAirYear ? new Date(tvShowData.lastAirYear, 0, 1) : null,
          voteAverage: tvShowData.tmdbRating,
          voteCount: tvShowData.tmdbVotes,
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
      for (const option of streamingOptions) {
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

    // Check if streaming info exists for the specified country
    if (contentData.streamingInfo && contentData.streamingInfo[country]) {
      const countryStreamingInfo = contentData.streamingInfo[country];

      // Iterate through each streaming service
      for (const [provider, providerData] of Object.entries(countryStreamingInfo)) {
        // Each provider might have multiple options (subscription, rent, buy)
        for (const option of providerData as any[]) {
          options.push({
            provider,
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

    // Check if streaming options exist for the specified country
    if (contentData.streamingOptions && contentData.streamingOptions[country]) {
      const countryStreamingOptions = contentData.streamingOptions[country];

      // Iterate through each streaming option
      for (const option of countryStreamingOptions) {
        options.push({
          provider: option.service.id,
          region: country,
          url: option.link || "",
          type: option.type.toUpperCase() || "SUBSCRIPTION",
        });
      }
    }

    return options;
  }

  /**
   * Refresh all content data from the API (to be run as a scheduled job)
   */
  async refreshAllContent(country = "us") {
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
          streamingInfo: { us: { netflix: [{ link: "https://www.netflix.com" }] } }
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
          streamingInfo: { us: { paramount: [{ link: "https://www.paramountplus.com" }] } }
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
}

// Export a singleton instance
export const streamingService = new StreamingService();
