import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Genres | StreamHub",
  description: "Browse content by genre on StreamHub.",
};

export default function GenresPage() {
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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {genres.map((genre) => (
          <Link key={genre.id} href={`/genres/${genre.id}`}>
            <Card className="h-full hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center justify-center h-full p-6">
                <h2 className="text-lg font-medium text-center">{genre.name}</h2>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
