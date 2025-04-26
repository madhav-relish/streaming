import { ContentGrid } from "@/components/content/content-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SearchPageProps {
  searchParams: {
    q?: string;
    type?: string;
  };
}

export const metadata = {
  title: "Search | StreamHub",
  description: "Search for movies and TV shows across all streaming platforms.",
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  const type = searchParams.type || "all";
  
  // Mock search results
  const mockMovies = [
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
  ];
  
  // Filter results based on query (in a real app, this would be done server-side)
  const filteredMovies = query 
    ? mockMovies.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
      )
    : mockMovies;
    
  const filteredTvShows = query 
    ? mockTvShows.filter(show => 
        show.title.toLowerCase().includes(query.toLowerCase())
      )
    : mockTvShows;
  
  // Combine results based on selected type
  const results = type === "movie" 
    ? filteredMovies 
    : type === "tv" 
      ? filteredTvShows 
      : [...filteredMovies, ...filteredTvShows];
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      {/* Search Form */}
      <form action="/search" className="mb-8">
        <div className="flex gap-2">
          <Input 
            type="search" 
            name="q" 
            placeholder="Search for movies and TV shows..." 
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </div>
      </form>
      
      {/* Results Tabs */}
      <Tabs defaultValue={type} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href={`/search?q=${query}&type=all`}>All</a>
          </TabsTrigger>
          <TabsTrigger value="movie" asChild>
            <a href={`/search?q=${query}&type=movie`}>Movies</a>
          </TabsTrigger>
          <TabsTrigger value="tv" asChild>
            <a href={`/search?q=${query}&type=tv`}>TV Shows</a>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {results.length > 0 ? (
            <ContentGrid items={results} />
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No results found for "{query}". Try a different search term.
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="movie" className="mt-6">
          {filteredMovies.length > 0 ? (
            <ContentGrid items={filteredMovies} />
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No movie results found for "{query}". Try a different search term.
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="tv" className="mt-6">
          {filteredTvShows.length > 0 ? (
            <ContentGrid items={filteredTvShows} />
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No TV show results found for "{query}". Try a different search term.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
