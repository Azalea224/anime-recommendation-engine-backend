import mongoose, { Schema } from 'mongoose';

export interface IChat extends mongoose.Document {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient querying by userId and createdAt
ChatSchema.index({ userId: 1, createdAt: -1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);

