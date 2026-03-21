import mongoose, { Document } from "mongoose";

export type MediaType = "image" | "audio" | "video";

export interface IAttachment {
  url: string;
  type: MediaType;
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  geohash: string;
  content?: string; 
  attachments?: IAttachment[];
  replyTo?: mongoose.Types.ObjectId | null;
  reactions: Map<string, mongoose.Types.ObjectId[]>;
  mentions: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}