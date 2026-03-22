import { Server } from "socket.io";
import { Types } from "mongoose";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Notification } from "../models/notification.model";
import { getGeohash } from "../utils/geohash";
import { pub } from "../config/redis";
import { emitError } from "./error";
import { getConversationId } from "../utils/conversations";
import { createNotification, sendNotification } from "../services/notification.service";

const extractMentions = (text?: string) => {
  if (!text) return [];
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1));
};

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {
    const userId = socket.user?.id?.toString();
    
    if (!userId) {
        console.error("Unauthorized socket connection");
        socket.disconnect();
        return;
    }

    socket.join(userId);

    socket.on("update_location", async ({ latitude, longitude }) => {
        try {
            if (!latitude || !longitude) return;

            const newRoom = getGeohash(latitude, longitude);
            const currentRoom = await pub.get(`user:${userId}:room`);

            if (!newRoom) return;

            if (newRoom === currentRoom) return;

            if (currentRoom && currentRoom !== newRoom) {  
                await pub.hset(`room:${currentRoom}:last_seen`, userId, Date.now());     
                socket.leave(currentRoom);

                await pub.srem(`room:${currentRoom}:users`, userId);
                await pub.del(`user:${userId}:room`);

                const userIds = await pub.smembers(`room:${currentRoom}:users`);
                const lastSeenMap = await pub.hgetall(`room:${currentRoom}:last_seen`);

                io.to(currentRoom).emit("room_presence", {
                    count: userIds.length,
                    users: userIds,
                    lastSeen: lastSeenMap
                });
            }  
            
            socket.join(newRoom);

            await pub.set(`user:${userId}:room`, newRoom);
            await pub.sadd(`room:${newRoom}:users`, userId);
            await pub.hdel(`room:${newRoom}:last_seen`, userId);

            const userIds = await pub.smembers(`room:${newRoom}:users`);

            const lastSeenMap = await pub.hgetall(`room:${newRoom}:last_seen`);

            io.to(newRoom).emit("room_presence", {
                count: userIds.length,
                users: userIds,
                lastSeen: lastSeenMap
            });

            const messages = await Message.find({ geohash: newRoom })
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

            socket.emit("room_messages", orderedMessages);
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });

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

    socket.on("add_reaction", async ({ messageId, reaction }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) {
                emitError(socket, "MESSAGE_NOT_FOUND", "Message not found.");
                return;
            }

            if (!message.reactions) {
                message.reactions = new Map();
            }

            const existingUsers = message.reactions.get(reaction) || [];

            const alreadyReacted = existingUsers.some((id) => id.toString() === userId);

            if (alreadyReacted) {
                const updated = existingUsers.filter((id) => id.toString() !== userId);
                if (updated.length > 0) {
                    message.reactions.set(reaction, updated);
                } else {
                    message.reactions.delete(reaction);
                }
            } else {
                if (!Types.ObjectId.isValid(userId)) return;
                const reactingUserId = new Types.ObjectId(userId);
                message.reactions.set(reaction, [...existingUsers, reactingUserId]);
            }

            const room = await pub.get(`user:${userId}:room`);

            if (!room || message.geohash !== room) {
                emitError(socket, "FORBIDDEN", "You are not in a room. Please update your location.");
                return;
            }

            await message.save();

            if (message.sender.toString() !== userId) {
                const notification = await createNotification({
                    userId: message.sender.toString(),
                    type: "REACTION",
                    messageId: message._id.toString(),
                    from: userId
                });

                await sendNotification({
                    io,
                    pub,
                    userId: message.sender.toString(),
                    payload: notification
                });
            }

            io.to(room).emit("reaction_updated", {
                messageId,
                reactions: Object.fromEntries(message.reactions)
            });
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    });

    socket.on("start_typing", async () => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            socket.to(room).emit("user_typing", userId);

            if (!(socket as any)._typingTimeout) {
                (socket as any)._typingTimeout = setTimeout(() => {
                    socket.to(room).emit("user_stopped_typing", userId);
                    (socket as any)._typingTimeout = null;
                }, 3000);
            }
        } catch (error) {
            console.error("Error starting typing indicator:", error);
        }
    });

    socket.on("stop_typing", async () => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            socket.to(room).emit("user_stopped_typing", userId);
        } catch (error) {
            console.error("Error stopping typing indicator:", error);
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

    // now for private messaging
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
