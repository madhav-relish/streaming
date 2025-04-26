import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import { streamingService } from "@/server/services/streaming-service";

import { HeroSection } from "@/components/home/hero-section";
import { ContentSection } from "@/components/home/content-section";

export default async function Home() {
	// Get user session for personalization (will use later)
	// We're not using this yet, but will be needed for personalized recommendations
	// and watchlist functionality
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const session = await auth();

	try {
		// Fetch featured content for hero section (The Godfather)
		const featuredContent = await streamingService.getMovie("tt0068646", "us");

		// Fetch popular movies
		const popularMovies = await streamingService.getPopularMovies("us", 1, 20);

		// Fetch popular TV shows
		const popularTvShows = await streamingService.getPopularTvShows("us", 1, 20);

		// Format movie data for content grid
		const formatMovieData = (movies: any[]) => {
			return movies.map((movie) => ({
				id: movie.id,
				title: movie.title,
				posterPath: movie.posterPath,
				type: "movie" as const,
				year: movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : "",
				rating: movie.voteAverage,
				streamingServices: movie.streamingOptions.map((option: any) => option.provider),
				// Additional data for modal
				fullContent: {
					overview: movie.overview,
					backdropPath: movie.backdropPath,
					releaseDate: movie.releaseDate ? movie.releaseDate.toISOString() : null,
					runtime: movie.runtime,
					genres: movie.genres,
					streamingServices: movie.streamingOptions.map((option: any) => ({
						name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1), // Capitalize provider name
						url: option.url
					}))
				}
			}));
		};

		// Format TV show data for content grid
		const formatTvShowData = (tvShows: any[]) => {
			return tvShows.map((tvShow) => ({
				id: tvShow.id,
				title: tvShow.title,
				posterPath: tvShow.posterPath,
				type: "tv" as const,
				year: tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear().toString() : "",
				rating: tvShow.voteAverage,
				streamingServices: tvShow.streamingOptions.map((option: any) => option.provider),
				// Additional data for modal
				fullContent: {
					overview: tvShow.overview,
					backdropPath: tvShow.backdropPath,
					releaseDate: tvShow.firstAirDate ? tvShow.firstAirDate.toISOString() : null,
					runtime: tvShow.episodeRuntime?.[0] || null,
					genres: tvShow.genres,
					streamingServices: tvShow.streamingOptions.map((option: any) => ({
						name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1), // Capitalize provider name
						url: option.url
					}))
				}
			}));
		};

		// If we don't have enough data from the database yet, use mock data
		const useMockData = popularMovies.length < 5 || popularTvShows.length < 5;

		let formattedMovies = [];
		let formattedTvShows = [];
		let trendingContent = [];

		if (useMockData) {
			// Mock data for content sections
			const mockMovies = [
				{
					id: "tt0111161",
					title: "The Shawshank Redemption",
					posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
					type: "movie" as const,
					year: "1994",
					rating: 8.7,
					streamingServices: ["netflix", "hbo"],
					fullContent: {
						overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
						backdropPath: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
						releaseDate: "1994-09-23",
						runtime: 142,
						genres: [
							{ id: "18", name: "Drama" },
							{ id: "80", name: "Crime" }
						],
						streamingServices: [
							{ name: "Netflix", url: "https://www.netflix.com/title/tt0111161" },
							{ name: "HBO Max", url: "https://www.hbomax.com/feature/urn:hbo:feature:GXdu2ZAglVJuAuwEAADbA" }
						]
					}
				},
				{
					id: "tt0068646",
					title: "The Godfather",
					posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
					type: "movie" as const,
					year: "1972",
					rating: 8.7,
					streamingServices: ["paramount"],
					fullContent: {
						overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
						backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
						releaseDate: "1972-03-14",
						runtime: 175,
						genres: [
							{ id: "18", name: "Drama" },
							{ id: "80", name: "Crime" }
						],
						streamingServices: [
							{ name: "Paramount+", url: "https://www.paramountplus.com/movies/video/QwP_Nx7681SnCBrjmNXOzSfbmBCvRR_l/" }
						]
					}
				},
				{
					id: "tt0468569",
					title: "The Dark Knight",
					posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
					type: "movie" as const,
					year: "2008",
					rating: 8.5,
					streamingServices: ["hbo", "netflix"],
				},
				{
					id: "tt0167260",
					title: "The Lord of the Rings: The Return of the King",
					posterPath: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
					type: "movie" as const,
					year: "2003",
					rating: 8.5,
					streamingServices: ["hbo", "prime"],
				},
				{
					id: "tt0110912",
					title: "Pulp Fiction",
					posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
					type: "movie" as const,
					year: "1994",
					rating: 8.5,
					streamingServices: ["netflix"],
				},
			];

			const mockTvShows = [
				{
					id: "tt0944947",
					title: "Game of Thrones",
					posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
					type: "tv" as const,
					year: "2011",
					rating: 8.4,
					streamingServices: ["hbo"],
				},
				{
					id: "tt0903747",
					title: "Breaking Bad",
					posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
					type: "tv" as const,
					year: "2008",
					rating: 8.5,
					streamingServices: ["netflix"],
				},
				{
					id: "tt0108778",
					title: "Friends",
					posterPath: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
					type: "tv" as const,
					year: "1994",
					rating: 8.4,
					streamingServices: ["hbo", "netflix"],
				},
				{
					id: "tt1475582",
					title: "Sherlock",
					posterPath: "/7WTsnHkbA0zBBsW5HaNudiHVt0B.jpg",
					type: "tv" as const,
					year: "2010",
					rating: 8.4,
					streamingServices: ["netflix", "prime"],
				},
				{
					id: "tt0386676",
					title: "The Office",
					posterPath: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
					type: "tv" as const,
					year: "2005",
					rating: 8.3,
					streamingServices: ["peacock", "netflix"],
				},
			];

			// Define a generic type for content items
			type ContentItem = {
				id: string;
				title: string;
				posterPath: string;
				type: "movie" | "tv";
				year: string;
				rating: number;
				streamingServices: string[];
			};

			// Generate more mock data by duplicating and slightly modifying existing items
			const generateMoreMockData = <T extends ContentItem>(items: T[], count: number): T[] => {
				const result = [...items];
				while (result.length < count) {
					const originalItems = items.slice(0, Math.min(items.length, count - result.length));
					const newItems = originalItems.map(item => ({
						...item,
						id: item.id + "_" + result.length,
						rating: Math.round((item.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
					}));
					result.push(...newItems);
				}
				return result.slice(0, count);
			};

			formattedMovies = generateMoreMockData(mockMovies, 20);
			formattedTvShows = generateMoreMockData(mockTvShows, 20);

			// Mix movies and TV shows for trending section
			const trendingItems: ContentItem[] = [
				...generateMoreMockData(mockMovies, 10),
				...generateMoreMockData(mockTvShows, 10)
			];
			// Shuffle the trending items
			trendingContent = trendingItems.sort(() => Math.random() - 0.5);
		} else {
			// Use real data from the database
			formattedMovies = formatMovieData(popularMovies);
			formattedTvShows = formatTvShowData(popularTvShows);

			// Mix movies and TV shows for trending section
			trendingContent = [...formattedMovies.slice(0, 10), ...formattedTvShows.slice(0, 10)]
				.sort(() => Math.random() - 0.5);
		}

		// Default values for featured content if database fetch fails
		const defaultFeaturedContent = {
			id: "tt0068646",
			title: "The Godfather",
			overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. When organized crime family patriarch, Vito Corleone barely survives an attempt on his life, his youngest son, Michael steps in to take care of the would-be killers, launching a campaign of bloody revenge.",
			backdropPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
			releaseDate: new Date("1972-03-14"),
			streamingOptions: []
		};

		// Extract streaming services for the featured content
		const featuredStreamingServices = featuredContent?.streamingOptions?.map((option: any) => ({
			name: option.provider,
			url: option.url,
		})) || [];

		// Use the fetched content or fall back to default values
		const heroContent = featuredContent || defaultFeaturedContent;
		const releaseYear = heroContent.releaseDate
			? new Date(heroContent.releaseDate).getFullYear().toString()
			: "1972";

		return (
			<HydrateClient>
				<div>
					{/* Hero Section */}
					<HeroSection
						title={heroContent.title}
						overview={heroContent.overview || ""}
						backdropPath={heroContent.backdropPath || "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"}
						id={heroContent.id}
						type="movie"
						year={releaseYear}
						streamingServices={featuredStreamingServices.length > 0 ? featuredStreamingServices : [
							{ name: "Netflix", url: "https://www.netflix.com/title/tt0068646" },
							{ name: "Prime", url: "https://www.amazon.com/gp/video/detail/tt0068646" },
						]}
					/>

					{/* Popular Movies Section */}
					<ContentSection
						title="Popular Movies"
						viewAllHref="/movies"
						items={formattedMovies}
						userId={session?.user?.id || null}
					/>

					{/* Popular TV Shows Section */}
					<ContentSection
						title="Popular TV Shows"
						viewAllHref="/tv-shows"
						items={formattedTvShows}
						userId={session?.user?.id || null}
					/>

					{/* Trending Now Section */}
					<ContentSection
						title="Trending Now"
						items={trendingContent}
						userId={session?.user?.id || null}
					/>
				</div>
			</HydrateClient>
		);
	} catch (error) {
		console.error("Error loading homepage content:", error);

		// Fallback to a simple error page
		return (
			<div className="container py-20 text-center">
				<h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
				<p className="text-muted-foreground mb-8">
					We're having trouble loading the content. Please try again later.
				</p>
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
				>
					Refresh Page
				</button>
			</div>
		);
	}
}
