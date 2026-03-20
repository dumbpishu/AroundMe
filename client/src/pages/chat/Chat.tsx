import { useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useLocation } from "../../hooks/useLocation";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../lib/socket";

type ChatMessage = {
  _id?: string;
  content?: string;
  createdAt?: string;
  sender?: { username?: string };
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  const { user } = useAuth();
  const endRef = useRef<HTMLDivElement | null>(null);

  // ✅ location tracking
  useLocation(setError);

  // ✅ socket lifecycle
  useEffect(() => {
    socket.connect();

    const onConnect = () => setError("");
    const onDisconnect = () => setIsReady(false);
    const onReconnectFailed = () =>
      setError("Connection lost. Refresh.");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect_failed", onReconnectFailed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect_failed", onReconnectFailed);

      socket.disconnect();
    };
  }, []);

  // ✅ handlers
  const handlers = useMemo(
    () => ({
      room_messages: (data: ChatMessage[]) => {
        setMessages(data);
        setIsReady(true);
      },

      new_message: (msg: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      },

      error: (err: string) => {
        setError(err);
      },
    }),
    []
  );

  useSocket(handlers);

  // ✅ auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ send message
  const sendMessage = () => {
    if (!input.trim()) return;
    if (!socket.connected) {
      setError("Not connected");
      return;
    }

    const payload = { content: input };

    socket.emit(
      "send_message",
      payload,
      (ack: { success: boolean }) => {
        if (!ack?.success) {
          setError("Message failed");
        }
      }
    );

    setInput("");
  };

  return (
    <div>
      {error && <p>{error}</p>}

      <div>
        {messages.map((m, i) => (
          <div key={m._id || i}>
            <b>{m.sender?.username}</b>: {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={sendMessage} disabled={!isReady}>
        Send
      </button>
    </div>
  );
};