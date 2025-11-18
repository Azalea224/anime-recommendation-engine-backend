import { GraphQLClient, gql } from 'graphql-request';
import { getEnv } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { IAnime } from '../types/index.js';

const ANILIST_QUERY = gql`
  query GetUserAnimeList($userId: Int!) {
    MediaListCollection(userId: $userId, type: ANIME) {
      lists {
        entries {
          id
          mediaId
          status
          score
          progress
          media {
            id
            title {
              romaji
              english
            }
            episodes
            format
            genres
            tags {
              name
            }
            coverImage {
              large
            }
            bannerImage
          }
        }
      }
    }
  }
`;

interface AniListResponse {
  MediaListCollection: {
    lists: Array<{
      entries: Array<{
        id: number;
        mediaId: number;
        status: string;
        score: number;
        progress: number;
        media: {
          id: number;
          title: {
            romaji: string;
            english: string | null;
          };
          episodes: number | null;
          format: string;
          genres: string[];
          tags: Array<{
            name: string;
          }>;
          coverImage: {
            large: string;
          };
          bannerImage: string | null;
        };
      }>;
    }>;
  } | null;
}

export async function fetchAnimeList(
  apiKey: string | null,
  userId: string,
  anilistUsername?: string
): Promise<IAnime[]> {
  const { ANILIST_API_URL } = getEnv();
  
  // Build headers - only include Authorization if API key is provided
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const client = new GraphQLClient(ANILIST_API_URL, { headers });

  try {
    let anilistUserId: number;

    if (apiKey) {
      // If API key is provided, get the authenticated user's ID
      const userQuery = gql`
        query {
          Viewer {
            id
          }
        }
      `;

      const userResponse = await client.request<{ Viewer: { id: number } }>(userQuery);
      anilistUserId = userResponse.Viewer.id;
    } else if (anilistUsername) {
      // If no API key but username is provided, get user ID from username (public profile)
      const userQuery = gql`
        query ($username: String!) {
          User(name: $username) {
            id
          }
        }
      `;

      const userResponse = await client.request<{ User: { id: number } | null }>(userQuery, {
        username: anilistUsername,
      });

      if (!userResponse.User) {
        throw new Error(`User "${anilistUsername}" not found on AniList`);
      }

      anilistUserId = userResponse.User.id;
    } else {
      throw new Error('Either API key or AniList username must be provided');
    }

    // Then fetch the anime list (works for both authenticated and public profiles)
    const response = await client.request<AniListResponse>(ANILIST_QUERY, { userId: anilistUserId });

    if (!response.MediaListCollection) {
      return [];
    }

    const animeList: IAnime[] = [];

    for (const list of response.MediaListCollection.lists) {
      for (const entry of list.entries) {
        animeList.push({
          userId, // This is our app's userId, not AniList userId
          animeId: entry.media.id,
          title: entry.media.title.english || entry.media.title.romaji,
          score: entry.score || 0,
          status: entry.status,
          progress: entry.progress,
          totalEpisodes: entry.media.episodes || 0,
          format: entry.media.format,
          genres: entry.media.genres || [],
          tags: entry.media.tags.map((tag) => tag.name),
          coverImage: entry.media.coverImage.large,
          bannerImage: entry.media.bannerImage || undefined,
          syncedAt: new Date(),
        } as IAnime);
      }
    }

    return animeList;
  } catch (error: any) {
    logger.error('AniList API error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid AniList API key');
    }
    
    if (error.response?.status === 429) {
      throw new Error('AniList API rate limit exceeded');
    }

    throw new Error(`Failed to fetch anime list: ${error.message}`);
  }
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  const { ANILIST_API_URL } = getEnv();
  
  // Trim the API key to remove any whitespace
  const trimmedKey = apiKey.trim();
  
  if (!trimmedKey) {
    logger.warn('AniList API key is empty after trimming');
    return false;
  }

  const client = new GraphQLClient(ANILIST_API_URL, {
    headers: {
      'Authorization': `Bearer ${trimmedKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  try {
    const query = gql`
      query {
        Viewer {
          id
          name
        }
      }
    `;

    const response = await client.request(query);
    
    // If we get a response with Viewer data, the token is valid
    if (response && response.Viewer) {
      return true;
    }
    
    return false;
  } catch (error: any) {
    // Log more details in development for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('AniList API key test error details:', {
        status: error.response?.status,
        message: error.response?.errors?.[0]?.message || error.message,
        keyLength: trimmedKey.length,
        keyPrefix: trimmedKey.substring(0, 10) + '...',
      });
    }
    
    // Log as warning since invalid API keys are expected user input errors
    logger.warn('AniList API key validation failed - invalid token provided');
    return false;
  }
}

