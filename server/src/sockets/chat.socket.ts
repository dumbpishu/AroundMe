import { Server } from "socket.io";
import { Types } from "mongoose";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { getGeohash } from "../utils/geohash";
import { pub } from "../config/redis";

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {
    const userId = socket.user?.id;

    if (!userId) {
        console.error("User ID not found in socket. Disconnecting...");
        socket.disconnect();
        return;
    }

    socket.on("update_location", async ({ lat, lng }) => {
        try {
            if (!lat || !lng) {
                console.error("Latitude and longitude are required.");
                return;
            }

            const newRoom = getGeohash(lat, lng);
            const currentRoom = await pub.get(`user:${userId}:room`);

            if (currentRoom && currentRoom !== newRoom) {
                socket.leave(currentRoom);

                await pub.srem(`room:${currentRoom}:users`, userId);
                await pub.del(`user:${userId}:room`);

                io.to(currentRoom).emit("user_left", userId);

                console.log(`User ${userId} left room ${currentRoom}`);
            }

            if (currentRoom !== newRoom) {
                socket.join(newRoom);
                
                await pub.set(`user:${userId}:room`, newRoom);
                await pub.sadd(`room:${newRoom}:users`, userId);

                console.log(`User ${userId} joined room ${newRoom}`);

                const userIds = await pub.smembers(`room:${newRoom}:users`);

                io.to(newRoom).emit("room_presence", {
                    count: userIds.length,
                    users: userIds, 
                });

                const messages = await Message.find({ geohash: newRoom }).populate("sender", "username avatar").sort({ createdAt: -1 }).limit(50).lean();
                const orderedMessages = messages.reverse();
                socket.emit("room_messages", orderedMessages);
            }
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });

    socket.on("send_message", async ({ content, attachments }) => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            if (!room) {
                console.error("User is not in a room. Cannot send message.");
                return;
            }

            if (!content && (!attachments || attachments.length === 0)) return;

            if (attachments && attachments.length > 10) return;

            // anti spam: limit message content length
            const rateLimitKey = `rate_limit:${userId}`;
            const count = await pub.incr(rateLimitKey);

            if (count === 1) {
                await pub.expire(rateLimitKey, 10);
            }

            if (count > 10) {
                socket.emit("rate_limited", "Too many messages. Please wait a moment before sending more.");
                return;
            }

            const message = await Message.create({
                sender: userId,
                geohash: room,
                content,
                attachments
            });

            const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar").lean();

            io.to(room).emit("new_message", populatedMessage);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    socket.on("load_more", async ({ before }) => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            if (!room) return;

            const messages = await Message.find({ geohash: room, createdAt: { $lt: new Date(before) } }).populate("sender", "username avatar").sort({ createdAt: -1 }).limit(50).lean();

            const orderedMessages = messages.reverse();

            socket.emit("more_messages", orderedMessages);
        } catch (error) {
            console.error("Error loading more messages:", error);
        }
    });

    socket.on("add_reaction", async ({ messageId, reaction }) => {
        try {
            const userId = socket.user?.id;
            if (!userId) return;

            const message = await Message.findById(messageId);
            if (!message) return;

            if (!message.reactions) {
                message.reactions = new Map();
            }

            const existingUser = message.reactions.get(reaction) || [];

            const alreadyReacted = existingUser.some(id => id.toString() === userId.toString());

            if (alreadyReacted) {
                const updated = existingUser.filter(id => id.toString() !== userId.toString());
                if (updated.length > 0) {
                    message.reactions.set(reaction, updated);
                } else {
                    message.reactions.delete(reaction);
                }
            } else {
                if (!Types.ObjectId.isValid(userId)) return;
                const reactingUserId = new Types.ObjectId(userId);
                message.reactions.set(reaction, [...existingUser, reactingUserId]);
            }

            await message.save();

            const room = await pub.get(`user:${userId}:room`);
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
            const room = await pub.get(`user:${userId}:room`);

            if (room) {
                await pub.srem(`room:${room}:users`, userId);
                await pub.del(`user:${userId}:room`);

                socket.leave(room);

                io.to(room).emit("user_left", userId);
            }
            console.log(`Cleaned up user ${userId}`);
        } catch (error) {
            console.error("Error during disconnect cleanup:", error);
        }
    })
}