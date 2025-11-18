import { IAnime } from '../types/index.js';

interface Recommendation {
  animeId: number;
  title: string;
  reason: string;
  matchScore: number;
}

export function generateRecommendations(animeList: IAnime[]): Recommendation[] {
  if (animeList.length === 0) {
    return [];
  }

  // Analyze user preferences
  const genreFrequency: Record<string, number> = {};
  const formatFrequency: Record<string, number> = {};
  let totalScore = 0;
  let scoreCount = 0;

  animeList.forEach((anime) => {
    // Count genres (weighted by score)
    anime.genres.forEach((genre) => {
      genreFrequency[genre] = (genreFrequency[genre] || 0) + (anime.score || 1);
    });

    // Count formats (weighted by score)
    formatFrequency[anime.format] = (formatFrequency[anime.format] || 0) + (anime.score || 1);

    // Calculate average score
    if (anime.score > 0) {
      totalScore += anime.score;
      scoreCount++;
    }
  });

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  // Get top genres and formats
  const topGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  const topFormats = Object.entries(formatFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([format]) => format);

  // Generate recommendations based on preferences
  // This is a simplified algorithm - in production, you might use ML or external APIs
  const recommendations: Recommendation[] = [];

  // Find anime with similar genres but not yet watched
  const watchedAnimeIds = new Set(animeList.map((a) => a.animeId));

  // This is a placeholder - in a real implementation, you'd query a database
  // of all available anime and match based on genres/formats
  // For now, we'll return a simple recommendation structure

  return recommendations;
}

export function analyzePreferences(animeList: IAnime[]): {
  favoriteGenres: string[];
  favoriteFormats: string[];
  averageScore: number;
  totalWatched: number;
} {
  const genreFrequency: Record<string, number> = {};
  const formatFrequency: Record<string, number> = {};
  let totalScore = 0;
  let scoreCount = 0;

  animeList.forEach((anime) => {
    anime.genres.forEach((genre) => {
      genreFrequency[genre] = (genreFrequency[genre] || 0) + 1;
    });

    formatFrequency[anime.format] = (formatFrequency[anime.format] || 0) + 1;

    if (anime.score > 0) {
      totalScore += anime.score;
      scoreCount++;
    }
  });

  const favoriteGenres = Object.entries(genreFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  const favoriteFormats = Object.entries(formatFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([format]) => format);

  return {
    favoriteGenres,
    favoriteFormats,
    averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
    totalWatched: animeList.length,
  };
}

