import { useEffect } from "react";
import { socket } from "../lib/socket";

type SocketHandlers = Record<string, (...args: any[]) => void>;

export const useSocket = (handlers: SocketHandlers) => {
  useEffect(() => {
    for (const event in handlers) {
      socket.on(event, handlers[event]);
    }

    return () => {
      for (const event in handlers) {
        socket.off(event, handlers[event]);
      }
    };
  }, [handlers]);
};