import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { pub } from "../config/redis";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { sendNotification, createNotification } from "../services/notification.service";
import { Types } from "mongoose";
import { emitError } from "./error";

const extractMentions = (text?: string) => {
  if (!text) return [];
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1));
};

export const registerMessageHandler = (io: Server, socket: AuthSocket, userId: string) => {
    socket.on("send_message", async ({ content, attachments, replyTo }) => {
        try {
            const room = await pub.get(`user:${userId}:room`);
            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            if (!content && (!attachments || attachments.length === 0)) return;
            if (attachments && attachments.length > 10) return;

            const rateLimitKey = `rate_limit:${userId}`;
            const count = await pub.incr(rateLimitKey);

            if (count === 1) {
                await pub.expire(rateLimitKey, 60);
            }

            if (count > 10) {
                emitError(socket, "RATE_LIMIT_EXCEEDED", "You are sending messages too quickly. Please wait a moment.");
                return;
            }

            const usernames = extractMentions(content);

            let mentionedUserIds: Types.ObjectId[] = [];

            if (usernames.length > 0) {
                const users = await User.find({ username: { $in: usernames } }, "_id").lean();
                mentionedUserIds = users.map((u) => u._id);
            }

            const messages = await Message.create({
                sender: userId,
                geohash: room,
                content,
                attachments,
                replyTo: replyTo || null,
                mentions: mentionedUserIds,
                deliveredTo: [userId],
                seenBy: [userId]
            });

            const populatedMessage = await Message.findById(messages._id)
                .populate("sender", "username avatar _id")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar _id" }
                })
                .lean();

            if (!populatedMessage) return;

            io.to(room).emit("new_message", populatedMessage);

            const usersInRoom = await pub.smembers(`room:${room}:users`);

            const otherUsers = usersInRoom.filter((id) => id !== userId);

            if (otherUsers.length > 0 && populatedMessage) {
                await Message.updateOne(
                    { _id: populatedMessage._id },
                    { $addToSet: { deliveredTo: { $each: otherUsers } } }
                );
            }

            for (const id of mentionedUserIds) {
                const targetUserId = id.toString();
                if (targetUserId === userId) continue;

                const notification = await createNotification({
                    userId: targetUserId,
                    type: "MENTION",
                    messageId: populatedMessage._id.toString(),
                    from: userId
                });

                await sendNotification({
                    io,
                    pub,
                    userId: targetUserId,
                    payload: notification
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    socket.on("edit_message", async ({ messageId, newContent }) => {
        try {
            const message = await Message.findById(messageId);

            if (!message) {
                emitError(socket, "MESSAGE_NOT_FOUND", "Message not found.");
                return;
            }

            if (message.sender.toString() !== userId) {
                emitError(socket, "FORBIDDEN", "You can only edit your own messages.");
                return;
            }

            const oldMentions = message.mentions.map((id) => id.toString());
            const usernames = extractMentions(newContent);

            let newMentionedUserIds: Types.ObjectId[] = [];

            if (usernames.length > 0) {
                const users = await User.find({ username: { $in: usernames } }, "_id").lean();
                newMentionedUserIds = users.map((u) => u._id);
            }

            message.content = newContent;
            message.mentions = newMentionedUserIds;
            message.isEdited = true;
            message.editedAt = new Date();

            await message.save();

            const room = await pub.get(`user:${userId}:room`);

            if (!room || message.geohash !== room) {
                emitError(socket, "FORBIDDEN", "You are not in a room. Please update your location.");
                return;
            }

            io.to(room).emit("message_edited", {
                messageId,
                content: newContent,
                isEdited: true,
                editedAt: message.editedAt
            });

            const added = newMentionedUserIds.filter((id) => !oldMentions.includes(id.toString()));

            for (const id of added) {
                const targetUserId = id.toString();
                if (targetUserId === userId) continue;

                const notification = await createNotification({
                    userId: targetUserId,
                    type: "MENTION",
                    messageId: message._id.toString(),
                    from: userId
                });

                await sendNotification({
                    io,
                    pub,
                    userId: targetUserId,
                    payload: notification
                });
                }
        } catch (error) {
            console.error("Error editing message:", error);
        }
    });

    socket.on("load_more", async ({ before }) => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            const messages = await Message.find({ geohash: room, createdAt: { $lt: new Date(before) } })
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

            socket.emit("older_messages", orderedMessages);
        } catch (error) {
            console.error("Error loading more messages:", error);
        }
    });

    socket.on("message_delivered", async ({ messageIds }) => {
        try {
            if (!Array.isArray(messageIds)) return;

            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            await Message.updateMany(
                { _id: { $in: messageIds }, geohash: room, deliveredTo: { $ne: userId } },
                { $addToSet: { deliveredTo: userId } }
            );

            io.to(room).emit("messages_delivered", {
                messageIds,
                userId
            });
        } catch (error) {
            console.error("Error marking messages as delivered:", error);
        }
    });

    socket.on("message_seen", async ({ messageIds }) => {
        try {
            if (!Array.isArray(messageIds)) return;

            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            await Message.updateMany(
                { _id: { $in: messageIds }, geohash: room, seenBy: { $ne: userId } },
                { $addToSet: { seenBy: userId } }
            );

            io.to(room).emit("messages_seen", {
                messageIds,
                userId
            });
        } catch (error) {
            console.error("Error marking messages as seen:", error);
        }
    });
}