import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth";

export const configureSocket = (io: Server) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        const user = (socket as any).user;
        console.log(`User connected: ${user.email} (${socket.id})`);

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${user.email} (${socket.id})`);
        });
    })
}