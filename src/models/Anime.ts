import mongoose, { Schema } from 'mongoose';
import { IAnime } from '../types/index.js';

const AnimeSchema = new Schema<IAnime>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  animeId: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  status: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalEpisodes: {
    type: Number,
    default: 0,
  },
  format: {
    type: String,
    required: true,
  },
  genres: {
    type: [String],
    default: [],
  },
  tags: {
    type: [String],
    default: [],
  },
  coverImage: {
    type: String,
    required: true,
  },
  bannerImage: {
    type: String,
  },
  syncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for userId and animeId to ensure uniqueness
AnimeSchema.index({ userId: 1, animeId: 1 }, { unique: true });

export const Anime = mongoose.model<IAnime>('Anime', AnimeSchema);

