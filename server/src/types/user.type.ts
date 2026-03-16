import { Model, Document } from "mongoose";

export interface IUser {
  name?: string;
  email: string;
  username?: string;
  avatar?: string;
  isVerified: boolean;
  isOnline: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = IUser & Document;

export type UserModel = Model<IUser>;