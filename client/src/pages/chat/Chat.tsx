import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../store/chat.store";
import { useSocketStore } from "../../store/socket.store";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useLocation } from "../../hooks/useLocation";
import { useAuthStore } from "../../store/auth.store";

export const Chat = () => {
  const messages = useChatStore((s) => s.messages);
  const socket = useSocketStore((s) => s.socket);
  const user = useAuthStore((s) => s.user);

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔥 attach socket listeners
  useChatSocket();

  // 🔥 join room via location
  useLocation();

  // 🔥 auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 send message
  const sendMessage = () => {
    if (!text.trim()) return;

    socket?.emit("send_message", {
      content: text,
    });

    setText("");
  };

  // 🔥 send reaction
  const handleReaction = (messageId: string, reaction: string) => {
    socket?.emit("add_reaction", {
      messageId,
      reaction,
    });
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* 🔹 Header */}
      <div className="p-4 border-b font-semibold">
        GeoChat
      </div>

      {/* 🔹 Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender?._id === user?._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-xs">

                {/* Message bubble */}
                <div
                  className={`p-2 rounded-lg ${
                    isMe
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-semibold">
                      {msg.sender.username}
                    </div>
                  )}

                  <div>{msg.content}</div>
                </div>

                {/* 🔥 Reactions display */}
                {msg.reactions && (
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {Object.entries(msg.reactions).map(
                      ([emoji, users]) => {
                        const reacted = users.includes(user?._id || "");

                        return (
                          <button
                            key={emoji}
                            onClick={() =>
                              handleReaction(msg._id, emoji)
                            }
                            className={`text-sm px-2 py-1 rounded ${
                              reacted
                                ? "bg-blue-200"
                                : "bg-gray-100"
                            }`}
                          >
                            {emoji} {users.length}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {/* 🔥 Add reaction buttons */}
                <div className="flex gap-2 mt-1">
                  {["👍", "❤️", "😂"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() =>
                        handleReaction(msg._id, emoji)
                      }
                      className="text-sm opacity-70 hover:opacity-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* 🔹 Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Type message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};