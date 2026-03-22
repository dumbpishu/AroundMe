import { AuthSocket } from "../types/socket.type";
import { Server } from "socket.io";

import { registerLocationHandler } from "./location.socket";
import { registerMessageHandler } from "./message.socket";
import { registerNotificationHandler } from "./notification.socket";
import { registerPrivateHandler } from "./private.socket";
import { registerReactionHandler } from "./reaction.socket";
import { registerTypingHandler } from "./typing.socket";

export const registerChatHandlers = (io: Server, socket: AuthSocket) => {
    const userId = socket.user?.id.toString();

    if (!userId) {
        console.error("Unauthorized socket connection");
        socket.disconnect();
        return;
    }

    socket.join(userId);

    console.log(`User ${userId} connected to chat namespace`);

    registerLocationHandler(io, socket, userId);
    registerMessageHandler(io, socket, userId);
    registerNotificationHandler(io, socket, userId);
    registerPrivateHandler(io, socket, userId);
    registerReactionHandler(io, socket, userId);
    registerTypingHandler(io, socket, userId);
}