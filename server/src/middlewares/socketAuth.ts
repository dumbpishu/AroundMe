import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { AuthSocket } from "../types/socket.type";

export const socketAuthMiddleware = (socket: AuthSocket, next: (err?: Error) => void) => {
    try {
        const token = cookie.parse(socket.handshake.headers.cookie || "").token;

        if (!token) {
            throw new Error("Authentication Error.");
        }

        const decoded = jwt.verify(token, process.env.AUTH_SECRET as string);

        socket.user = decoded as { id: string; email: string };
        next();
    } catch (error) {
        next(new Error("Socket Authentication Failed."));
    }
}