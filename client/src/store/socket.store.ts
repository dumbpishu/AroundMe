import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth.store";

type SocketState = {
    socket: Socket | null;
    connected: boolean;

    connect: () => void;
    disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    connected: false,

    connect: () => {
        const existingSocket = get().socket;
        const { user } = useAuthStore.getState();

        if (existingSocket || !user) return;

        const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
            withCredentials: true,
        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
            set({ connected: true });
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
            set({ connected: false });
        });

        set({ socket: newSocket });
    },

    disconnect: () => {
        const { socket } = get();

        if (!socket) return;

        socket.removeAllListeners();
        socket.disconnect();
        set({ socket: null, connected: false });
    }
}))