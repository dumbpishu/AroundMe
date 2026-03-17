import { Server } from 'socket.io';
import { Message } from '../models/message.model';
import { getGeohash } from '../utils/geohash';
import { AuthSocket } from '../types/socket.type';

const userRooms = new Map<string, string>();

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {

    socket.on("update_location", async ({ lat, lng }) => {

        const newRoom = getGeohash(lat, lng);
        const currentRoom = userRooms.get(socket.id);

        // leave old room if exists and different from new room
        if (currentRoom && currentRoom != newRoom) {
            socket.leave(currentRoom);
            console.log(`User ${socket.user?.email} left room ${currentRoom}`);
        }

        // join new room
        if (currentRoom !== newRoom) {
            socket.join(newRoom);
            userRooms.set(socket.id, newRoom);

            const messages = await Message.find({ geohash: newRoom }).sort({ createdAt: -1 }).limit(50).populate("sender", "email");
            socket.emit("room_history", messages.reverse());
            console.log(`User ${socket.user?.email} joined room ${newRoom}`);
        }
    });

    socket.on("send_message", async ({ type, content }) => {
        try {
            const room = userRooms.get(socket.id);
            if (!room) {
                console.warn(`User ${socket.user?.email} tried to send message without a room`);
                return;
            }

            const message = await Message.create({
                sender: socket.user!.id,
                geohash: room,
                type,
                content,
            });

            io.to(room).emit("new_message", {
                id: message._id,
                user: socket.user,
                type: message.type,
                content: message.content,
                time: message.createdAt,
            })
        } catch (error) {
            console.error(`Error creating message for user ${socket.user?.email}:`, error);
        }
    });

    socket.on("disconnect", () => {
        userRooms.delete(socket.id);
    });
}