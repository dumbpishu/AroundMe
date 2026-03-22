import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import { useChatStore } from "../store/chat.store";


export const useChatSocket = () => {
  const socket = useSocketStore((s) => s.socket);

  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateReaction = useChatStore((s) => s.updateReaction);
  const setTyping = useChatStore((s) => s.setTyping);
  const removeTyping = useChatStore((s) => s.removeTyping);

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

    socket.on("user_typing", ({ userId, username }) => {
      setTyping({ userId, username });
    });

    socket.on("user_stopped_typing", (userId) => {
      removeTyping(userId);
    });

    return () => {
      socket.off("room_messages");
      socket.off("new_message");
      socket.off("update_reaction");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [socket]);
};