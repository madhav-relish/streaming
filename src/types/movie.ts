import { z } from "zod";

// Define the schema for streaming service
export const StreamingServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  homePage: z.string(),
  themeColorCode: z.string()
});

// Define the schema for streaming options
export const StreamingOptionSchema = z.object({
  service: StreamingServiceSchema,
  type: z.string(),
  link: z.string(),
  videoLink: z.string().optional(),
  quality: z.string().optional(),
  price: z.object({
    amount: z.string(),
    currency: z.string(),
    formatted: z.string()
  }).optional(),
  expiresSoon: z.boolean().optional(),
  expiresOn: z.number().optional(),
  availableSince: z.number().optional()
});

// Define the schema for streaming options by country
export const StreamingOptionsSchema = z.record(
  z.array(StreamingOptionSchema)
);

// Define the schema for movie genres
export const GenreSchema = z.object({
  id: z.string(),
  name: z.string()
});

// Define the schema for image sets
export const ImageSetSchema = z.object({
  verticalPoster: z.record(z.string()).optional(),
  horizontalPoster: z.record(z.string()).optional(),
  verticalBackdrop: z.record(z.string()).optional(),
  horizontalBackdrop: z.record(z.string()).optional()
});

// Define the schema for a movie
export const MovieSchema = z.object({
  itemType: z.string().optional(),
  showType: z.string().optional(),
  id: z.string(),
  imdbId: z.string(),
  tmdbId: z.string().optional(),
  title: z.string(),
  overview: z.string().nullable().optional(),
  releaseYear: z.number().nullable().optional(),
  originalTitle: z.string().optional(),
  genres: z.array(GenreSchema).optional(),
  directors: z.array(z.string()).optional(),
  cast: z.array(z.string()).optional(),
  rating: z.number().nullable().optional(),
  runtime: z.number().nullable().optional(),
  imageSet: ImageSetSchema.optional(),
  streamingOptions: StreamingOptionsSchema.optional()
});

// Define the type for a movie
export type Movie = z.infer<typeof MovieSchema>;

// Define the type for streaming options
export type StreamingOptions = z.infer<typeof StreamingOptionsSchema>;

// Define the type for a streaming option
export type StreamingOption = z.infer<typeof StreamingOptionSchema>;

// Define the type for a streaming service
export type StreamingService = z.infer<typeof StreamingServiceSchema>;

// Define the type for a genre
export type Genre = z.infer<typeof GenreSchema>;

// Define the type for image sets
export type ImageSet = z.infer<typeof ImageSetSchema>;
