# Codebase Structure

This document outlines the structure of the Upcoming Anime Go codebase to help developers understand the organization and relationships between different parts of the application.

## Directory Structure

```
upcominganimego/
├── public/                 # Static assets
│   └── images/             # Static images including fallbacks
├── src/                    # Source code
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API and business logic services
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── tests/                  # Test files
│   ├── api/                # API tests
│   └── components/         # Component tests
├── .env.local              # Environment variables (not in repo)
├── next.config.js          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Components

### Page Components

- `src/app/page.tsx`: Main page component that displays the list of upcoming anime

### UI Components

- `src/components/AnimeCard.tsx`: Card component for displaying anime information with trailer functionality
- `src/components/AnimeGrid.tsx`: Grid layout for displaying multiple AnimeCard components
- `src/components/Pagination.tsx`: Pagination controls for navigating through pages of results
- `src/components/ErrorBoundary.tsx`: React error boundary for catching and displaying errors
- `src/components/SortSelector.tsx`: Dropdown for selecting different sorting options for anime
- `src/components/FeaturedPicks.tsx`: Component for displaying featured top picks from user profiles
- `src/components/LoadingSpinner.tsx`: Loading indicator component
- `src/components/ErrorDisplay.tsx`: Error display component with retry functionality

### Hooks

- `src/hooks/useAnime.ts`: Custom hook for fetching and managing anime data, including pagination, sorting, and ranking

### Services

- `src/services/anilistService.ts`: Service for interacting with the AniList GraphQL API
- `src/services/rankingService.ts`: Service for calculating and applying ranking to anime
- `src/services/userPreferencesService.ts`: Service for managing user preferences and calculating personalized rankings

### Utilities

- `src/utils/logger.ts`: Logging utility for consistent logging across the application
- `src/utils/dateFormatter.ts`: Utility for formatting dates and calculating time until release
- `src/utils/env.ts`: Utility for accessing environment variables with type safety
- `src/utils/imageFallbacks.ts`: Utility for managing fallback images for anime, especially for sequels

## Data Flow

1. The main page component (`page.tsx`) uses the `useAnime` hook to fetch anime data
2. The `useAnime` hook calls the `anilistService` to fetch data from the AniList API
3. The `rankingService` processes the anime data to calculate ranking scores
4. The `userPreferencesService` applies personalized rankings based on user profiles
5. The sorted and ranked anime data is passed to the page component
6. The page renders the `FeaturedPicks` component for top picks and individual `AnimeCard` components
7. User interactions (pagination, sorting, watching trailers) are handled by the respective components

## Key Features

### Anime Data Fetching

- GraphQL queries to the AniList API
- Pagination for fetching multiple pages of results
- Error handling and retry mechanisms

### Personalized Ranking System

- User preference-based ranking in `userPreferencesService.ts`
- Multi-factor ranking algorithm in `rankingService.ts`
- Configurable weights for different ranking factors
- Sorting options based on different criteria
- Top picks identification for featured display

### User Preferences

- Support for multiple user profiles (Hadoku and LittleMiss)
- Preference factors:
  - Liked studios
  - Liked directors
  - Preferred genres
  - Age rating preferences
- Combined ranking that balances preferences from multiple users

### Video Handling

- Trailer preloading for smoother playback
- Fallback mechanisms for failed video loading
- Support for multiple video providers (YouTube, Dailymotion)

### Image Handling

- Next.js Image optimization for performance
- Smart fallback system for missing or broken images
- Sequel detection to use previous season images when appropriate
- Database of fallback images for popular anime series

### Error Handling

- Error boundary for catching and displaying component errors
- Comprehensive logging system for tracking issues
- Fallback UI for various error states

### Logging System

- Configurable log levels via environment variables
- Context-based logging for easier debugging
- Component lifecycle logging for performance monitoring

## Environment Configuration

The application uses environment variables for configuration, which can be set in a `.env.local` file:

```
# Logging configuration
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_LOG_TO_CONSOLE=true
NEXT_PUBLIC_LOG_TO_SERVER=false
NEXT_PUBLIC_LOG_COMPONENT_RENDERS=false
```

See the README.md file for more details on environment variables. 