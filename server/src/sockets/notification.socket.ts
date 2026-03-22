import { Server } from "socket.io"
import { AuthSocket } from "../types/socket.type";
import { Notification } from "../models/notification.model";

export const registerNotificationHandler = (io: Server, socket: AuthSocket, userId: string) => {
    socket.on("get_notifications", async ({ page = 1 }) => {
        try {
            const limit = 20;
            const skip = (page - 1) * limit;
            
            const [notifications, unreadCount] = await Promise.all([
                Notification.find({ user: userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("from", "username avatar _id")
                    .populate("message", "content sender")
                    .lean(),
                Notification.countDocuments({ user: userId, isRead: false })
            ]);

            socket.emit("notifications", {
                notifications,
                unreadCount,
                currentPage: page
            });
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    });

    socket.on("mark_notification_read", async ({ notificationIds }) => {
        try {
            if (!Array.isArray(notificationIds)) return;
            await Notification.updateMany({ _id: { $in: notificationIds }, user: userId }, { isRead: true });  

            socket.emit("notifications_marked_read", notificationIds);
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    });

}