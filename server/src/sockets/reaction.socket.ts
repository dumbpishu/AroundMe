import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { emitError } from "./error";
import { Types } from "mongoose";
import { pub } from "../config/redis";
import { createNotification, sendNotification } from "../services/notification.service";

export const registerReactionHandler = (io: Server, socket: AuthSocket, userId: string) => {
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
}