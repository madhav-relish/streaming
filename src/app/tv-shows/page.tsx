import { ContentGrid } from "@/components/content/content-grid";
import { ContentPagination } from "@/components/content/content-pagination";
import { auth } from "@/server/auth";
import { streamingService } from "@/server/services/streaming-service";

export const metadata = {
  title: "TV Shows | StreamHub",
  description: "Browse and discover TV shows from all your favorite streaming platforms in one place.",
};

export const dynamic = 'force-dynamic';

interface TvShowsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function TvShowsPage({ searchParams }: TvShowsPageProps) {
  const session = await auth();
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 30;
  const country = "in"; // Use India as the default country

  try {
    // Fetch TV shows from the database (or API if not cached)
    const tvShows = await streamingService.getPopularTvShows(country, currentPage, itemsPerPage);

    // Get total count for pagination
    const totalCount = await streamingService.getTvShowCount(country);
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    // Format TV show data for content grid
    const formattedTvShows = tvShows.map((tvShow) => ({
      id: tvShow.id,
      title: tvShow.title,
      posterPath: tvShow.posterPath,
      type: "tv" as const,
      year: tvShow.firstAirDate ? new Date(tvShow.firstAirDate).getFullYear().toString() : "",
      rating: tvShow.voteAverage,
      streamingServices: tvShow.streamingOptions.map((option: any) => option.provider),
      fullContent: {
        overview: tvShow.overview,
        backdropPath: tvShow.backdropPath,
        releaseDate: tvShow.firstAirDate ? tvShow.firstAirDate.toISOString() : null,
        genres: tvShow.genres.map((genre: any) => ({ id: genre.id, name: genre.name })),
        streamingServices: tvShow.streamingOptions.map((option: any) => ({
          name: option.provider.charAt(0).toUpperCase() + option.provider.slice(1),
          url: option.url
        }))
      }
    }));

    // If we don't have enough data from the database yet, use mock data
    if (formattedTvShows.length < 10) {
      // Mock data for TV shows
      const mockTvShows = [
        {
          id: "tt0944947",
          title: "Game of Thrones",
          posterPath: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
          type: "tv" as const,
          year: "2011",
          rating: 8.4,
          streamingServices: ["hbo"],
          fullContent: {
            overview: "Seven noble families fight for control of the mythical land of Westeros.",
            backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
            releaseDate: "2011-04-17",
            genres: [{ id: "10765", name: "Sci-Fi & Fantasy" }, { id: "18", name: "Drama" }],
            streamingServices: [{ name: "HBO", url: "https://www.hbo.com/game-of-thrones" }]
          }
        },
        {
          id: "tt0903747",
          title: "Breaking Bad",
          posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
          type: "tv" as const,
          year: "2008",
          rating: 8.5,
          streamingServices: ["netflix"],
          fullContent: {
            overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
            backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
            releaseDate: "2008-01-20",
            genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
            streamingServices: [{ name: "Netflix", url: "https://www.netflix.com/title/70143836" }]
          }
        },
        {
          id: "tt0108778",
          title: "Friends",
          posterPath: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
          type: "tv" as const,
          year: "1994",
          rating: 8.4,
          streamingServices: ["hbo", "netflix"],
          fullContent: {
            overview: "Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.",
            backdropPath: "/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg",
            releaseDate: "1994-09-22",
            genres: [{ id: "35", name: "Comedy" }, { id: "18", name: "Drama" }],
            streamingServices: [
              { name: "HBO", url: "https://www.hbo.com/friends" },
              { name: "Netflix", url: "https://www.netflix.com/title/70153404" }
            ]
          }
        },
        {
          id: "tt1475582",
          title: "Sherlock",
          posterPath: "/7WTsnHkbA0zBBsW5HaNudiHVt0B.jpg",
          type: "tv" as const,
          year: "2010",
          rating: 8.4,
          streamingServices: ["netflix", "prime"],
          fullContent: {
            overview: "A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London.",
            backdropPath: "/bvS50jBZXtglmLu72EAt5KgJBrL.jpg",
            releaseDate: "2010-07-25",
            genres: [{ id: "80", name: "Crime" }, { id: "18", name: "Drama" }],
            streamingServices: [
              { name: "Netflix", url: "https://www.netflix.com/title/70202589" },
              { name: "Prime", url: "https://www.primevideo.com/detail/Sherlock/0HV1EO5QYFTB7T0U5MXD9XBCQJ" }
            ]
          }
        },
        {
          id: "tt0386676",
          title: "The Office",
          posterPath: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.3,
          streamingServices: ["peacock", "netflix"],
          fullContent: {
            overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
            backdropPath: "/vNpuAxGTl9HsUbHqam3E9CzqCvX.jpg",
            releaseDate: "2005-03-24",
            genres: [{ id: "35", name: "Comedy" }],
            streamingServices: [
              { name: "Peacock", url: "https://www.peacocktv.com/stream-tv/the-office" },
              { name: "Netflix", url: "https://www.netflix.com/title/70136120" }
            ]
          }
        },
        {
          id: "tt0417299",
          title: "Avatar: The Last Airbender",
          posterPath: "/cHFZA8Tlv03nKTGXhLOYOLtqoSm.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.4,
          streamingServices: ["netflix", "paramount"],
          fullContent: {
            overview: "In a war-torn world of elemental magic, a young boy reawakens to undertake a dangerous mystic quest to fulfill his destiny as the Avatar.",
            backdropPath: "/5Jx3tVKGAMpWB8e5nsfYrDVEXKi.jpg",
            releaseDate: "2005-02-21",
            genres: [{ id: "16", name: "Animation" }, { id: "10765", name: "Sci-Fi & Fantasy" }],
            streamingServices: [
              { name: "Netflix", url: "https://www.netflix.com/title/70142405" },
              { name: "Paramount", url: "https://www.paramountplus.com/shows/avatar-the-last-airbender/" }
            ]
          }
        },
        {
          id: "tt2442560",
          title: "Peaky Blinders",
          posterPath: "/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
          type: "tv" as const,
          year: "2013",
          rating: 8.3,
          streamingServices: ["netflix"],
          fullContent: {
            overview: "A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps, and their fierce boss Tommy Shelby.",
            backdropPath: "/wiE9doxiLwq3WCGamDIOb2PqBqc.jpg",
            releaseDate: "2013-09-12",
            genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
            streamingServices: [{ name: "Netflix", url: "https://www.netflix.com/title/80002479" }]
          }
        },
        {
          id: "tt0141842",
          title: "The Sopranos",
          posterPath: "/6VTGwvfA8zGvMiYSbPLKNUGhpJY.jpg",
          type: "tv" as const,
          year: "1999",
          rating: 8.6,
          streamingServices: ["hbo"],
          fullContent: {
            overview: "New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life that affect his mental state, leading him to seek professional psychiatric counseling.",
            backdropPath: "/aCbLX6Wd2Yk4Ws7nX9wn5UvU4P9.jpg",
            releaseDate: "1999-01-10",
            genres: [{ id: "18", name: "Drama" }, { id: "80", name: "Crime" }],
            streamingServices: [{ name: "HBO", url: "https://www.hbo.com/the-sopranos" }]
          }
        },
        {
          id: "tt0460649",
          title: "How I Met Your Mother",
          posterPath: "/b34jPzmB0wZy7EjUZoleXOl2LGn.jpg",
          type: "tv" as const,
          year: "2005",
          rating: 8.0,
          streamingServices: ["hulu", "disney"],
          fullContent: {
            overview: "A father recounts to his children - through a series of flashbacks - the journey he and his four best friends took leading up to him meeting their mother.",
            backdropPath: "/lZOODJzwuQcyBC2nWWulUGXZ3lE.jpg",
            releaseDate: "2005-09-19",
            genres: [{ id: "35", name: "Comedy" }, { id: "10766", name: "Soap" }],
            streamingServices: [
              { name: "Hulu", url: "https://www.hulu.com/series/how-i-met-your-mother-3e149e3e-1a75-4146-b033-3cb894748e84" },
              { name: "Disney", url: "https://www.disneyplus.com/series/how-i-met-your-mother/6VEcqTSQDIEZ" }
            ]
          }
        },
        {
          id: "tt0773262",
          title: "Dexter",
          posterPath: "/5DHlhR5WHDFGkM5agZqfrtR7oDX.jpg",
          type: "tv" as const,
          year: "2006",
          rating: 8.1,
          streamingServices: ["netflix", "paramount"],
          fullContent: {
            overview: "By day, mild-mannered Dexter is a blood-spatter analyst for the Miami police. But at night, he is a serial killer who only targets other murderers.",
            backdropPath: "/8CHpX2bHR3drTXQ7f1RLcRuEzXQ.jpg",
            releaseDate: "2006-10-01",
            genres: [{ id: "80", name: "Crime" }, { id: "18", name: "Drama" }],
            streamingServices: [
              { name: "Netflix", url: "https://www.netflix.com/title/70136126" },
              { name: "Paramount", url: "https://www.paramountplus.com/shows/dexter/" }
            ]
          }
        },
      ];

      // Generate more mock data
      const generateMoreTvShows = (count: number) => {
        const result = [...mockTvShows];
        while (result.length < count) {
          const originalShows = mockTvShows.slice(0, Math.min(mockTvShows.length, count - result.length));
          const newShows = originalShows.map(show => {
            // Create a deep copy of the show with a new ID and slightly modified rating
            const newShow = {
              ...show,
              id: show.id + "_" + result.length,
              rating: Math.round((show.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
              fullContent: show.fullContent ? {
                ...show.fullContent,
                // Update any IDs in the fullContent to match the new show ID
                streamingServices: show.fullContent.streamingServices
              } : undefined
            };
            return newShow;
          });
          result.push(...newShows);
        }
        return result.slice(0, count);
      };

      const mockTotalPages = 10; // Simulate 10 pages of mock data

      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
          <ContentGrid items={generateMoreTvShows(itemsPerPage)} />
          <ContentPagination currentPage={currentPage} totalPages={mockTotalPages} />
        </div>
      );
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">TV Shows</h1>
        <ContentGrid items={formattedTvShows} />
        <ContentPagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    );
  } catch (error) {
    console.error("Error loading TV shows:", error);

    // Fallback to a simple error page
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We're having trouble loading the TV shows. Please try again later.
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
