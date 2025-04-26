# StreamHub

StreamHub is a modern streaming content aggregator that helps users discover where to watch their favorite movies and TV shows across multiple streaming platforms.

## Features

- **Content Discovery**: Find movies and TV shows across multiple streaming platforms
- **Detailed Information**: View comprehensive details about movies and TV shows
- **Streaming Links**: Direct links to watch content on your subscribed platforms
- **Watchlist**: Save content to watch later
- **User Preferences**: Customize your experience based on your streaming subscriptions
- **Embedded Viewing**: Watch content directly within the StreamHub interface

## Recent Updates

- **Rapid API Integration**: Now using the Streaming Availability API from Rapid API for real-time, accurate streaming data
- **Enhanced Image Handling**: Better image quality with multiple size options
- **Modal Preview**: Quick preview of content details in a modal
- **Embedded Streaming**: Watch content without leaving the app
- **Improved UI/UX**: More intuitive interface for discovering content

## Technology Stack

- [Next.js](https://nextjs.org) - React framework for server-rendered applications
- [NextAuth.js](https://next-auth.js.org) - Authentication for Next.js
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Rapid API](https://rapidapi.com/) - API marketplace for streaming data

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Database
DATABASE_URL="your-database-url"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# API Keys
STREAMING_API_KEY="your-rapid-api-key"
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
