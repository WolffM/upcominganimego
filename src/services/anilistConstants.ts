import { gql } from 'graphql-request';
import { AnimeSeason, MAX_PAGE_SIZE, MAX_PAGES_TO_FETCH } from '@/types/anime';

// GraphQL query to fetch upcoming anime with trailers
export const UPCOMING_ANIME_QUERY = gql`
  query UpcomingAnime($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort], $format_in: [MediaFormat], $genre_in: [String]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      media(
        type: ANIME
        format_in: $format_in
        genre_in: $genre_in
        season: $season
        seasonYear: $seasonYear
        sort: $sort
      ) {
        id
        title {
          romaji
          english
          native
        }
        description
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        trailer {
          id
          site
          thumbnail
        }
        season
        seasonYear
        format
        status
        episodes
        duration
        genres
        tags {
          id
          name
          description
          category
          rank
          isGeneralSpoiler
          isMediaSpoiler
          isAdult
        }
        averageScore
        popularity
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
        studios {
          nodes {
            id
            name
          }
        }
        staff {
          edges {
            role
            node {
              id
              name {
                full
              }
            }
          }
        }
        isAdult
      }
    }
  }
`;

// GraphQL query to fetch user ID by username
export const USER_BY_NAME_QUERY = gql`
  query UserByName($name: String) {
    User(name: $name) {
      id
      name
    }
  }
`;

// GraphQL query to fetch user anime list with scores
export const USER_RATINGS_QUERY = gql`
  query UserRatedAnime($userId: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      mediaList(userId: $userId, type: ANIME, sort: SCORE_DESC) {
        id
        mediaId
        score
        media {
          id
          title {
            romaji
            english
            native
          }
          description
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          trailer {
            id
            site
            thumbnail
          }
          season
          seasonYear
          format
          status
          episodes
          duration
          genres
          averageScore
          popularity
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
        }
      }
    }
  }
`;

// Common constants
export const ANILIST_API_URL = 'https://graphql.anilist.co'; 