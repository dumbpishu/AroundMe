import { useEffect } from "react";
import { socket } from "../lib/socket";

export const useScocket = (handlers: { [x: string]: (...args: any[]) => void; }) => {
    useEffect(() => {
        if (!handlers) return;

        // register handlers
        for (const event in handlers) {
            socket.on(event, handlers[event]);
        }

        // cleanup fucntion to remove handlers when component unmounts or handlers change
        return () => {
            for (const event in handlers) {
                socket.off(event, handlers[event]);
            }
        }
    }, [handlers]);
}