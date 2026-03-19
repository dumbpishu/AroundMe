import mongoose from "mongoose";
import { IUser, UserModel } from "../types/user.type";

const userSchema = new mongoose.Schema<IUser, UserModel>(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 5,
      maxlength: 255
    },
    username: {
      type: String,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    avatar: {
      type: String,
      trim: true
    },
    avatarPublicId: {
      type: String,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser, UserModel>("User", userSchema);