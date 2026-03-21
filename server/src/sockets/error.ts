import { AuthSocket } from "../types/socket.type";

export const emitError = (socket: AuthSocket, code: string, message: string) => {
    socket.emit("error", { code, message });
}