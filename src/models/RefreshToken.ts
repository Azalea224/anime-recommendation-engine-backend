import mongoose, { Schema } from 'mongoose';
import { IRefreshToken } from '../types/index.js';

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0, // TTL index - automatically delete expired tokens
  },
}, {
  timestamps: true,
});

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

