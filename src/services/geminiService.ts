import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnv } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { IAnime } from '../types/index.js';

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const { GOOGLE_GEMINI_API_KEY } = getEnv();
    
    if (!GOOGLE_GEMINI_API_KEY || GOOGLE_GEMINI_API_KEY.trim().length === 0) {
      throw new Error('Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in your environment variables.');
    }
    
    genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
  }
  return genAI;
}

function buildSystemPrompt(animeList: IAnime[]): string {
  const watchedAnime = animeList
    .filter((anime) => ['COMPLETED', 'CURRENT', 'PAUSED', 'DROPPED'].includes(anime.status))
    .map((anime) => `- ${anime.title} (Score: ${anime.score}/10, Status: ${anime.status})`)
    .join('\n');

  const favoriteGenres = animeList
    .filter((anime) => anime.score >= 7)
    .flatMap((anime) => anime.genres)
    .reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topGenres = Object.entries(favoriteGenres)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)
    .join(', ');

  return `You are an anime recommendation chatbot. The user has watched the following anime:

${watchedAnime || 'No anime watched yet.'}

User's favorite genres: ${topGenres || 'Not yet determined'}

Provide helpful, personalized anime recommendations based on the user's watch history and preferences. Be conversational, friendly, and specific about why you're recommending each anime. If the user asks questions about anime, answer them knowledgeably.`;
}

export async function generateChatResponse(
  message: string,
  animeList: IAnime[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const client = getGeminiClient();
    // Use gemini-2.5-flash (latest fast model)
    // Alternatives: gemini-1.5-pro, gemini-1.5-flash
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = buildSystemPrompt(animeList);
    
    // Build conversation history
    const history = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'ll help you discover great anime based on your preferences!' }],
        },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error: any) {
    logger.error('Gemini API error:', error);
    
    // Check if API key is missing
    if (error.message?.includes('API key is not configured') || !getEnv().GOOGLE_GEMINI_API_KEY) {
      throw new Error('Google Gemini API key is not configured. Please set GOOGLE_GEMINI_API_KEY in your backend environment variables.');
    }
    
    // Check for invalid API key
    if (error.message?.includes('API key') || error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('Invalid Google Gemini API key. Please check that your API key is correct and has the necessary permissions.');
    }
    
    // Check for rate limits
    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.');
    }

    // Check for model not found
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      throw new Error('Gemini model not found. Please check if the model name is correct or if your API key has access to this model.');
    }

    // Generic error
    throw new Error(`Failed to generate response: ${error.message || 'Unknown error'}`);
  }
}

