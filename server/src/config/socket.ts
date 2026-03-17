import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth";
import { registerChatHandlers } from "../sockets/chat.socket";

export const configureSocket = (io: Server) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        const user = (socket as any).user;
        console.log(`User connected: ${user.email} (${socket.id})`);

        registerChatHandlers(io, socket);
        
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${user.email} (${socket.id})`);
        });
    })
}