import mongoose from "mongoose";
import { INotification } from "../types/notification.type";

const notificationSchema = new mongoose.Schema<INotification>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["MENTION", "PRIVATE_MESSAGE", "REACTION", "SYSTEM"],
            required: true
        },
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message"
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }, { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);