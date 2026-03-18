import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { Message } from "../models/message.model";
import { getGeohash } from "../utils/geohash";
import { userRoomMap } from "../utils/map";

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
            const currentRoom = userRoomMap.get(userId);

            if (currentRoom && currentRoom !== newRoom) {
                socket.leave(currentRoom);
                console.log(`User ${userId} left room ${currentRoom}`);
            }

            if (currentRoom !== newRoom) {
                socket.join(newRoom);
                userRoomMap.set(userId, newRoom);
                console.log(`User ${userId} joined room ${newRoom}`);

                const messages = await Message.find({ geohash: newRoom }).sort({ createdAt: -1 }).limit(50).lean();
                const orderedMessages = messages.reverse();
                socket.emit("room_messages", orderedMessages);
            }
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });

    socket.on("send_message", async ({ content, attachments }) => {
        try {
            const room = userRoomMap.get(userId);

            if (!room) {
                console.error("User is not in a room. Cannot send message.");
                return;
            }

            if (!content && (!attachments || attachments.length === 0)) {
                console.error("Message content or attachments are required.");
                return;
            }

            if (attachments && attachments.length > 10) {
                console.error("Too many attachments. Maximum allowed is 10.");
                return;
            }

            const message = await Message.create({
                sender: userId,
                geohash: room,
                content,
                attachments
            });

            io.to(room).emit("new_message", message);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    socket.on("load_more", async ({ before }) => {
        try {
            const room = userRoomMap.get(userId);
            if (!room) {
                console.error("User is not in a room. Cannot load more messages.");
                return;
            }

            const messages = await Message.find({ geohash: room, createdAt: { $lt: new Date(before) } }).sort({ createdAt: -1 }).limit(50).lean();
            const orderedMessages = messages.reverse();
            socket.emit("more_messages", orderedMessages);
        } catch (error) {
            console.error("Error loading more messages:", error);
        }
    })
}