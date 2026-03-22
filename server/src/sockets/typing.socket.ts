import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { emitError } from "./error";
import { pub } from "../config/redis";

export const registerTypingHandler = (io: Server, socket: AuthSocket, userId: string) => {
    socket.on("start_typing", async () => {
        try {
            const room = await pub.get(`user:${userId}:room`);

            const username = socket.user?.username;

            console.log(`${username} started typing in room ${room}`);

            if (!room) {
                emitError(socket, "NO_ROOM", "You are not in a room. Please update your location.");
                return;
            }

            socket.to(room).emit("user_typing", {
                userId,
                username,
            });

            if ((socket as any)._typingTimeout) {
                clearTimeout((socket as any)._typingTimeout);
            }

            (socket as any)._typingTimeout = setTimeout(() => {
                socket.to(room).emit("user_stopped_typing", userId);
            }, 2000);
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

}