import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth";
import { registerChatHandlers } from "../sockets/chat.socket";
import { AuthSocket } from "../types/socket.type";
import { createAdapter } from "@socket.io/redis-adapter";
import { pub, sub } from "./redis";

export const configureSocket = (io: Server) => {
    io.adapter(createAdapter(pub, sub));

    io.use(socketAuthMiddleware);

    io.on("connection", async (socket: AuthSocket) => {
        const userId = socket.user?.id;
        if (!userId) {
            console.error(`Socket ${socket.id} connected without authenticated user id.`);
            socket.disconnect(true);
            return;
        }

        console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

        const existingSocketId = await pub.get(`user:${userId}:socket`);

        if (existingSocketId && existingSocketId !== socket.id) {
            console.log("Kicking out existing socket:", existingSocketId);

            io.to(existingSocketId).emit("force_disconnect", "You have been logged in from another device.");

            io.of("/").sockets.get(existingSocketId)?.disconnect(true);
        }

        await pub.set(`user:${userId}:socket`, socket.id);
        await pub.set(`socket:${socket.id}:user`, userId);

        registerChatHandlers(io, socket);

        socket.on("disconnect", async () => {
            console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);

            const storedUserId = await pub.get(`socket:${socket.id}:user`);

            if (storedUserId === userId) {
                await pub.del(`user:${userId}:socket`);
            }
            await pub.del(`socket:${socket.id}:user`);
        })
        
    })
}