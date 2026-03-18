import { useEffect, useMemo, useState, useRef, } from "react";
import { socket } from "../../lib/socket";
import { useScocket } from "../../hooks/useSocket";

type ChatMessage = {
  createdAt?: string;
  time?: string;
  sender?: string;
  user?: string;
  content: string;
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false); // ✅ room joined or not

  const lastLocationSent = useRef(0);

  // ✅ SOCKET DEBUG (connection lifecycle)
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      setIsReady(false);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // ✅ Socket event handlers
  const handlers = useMemo(() => ({
    room_messages: (data: ChatMessage[]) => {
      console.log("📜 Initial messages received:", data);
      setMessages(data);
      setIsReady(true); // ✅ user is inside a room
    },

    new_message: (msg: ChatMessage) => {
      console.log("📩 New message received:", msg);
      setMessages((prev) => [...prev, msg]);
    },

    more_messages: (msgs: ChatMessage[]) => {
      console.log("📦 Older messages received:", msgs);
      setMessages((prev) => [...msgs, ...prev]);
    },

    error: (err: string) => {
      console.error("❌ Server error:", err);
      setError(err);
    },

    force_disconnect: (msg: any) => {
      console.warn("⚠️ Forced disconnect:", msg);
      alert(msg);
      socket.disconnect();
    }

  }), []);

  useScocket(handlers);

  // ✅ LOCATION: instant fetch (IMPORTANT FIX)
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    console.log("📍 Getting initial location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        console.log("📍 Initial location:", latitude, longitude);

        socket.emit("update_location", {
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => {
        console.error("❌ Initial location error:", err);
      }
    );
  }, []);

  // ✅ LOCATION: continuous tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // 🔥 throttle (every 5 sec)
        if (Date.now() - lastLocationSent.current < 5000) return;

        console.log("📡 Updating location:", latitude, longitude);

        socket.emit("update_location", {
          lat: latitude,
          lng: longitude,
        });

        lastLocationSent.current = Date.now();
      },
      (err) => console.error("❌ Location watch error:", err),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ✉️ Send message
  const sendMessage = () => {
    console.log("📝 Attempting to send message...");

    if (!isReady) {
      console.warn("⏳ Not ready: user not in room yet");
      alert("Waiting for location / room...");
      return;
    }

    if (!input.trim()) {
      console.warn("⚠️ Empty message blocked");
      return;
    }

    console.log("🚀 Sending message:", input);

    socket.emit("send_message", {
      content: input,
      attachments: [],
    });

    setInput("");
  };

  // 📜 Load older messages
  const loadMore = () => {
    if (!messages.length) {
      console.warn("⚠️ No messages to paginate");
      return;
    }

    const oldest = messages[0];

    console.log("📜 Loading more messages before:", oldest.createdAt || oldest.time);

    socket.emit("load_more", {
      before: oldest.createdAt || oldest.time,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🌍 Geo Chat</h2>

      {/* STATUS */}
      <p>
        Status:{" "}
        <b style={{ color: isReady ? "green" : "orange" }}>
          {isReady ? "Connected to room ✅" : "Waiting for location... ⏳"}
        </b>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={loadMore}>Load More</button>

      <div
        style={{
          height: "350px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          margin: "10px 0",
          padding: "10px",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "5px" }}>
            <b>{m.sender || m.user || "Unknown"}</b>: {m.content}
          </div>
        ))}
      </div>

      <input
        placeholder="Type message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ marginRight: "10px" }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
};