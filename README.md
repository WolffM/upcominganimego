# Upcoming Anime Go

A web application that displays upcoming anime releases with trailers, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Browse upcoming anime releases with trailers
- View detailed information about each anime
- Personalized ranking system based on user preferences
- Sort anime by various criteria (ranking, popularity, release date)
- Featured picks section highlighting top recommendations
- Responsive design for all devices
- Dark mode support

## Ranking System

The application includes a personalized ranking system that considers:

1. **User Preferences**: Ranks anime based on two user profiles (Hadoku and LittleMiss)
   - Liked studios
   - Liked directors
   - Preferred genres
   - Age rating preferences

2. **General Factors**:
   - Trailer quality
   - Popularity
   - Anticipation based on release date
   - Genre relevance to current trends

3. **Sorting Options**:
   - Our Ranking (default): Shows top picks first, then sorts by combined score
   - Hadoku's Ranking: Sorts by Hadoku's personal score
   - LittleMiss's Ranking: Sorts by LittleMiss's personal score
   - Combined Ranking: Sorts by the combined score from both users
   - Popularity: Sorts by popularity from the AniList API
   - Release Date: Sorts by upcoming release date

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/upcominganimego.git
   cd upcominganimego
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **GraphQL**: For API queries to AniList
- **React Icons**: Icon library

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/) for providing anime data
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

```
# Logging configuration
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_LOG_TO_CONSOLE=true
NEXT_PUBLIC_LOG_TO_SERVER=false
NEXT_PUBLIC_LOG_COMPONENT_RENDERS=false
```

### Log Levels

Available log levels (from most to least verbose):
- `trace`: Most detailed logging
- `debug`: Debugging information
- `info`: General information
- `warn`: Warnings
- `error`: Errors
- `fatal`: Critical errors

## API Integration

This application uses the AniList GraphQL API to fetch anime data. No API key is required for basic usage.

## Testing

Run the test suite with:

```bash
npm test
# or
yarn test
```

API-specific tests can be run with:

```bash
npm run test:api
# or
yarn test:api
```

## Image Fallback System

The application includes a smart image fallback system that:

- Handles missing or broken images gracefully
- Automatically detects sequel anime and tries to find images from previous seasons
- Includes a database of fallback images for popular series
- Provides a generic placeholder when no specific fallback is available
- Displays a helpful message when using fallback images
