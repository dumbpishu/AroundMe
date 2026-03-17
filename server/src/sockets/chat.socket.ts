import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { getGeohash } from "../utils/geohash";

const userRooms = new Map<string, string>();

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {
    socket.on("update_location", async ({ lat, lng }) => {
        try {
            const newRoom = getGeohash(lat, lng);
            const currentRoom = userRooms.get(socket.id);

            if (currentRoom && currentRoom !== newRoom) {
                socket.leave(currentRoom);
                console.log(`User ${socket.user?.email} left room ${currentRoom}`);
            }

            if (currentRoom !== newRoom) {
                socket.join(newRoom);
                userRooms.set(socket.id, newRoom);
                console.log(`User ${socket.user?.email} joined room ${newRoom}`);

                const messages = await Message.find({ geohash: newRoom }).sort({ createdAt: -1 }).limit(50).lean();
                const orderedMessages = messages.reverse();

                socket.emit("chat_history", orderedMessages.map(msg => ({
                    id: msg._id,
                    user: msg.sender,
                    content: msg.content,
                    attachments: msg.attachments,
                    time: msg.createdAt
                })))
            }
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });

    socket.on("send_message", async ({ content, attachments }) => {
        try {
            const room = userRooms.get(socket.id);

            if (!room) {
                throw new Error("User is not in a room. Please update location first.");
            }

            if (!content && (!attachments || attachments.length === 0)) {
                throw new Error("Message must have content or at least one attachment.");
            }

            if (attachments && attachments.length > 10) {
                throw new Error("A message can have a maximum of 10 attachments.");
            }

            const message = await Message.create({
                sender: socket.user!.id,
                geohash: room,
                content,
                attachments
            });

            io.to(room).emit("new_message", {
                id: message._id,
                user: message.sender,
                content: message.content,
                attachments: message.attachments,
                time: message.createdAt
            })
        } catch (error) {
            console.error("Error sending message:", error);
        }

        // pagination
        socket.on("load_more", async ({ before }) => {
            try {
                const room = userRooms.get(socket.id);

                if (!room) {
                    throw new Error("User is not in a room. Please update location first.");
                }

                const messages = await Message.find({ geohash: room, createdAt: { $lt: new Date(before) } }).sort({ createdAt: -1 }).limit(50).lean();

                const orderedMessages = messages.reverse();

                socket.emit("more_messages", orderedMessages.map(msg => ({
                    id: msg._id,
                    user: msg.sender,
                    content: msg.content,
                    attachments: msg.attachments,
                    time: msg.createdAt
                })));
            } catch (error) {
                console.error("Error loading more messages:", error);
            }
        });

        socket.on("disconnect", () => {
            userRooms.delete(socket.id);
        });
    });
}