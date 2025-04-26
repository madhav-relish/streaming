import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import { streamingService } from "@/server/services/streaming-service";

import { HeroSection } from "@/components/home/hero-section";
import { ContentSection } from "@/components/home/content-section";
import { StreamingTabs } from "@/components/home/streaming-tabs";

export default async function Home() {
	// Get user session for personalization (will use later)
	// We're not using this yet, but will be needed for personalized recommendations
	// and watchlist functionality
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const session = await auth();

	try {
		// Fetch featured content for hero section (using an Indian movie)
		const featuredContent = await streamingService.getMovie("tt8108198", "in"); // Drishyam 2

		// Fetch popular movies from India
		const popularMovies = await streamingService.getPopularMovies("in", 1, 20);

		// Fetch popular TV shows from India
		const popularTvShows = await streamingService.getPopularTvShows("in", 1, 20);

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

		// Always use real data from the API

		// Format the data from the API
		const formattedMovies = formatMovieData(popularMovies);
		const formattedTvShows = formatTvShowData(popularTvShows);

		// Combine movies and TV shows for trending section
		const trendingContent = [
			...formatMovieData(popularMovies.slice(0, 5)),
			...formatTvShowData(popularTvShows.slice(0, 5)),
		].sort(() => Math.random() - 0.5);

		// Default values for featured content if database fetch fails
		const defaultFeaturedContent = {
			id: "tt8108198",
			title: "Drishyam 2",
			overview: "7 years after the case related to Vijay Salgaonkar and his family was closed, a series of unexpected events bring a truth to light that threatens to change everything for the Salgaonkars.",
			backdropPath: "/2JeIqQpIwdEwwsQJ2QKmJwdZl0W.jpg",
			releaseDate: new Date("2022-11-18"),
			streamingOptions: [
				{
					provider: "hotstar",
					region: "in",
					url: "https://www.hotstar.com/in/movies/drishyam-2/1260124916",
					type: "SUBSCRIPTION"
				}
			]
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
						backdropPath={heroContent.backdropPath || "/2JeIqQpIwdEwwsQJ2QKmJwdZl0W.jpg"}
						id={heroContent.id}
						type="movie"
						year={releaseYear}
						streamingServices={featuredStreamingServices.length > 0 ? featuredStreamingServices : []}
					/>

					{/* Streaming Tabs Section */}
					<StreamingTabs />

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
