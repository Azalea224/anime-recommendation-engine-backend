import mongoose, { Schema } from 'mongoose';
import { IUser, OAuthProvider } from '../types/index.js';

const OAuthProviderSchema = new Schema<OAuthProvider>({
  provider: {
    type: String,
    enum: ['google', 'github'],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  passwordHash: {
    type: String,
    required: function(this: IUser) {
      // Password is required if no OAuth providers
      return this.oauthProviders.length === 0;
    },
  },
  oauthProviders: {
    type: [OAuthProviderSchema],
    default: [],
  },
}, {
  timestamps: true,
});

export const User = mongoose.model<IUser>('User', UserSchema);

