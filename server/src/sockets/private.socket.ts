import { Server } from "socket.io"
import { AuthSocket } from "../types/socket.type"
import { Message } from "../models/message.model"
import { emitError } from "./error"
import { Types } from "mongoose"
import { pub } from "../config/redis"
import { createNotification, sendNotification } from "../services/notification.service"
import { getConversationId } from "../utils/conversations";
import { User } from "../models/user.model"

export const registerPrivateHandler = (io: Server, socket: AuthSocket, userId: string) => {
    socket.on("join_private_chat", async ({ targetedUserId }) => {
        try {
            if (userId === targetedUserId) {
                emitError(socket, "CANNOT_CHAT_WITH_SELF", "You cannot start a private chat with yourself.");
                return;
            }

            if (!Types.ObjectId.isValid(targetedUserId)) {
                emitError(socket, "INVALID_USER_ID", "The targeted user ID is invalid.");
                return;
            }

            if (targetedUserId === userId) {
                emitError(socket, "CANNOT_CHAT_WITH_SELF", "You cannot start a private chat with yourself.");
                return;
            }

            const conversationId = getConversationId(userId, targetedUserId);

            socket.join(conversationId);

            const messages = await Message.find({ conversationId, isPrivate: true })
                .populate("sender", "username avatar _id")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar _id" }
                })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();

            const orderedMessages = messages.reverse();

            socket.emit("private_chat_messages", orderedMessages);
        } catch (error) {
            console.error("Error joining private chat:", error);
        }
    });

    socket.on("send_private_message", async ({ targetedUserId, content, attachments, replyTo }) => {
        try {
            if (targetedUserId === userId) {
                emitError(socket, "CANNOT_CHAT_WITH_SELF", "You cannot send a private message to yourself.");
                return;
            }

            if (!Types.ObjectId.isValid(targetedUserId)) {
                emitError(socket, "INVALID_USER", "The targeted user ID is invalid.");
                return;
            }

            if (!content && (!attachments || attachments.length === 0)) {
                emitError(socket, "EMPTY_MESSAGE", "Message content cannot be empty.");
                return;
            }
            if (attachments && attachments.length > 10) {
                emitError(socket, "TOO_MANY_ATTACHMENTS", "A message can have a maximum of 10 attachments.");
                return;
            }

            const conversationId = getConversationId(userId, targetedUserId);

            if (replyTo) {
                const originalMessage = await Message.findById(replyTo);
                if (!originalMessage || originalMessage.conversationId !== conversationId || !originalMessage.isPrivate) {
                    emitError(socket, "INVALID_REPLY", "The message you are replying to does not exist in this conversation.");
                    return;
                }
            }

            const targetedUser = await User.findById(targetedUserId);
            if (!targetedUser) {
                emitError(socket, "USER_NOT_FOUND", "The targeted user does not exist.");
                return;
            }

            const rateLimitKey = `rate_limit:${userId}`;
            const count = await pub.incr(rateLimitKey);

            if (count === 1) {
                await pub.expire(rateLimitKey, 60);
            }

            if (count > 10) {
                emitError(socket, "RATE_LIMIT_EXCEEDED", "Too many messages");
                return;
            }

            const message = await Message.create({
                sender: userId,
                content,
                attachments,
                replyTo: replyTo || null,
                conversationId,
                isPrivate: true,
                deliveredTo: [userId],
                seenBy: [userId]
            });

            const populatedMessage = await Message.findById(message._id)
                .populate("sender", "username avatar _id")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar _id" }
                })
                .lean();

            if (!populatedMessage) return;

            io.to(conversationId).emit("new_private_message", populatedMessage);
            io.to(targetedUserId).socketsJoin(conversationId);

            // fallback in case the other user is not connected to the private chat room
            io.to(targetedUserId).emit("new_private_message", populatedMessage);

            const sockets = await io.in(targetedUserId).fetchSockets();

            const isInConversation = sockets.some((s) => s.rooms.has(conversationId));

            if (!isInConversation) {
                const notification = await createNotification({
                    userId: targetedUserId,
                    type: "PRIVATE_MESSAGE",
                    messageId: populatedMessage._id.toString(),
                    from: userId
                });

                await sendNotification({
                    io,
                    pub,
                    userId: targetedUserId,
                    payload: notification
                });
            }
        } catch (error) {
            console.error("Error sending private message:", error);
        }
    });

    socket.on("private_message_delivered", async ({ messageIds, targetedUserId }) => {
        try {
            if (!Array.isArray(messageIds)) return;
            if (!Types.ObjectId.isValid(targetedUserId)) return;

            const conversationId = getConversationId(userId, targetedUserId);

            await Message.updateMany(
                { _id: { $in: messageIds }, conversationId, isPrivate: true, deliveredTo: { $ne: userId } },
                { $addToSet: { deliveredTo: userId } }
            );

            io.to(conversationId).emit("private_messages_delivered", {
                messageIds,
                userId
            });
        } catch (error) {
            console.error("Error marking private messages as delivered:", error);
        }
    });

    socket.on("private_message_seen", async ({ messageIds, targetedUserId }) => {
        try {
            if (!Array.isArray(messageIds)) return;
            if (!Types.ObjectId.isValid(targetedUserId)) return;

            const conversationId = getConversationId(userId, targetedUserId);

            await Message.updateMany(
                { _id: { $in: messageIds }, conversationId, isPrivate: true, seenBy: { $ne: userId } },
                { $addToSet: { seenBy: userId } }
            );

            io.to(conversationId).emit("private_messages_seen", {
                messageIds,
                userId
            });

        } catch (error) {
            console.error("Error marking private messages as seen:", error);
        }
    });
}