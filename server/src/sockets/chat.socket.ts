import { Server } from "socket.io";
import { Types } from "mongoose";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { getGeohash } from "../utils/geohash";
import { pub } from "../config/redis";
import { emitError } from "./error";

const extractMentions = (text?: string) => {
  if (!text) return [];
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1));
};

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {
    const userId = socket.user?.id;
    
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

            if (newRoom === currentRoom) return;

            if (currentRoom && currentRoom !== newRoom) {
                socket.leave(currentRoom);

                await pub.srem(`room:${currentRoom}:users`, userId);
                await pub.del(`user:${userId}:room`);

                io.to(currentRoom).emit("user_left", userId);
            }  
            
            socket.join(newRoom);

            await pub.set(`user:${userId}:room`, newRoom);
            await pub.sadd(`room:${newRoom}:users`, userId);

            const userIds = await pub.smembers(`room:${newRoom}:users`);

            io.to(newRoom).emit("room_presence", {
                count: userIds.length,
                users: userIds
            });

            const messages = await Message.find({ geohash: newRoom })
                .populate("sender", "username")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username" }
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
            const room = await pub.get(`user:${userId}:rooms`);
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
                mentions: mentionedUserIds || []
            });

            const populatedMessage = await Message.findById(messages._id)
                .populate("sender", "username avatar")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar" }
                })
                .lean();

            io.to(room).emit("new_message", populatedMessage);

            mentionedUserIds.forEach((id) => {
                io.to(id.toString()).emit("mentioned", {
                    message: populatedMessage,
                    room
                });
            });

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

            if (message.sender.toString() !== userId.toString()) {
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

            if (!room) return;

            io.to(room).emit("message_edited", {
                messageId,
                content: newContent,
                isEdited: true,
                editedAt: message.editedAt
            });

            const added = newMentionedUserIds.filter((id) => !oldMentions.includes(id.toString()));

            added.forEach((id) => {
                io.to(id.toString()).emit("mentioned", {
                    message: newContent,
                    room
                })
            })
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
                .populate("sender", "username")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar" }
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
            const userId = socket.user?.id;
            if (!userId) return;

            const message = await Message.findById(messageId);
            if (!message) {
                emitError(socket, "MESSAGE_NOT_FOUND", "Message not found.");
                return;
            }

            if (!message.reactions) {
                message.reactions = new Map();
            }

            const existingUsers = message.reactions.get(reaction) || [];

            const alreadyReacted = existingUsers.some((id) => id.toString() === userId.toString());

            if (alreadyReacted) {
                const updated = existingUsers.filter((id) => id.toString() !== userId.toString());
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

            await message.save();

            const room = await pub.get(`user:${userId}:rooms`);

            if (!room) return;

            io.to(room).emit("reaction_updated", {
                messageId,
                reactions: Object.fromEntries(message.reactions)
            });
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    });

    socket.on("disconnect", async () => {
        try {
            const room = await pub.get(`user:${userId}:rooms`);

            if (room) {
                socket.leave(room);
                await pub.srem(`room:${room}:users`, userId);
                await pub.del(`user:${userId}:room`);

                const userIds = await pub.smembers(`room:${room}:users`);

                io.to(room).emit("room_presence", {
                    count: userIds.length,
                    users: userIds
                });
            }

            console.log(`User ${userId} disconnected.`);
        } catch (error) {
            console.error("Error on disconnect:", error);
        }
    })
}
