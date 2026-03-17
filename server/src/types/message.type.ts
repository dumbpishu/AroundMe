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
  createdAt: Date;
  updatedAt: Date;
}