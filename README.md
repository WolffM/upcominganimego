# Upcoming Anime Go

A web application that displays upcoming anime releases with trailers, built with Next.js, TypeScript, and Tailwind CSS.
Live here: https://wolffm.github.io/upcominganimego/

## Features

- Browse upcoming anime releases with trailers
- View detailed information about each anime
- Personalized ranking system based on user preferences
- Sort anime by various criteria (ranking, popularity, release date)
- Featured picks section highlighting top recommendations
- Responsive design for all devices
- Dark mode support

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

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### How to Deploy

1. Push your changes to the main branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. The GitHub Actions workflow will automatically build and deploy the application to GitHub Pages.

3. Your application will be available at `https://yourusername.github.io/upcominganimego/`

### Manual Deployment

You can also manually trigger the deployment workflow:

1. Go to your GitHub repository
2. Navigate to Actions tab
3. Select the "Deploy to GitHub Pages" workflow
4. Click "Run workflow"

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

## API Integration

This application uses the AniList GraphQL API to fetch anime data. No API key is required for basic usage.

## Image Fallback System

The application includes a smart image fallback system that:

- Handles missing or broken images gracefully
- Automatically detects sequel anime and tries to find images from previous seasons
- Includes a database of fallback images for popular series
- Provides a generic placeholder when no specific fallback is available
- Displays a helpful message when using fallback images
