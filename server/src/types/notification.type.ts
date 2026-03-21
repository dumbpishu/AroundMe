import { Types } from "mongoose";

export type NotificationType = "MENTION" | "PRIVATE_MESSAGE" | "REACTION" | "SYSTEM";

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  message?: Types.ObjectId;
  from?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}