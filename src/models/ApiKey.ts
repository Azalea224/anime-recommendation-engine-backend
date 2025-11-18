import mongoose, { Schema } from 'mongoose';
import { IApiKey } from '../types/index.js';

const ApiKeySchema = new Schema<IApiKey>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  encryptedKey: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

