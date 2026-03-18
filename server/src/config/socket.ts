import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth";
import { registerChatHandlers } from "../sockets/chat.socket";
import { userSocketMap, userRoomMap } from "../utils/map";
import { AuthSocket } from "../types/socket.type";

export const setupSocket = (io: Server) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket: AuthSocket) => {
        const userId = socket.user?.id;
        console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

        // enforce single session per user
        if (userSocketMap.has(userId!)) {
            const oldSocketId = userSocketMap.get(userId!);
            io.to(oldSocketId!).emit("force_disconnect", "You have been logged in from another device.");
            io.sockets.sockets.get(oldSocketId!)?.disconnect();
        }

        userSocketMap.set(userId!, socket.id);

        registerChatHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
            userSocketMap.delete(userId!);
            const room = userRoomMap.get(userId!);
            if (room) {
                socket.leave(room);
                userRoomMap.delete(userId!);
            }
        });
        
    })
}