import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import { useChatStore } from "../store/chat.store";


export const useChatSocket = () => {
  const socket = useSocketStore((s) => s.socket);

  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateReaction = useChatStore((s) => s.updateReaction);

  useEffect(() => {
    if (!socket) return;
  
    // initial messages for the room
    socket.on("room_messages", (messages) => {
      setMessages(messages);
    });

    // new message from server
    socket.on("new_message", (message) => {
      addMessage(message);
    });

    socket.on("reaction_updated", ({ messageId, reactions }) => {
      updateReaction(messageId, reactions);
    });

    return () => {
      socket.off("room_messages");
      socket.off("new_message");
      socket.off("update_reaction");
    };
  }, [socket]);
};