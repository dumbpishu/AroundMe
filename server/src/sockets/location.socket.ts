import { Server } from "socket.io";
import { AuthSocket } from "../types/socket.type";
import { getGeohash } from "../utils/geohash";
import { pub } from "../config/redis";
import { Message } from "../models/message.model";

export const registerLocationHandler = (io: Server, socket: AuthSocket, userId: string) => {

    socket.on("update_location", async ({ latitude, longitude }) => {
        try {
            if (!latitude || !longitude) return;

            const newRoom = getGeohash(latitude, longitude);
            const currentRoom = await pub.get(`user:${userId}:room`);

            if (!newRoom) return;

            if (newRoom === currentRoom) return;

            if (currentRoom && currentRoom !== newRoom) {  
                await pub.hset(`room:${currentRoom}:last_seen`, userId, Date.now());     
                socket.leave(currentRoom);

                await pub.srem(`room:${currentRoom}:users`, userId);
                await pub.del(`user:${userId}:room`);

                const userIds = await pub.smembers(`room:${currentRoom}:users`);
                const lastSeenMap = await pub.hgetall(`room:${currentRoom}:last_seen`);

                io.to(currentRoom).emit("room_presence", {
                    count: userIds.length,
                    users: userIds,
                    lastSeen: lastSeenMap
                });
            }  
            
            socket.join(newRoom);

            await pub.set(`user:${userId}:room`, newRoom);
            await pub.sadd(`room:${newRoom}:users`, userId);
            await pub.hdel(`room:${newRoom}:last_seen`, userId);

            const userIds = await pub.smembers(`room:${newRoom}:users`);

            const lastSeenMap = await pub.hgetall(`room:${newRoom}:last_seen`);

            io.to(newRoom).emit("room_presence", {
                count: userIds.length,
                users: userIds,
                lastSeen: lastSeenMap
            });

            const messages = await Message.find({ geohash: newRoom })
                .populate("sender", "username avatar _id")
                .populate({
                    path: "replyTo",
                    select: "content sender",
                    populate: { path: "sender", select: "username avatar _id" }
                })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();

            const orderedMessages = messages.reverse();

            socket.emit("room_messages", orderedMessages);
        } catch (error) {
            console.error("Error updating location:", error);
        }
    });
}