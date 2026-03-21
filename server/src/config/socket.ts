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
        try {
            const userId = socket.user?.id?.toString();
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
    
                const oldSocket = io.of("/").sockets.get(existingSocketId);
                if (oldSocket) {
                    oldSocket.disconnect(true);
                }
            }
    
            const ONE_DAY = 86400;
    
            await pub.set(`user:${userId}:socket`, socket.id, "EX", ONE_DAY);
            await pub.set(`socket:${socket.id}:user`, userId, "EX", ONE_DAY);

            await pub.sadd("online_users", userId);
    
            registerChatHandlers(io, socket);
    
            socket.on("disconnect", async () => {
                try {
                    console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
        
                    const room = await pub.get(`user:${userId}:room`);
        
                    if (room && typeof room === "string") {
                        await pub.hset(`room:${room}:last_seen`, userId, Date.now());
    
                        socket.leave(room);
    
                        await pub.srem(`room:${room}:users`, userId);
                        await pub.del(`user:${userId}:room`);
        
                        const userIds = await pub.smembers(`room:${room}:users`);
                        const lastSeenMap = await pub.hgetall(`room:${room}:last_seen`);
        
                        io.to(room).emit("room_presence", {
                            count: userIds.length,
                            users: userIds,
                            lastSeen: lastSeenMap
                        });
                    }
        
                    const storedUserId = await pub.get(`socket:${socket.id}:user`);
        
                    if (storedUserId && storedUserId === userId) {
                        await pub.del(`user:${userId}:socket`);
                    }
                    await pub.del(`socket:${socket.id}:user`);
                    await pub.srem("online_users", userId);
                } catch (error) {
                    console.error("Error handling disconnect:", error);
                }
            })
        } catch (error) {
            console.error("Error handling connection:", error);
        }
    })
}