import { ContentGrid } from "@/components/content/content-grid";
import { notFound } from "next/navigation";

interface GenrePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: GenrePageProps) {
  const genreId = parseInt(params.id);
  
  // Mock genres data
  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ];
  
  const genre = genres.find((g) => g.id === genreId);
  
  if (!genre) {
    return {
      title: "Genre Not Found | StreamHub",
      description: "The requested genre could not be found.",
    };
  }
  
  return {
    title: `${genre.name} Movies & TV Shows | StreamHub`,
    description: `Browse ${genre.name} movies and TV shows on StreamHub.`,
  };
}

export default function GenrePage({ params }: GenrePageProps) {
  const genreId = parseInt(params.id);
  
  // Mock genres data
  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ];
  
  const genre = genres.find((g) => g.id === genreId);
  
  if (!genre) {
    notFound();
  }
  
  // Mock content data for this genre
  // In a real app, this would come from an API call filtered by genre
  const mockContent = [
    {
      id: "tt0111161",
      title: "The Shawshank Redemption",
      posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      type: "movie" as const,
      year: "1994",
      rating: 8.7,
      streamingServices: ["netflix", "hbo"],
    },
    {
      id: "tt0068646",
      title: "The Godfather",
      posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      type: "movie" as const,
      year: "1972",
      rating: 8.7,
      streamingServices: ["paramount"],
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
  ];
  
  // Generate more mock data
  const generateMoreContent = (count: number) => {
    const result = [...mockContent];
    while (result.length < count) {
      const originalContent = mockContent.slice(0, Math.min(mockContent.length, count - result.length));
      const newContent = originalContent.map(item => ({
        ...item,
        id: item.id + "_" + result.length,
        rating: Math.round((item.rating - 0.1 + Math.random() * 0.2) * 10) / 10,
      }));
      result.push(...newContent);
    }
    return result.slice(0, count);
  };
  
  const content = generateMoreContent(20);
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{genre.name}</h1>
      <ContentGrid items={content} />
    </div>
  );
}
