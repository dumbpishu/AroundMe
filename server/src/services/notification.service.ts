import { Notification } from "../models/notification.model";
import { INotification, NotificationType } from "../types/notification.type";

export const createNotification = async ({ userId, type, messageId, from }: { userId: string; type: NotificationType; messageId: string; from: string }) => {
    const notification = await Notification.create({
        user: userId,
        type,
        message: messageId,
        from,
        isRead: false
    });
    return notification;
};

export const sendNotification = async ({ io, pub, userId, payload }: any) => {
    const isOnline = await pub.sismember("online_users", userId);

    if (isOnline) {
        io.to(userId).emit("notification", payload);
    }
}