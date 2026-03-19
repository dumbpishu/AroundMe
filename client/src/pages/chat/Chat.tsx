import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { socket } from "../../lib/socket";
import { useScocket } from "../../hooks/useSocket";
import { Button } from "../../components/Button";
import { uploadChatMedia } from "../../api/upload";
import { useAuth } from "../../context/AuthContext";
import { AppLogo } from "../../components/ui/AppLogo";

type ChatMessage = {
  _id?: string;
  createdAt?: string;
  time?: string;
  sender?: { _id?: string; username?: string; avatar?: string };
  user?: string;
  content?: string;
  attachments?: Array<{ url: string; type: "image" | "audio" | "video" }>;
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingMedia, setPendingMedia] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ name: string; url: string; type: string }>>([]);

  const endRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const prependContextRef = useRef<{ active: boolean; previousHeight: number; previousTop: number }>({
    active: false,
    previousHeight: 0,
    previousTop: 0,
  });

  const lastLocationSent = useRef(0);
  const { user } = useAuth();

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setError("");
    });

    socket.on("disconnect", () => {
      setIsReady(false);
    });

    socket.on("connect_error", (err) => {
      setError(`Socket connection failed: ${err.message}`);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  const handlers = useMemo(
    () => ({
      room_messages: (...args: unknown[]) => {
        const [data] = args as [ChatMessage[]];
        shouldAutoScrollRef.current = true;
        setMessages(data);
        setIsReady(true);
      },

      new_message: (...args: unknown[]) => {
        const [msg] = args as [ChatMessage];
        shouldAutoScrollRef.current = false;
        setMessages((prev) => [...prev, msg]);
      },

      more_messages: (...args: unknown[]) => {
        const [msgs] = args as [ChatMessage[]];
        setMessages((prev) => [...msgs, ...prev]);
        setLoadingMore(false);
      },

      error: (...args: unknown[]) => {
        const [err] = args as [string];
        setError(err);
        setLoadingMore(false);
        setIsSending(false);
        setIsUploadingImages(false);
      },

      force_disconnect: (...args: unknown[]) => {
        const [msg] = args as [string];
        setError(msg || "Disconnected by server.");
        socket.disconnect();
      },
    }),
    []
  );

  useScocket(handlers);

  useEffect(() => {
    const container = messageListRef.current;

    if (!container) {
      return;
    }

    if (prependContextRef.current.active) {
      const { previousHeight, previousTop } = prependContextRef.current;
      const currentHeight = container.scrollHeight;
      container.scrollTop = currentHeight - previousHeight + previousTop;
      prependContextRef.current.active = false;
      return;
    }

    if (messages.length > 0 && shouldAutoScrollRef.current) {
      scrollToBottom();
      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mediaPreviews]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        socket.emit("update_location", {
          lat: latitude,
          lng: longitude,
        });
      },
      () => {
        setError("Unable to fetch location. Enable location access and refresh.");
      }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (Date.now() - lastLocationSent.current < 5000) {
          return;
        }

        socket.emit("update_location", {
          lat: latitude,
          lng: longitude,
        });

        lastLocationSent.current = Date.now();
      },
      () => {
        setError("Live location updates paused due to location permission issues.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const removePendingMedia = (name: string) => {
    setPendingMedia((prev) => prev.filter((file) => file.name !== name));
    setMediaPreviews((prev) => {
      const removed = prev.find((preview) => preview.name === name);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((preview) => preview.name !== name);
    });
  };

  const onMediaPick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const allowedFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")
    );
    const nextMedia = [...pendingMedia, ...allowedFiles].slice(0, 10);
    setPendingMedia(nextMedia);

    mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setMediaPreviews(
      nextMedia.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }))
    );
    event.target.value = "";
  };

  const sendMessage = async () => {
    if (!isReady) {
      setError("Waiting for room assignment from your location.");
      return;
    }

    if (!input.trim() && pendingMedia.length === 0) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      let attachments: Array<{ url: string; type: "image" | "audio" | "video" }> = [];

      if (pendingMedia.length > 0) {
        setIsUploadingImages(true);
        const uploaded = await uploadChatMedia(pendingMedia);
        attachments = uploaded.data.map((item) => ({
          url: item.url,
          type: item.type,
        }));
      }

      socket.emit("send_message", {
        content: input.trim(),
        attachments,
      });

      shouldAutoScrollRef.current = true;

      setInput("");
      setPendingMedia([]);
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
      setMediaPreviews([]);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
      setIsUploadingImages(false);
    }
  };

  const loadMore = () => {
    if (!messages.length || loadingMore) {
      return;
    }

    const container = messageListRef.current;
    if (container) {
      prependContextRef.current = {
        active: true,
        previousHeight: container.scrollHeight,
        previousTop: container.scrollTop,
      };
    }

    const oldest = messages[0];
    const before = oldest.createdAt || oldest.time;

    if (!before) {
      return;
    }

    setLoadingMore(true);

    socket.emit("load_more", {
      before,
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[radial-gradient(700px_300px_at_80%_0%,rgba(11,116,222,0.1),transparent)]">
      <header className="flex items-center justify-between gap-3 border-b border-(--border) bg-white/95 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex items-center gap-3">
          <AppLogo compact />
          <div>
            <h1 className="text-base font-bold" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>GeoChat Room</h1>
            <p className="text-xs text-(--text-muted)">{user?.username || "Guest"}</p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${isReady ? "bg-[#e6f7f3] text-[#176657] border border-[#8cd6c8]" : "bg-[#fff5e7] text-[#985c16] border border-[#f0d19f]"}`}
        >
          {isReady ? "Live" : "Connecting"}
        </span>
      </header>

      <div className="flex h-full min-h-0 w-full flex-col px-2 pb-2 pt-1.5 sm:px-4 sm:pb-4">
        <div className="mb-1.5 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-(--border) bg-white px-2.5 py-1 text-[11px] font-semibold text-(--text-secondary) hover:bg-(--bg-soft) disabled:opacity-70"
          >
            {loadingMore ? "Loading..." : "Older messages"}
          </button>
        </div>

        {error && (
          <p className="mb-2 rounded-xl border border-[#efc3c3] bg-[#fff3f3] px-3 py-2 text-xs text-[#8f2f2f]">
            {error}
          </p>
        )}

        <div ref={messageListRef} className="chat-scrollbar min-h-0 flex-1 space-y-2 overflow-y-scroll rounded-2xl border border-(--border) bg-white p-2.5 pr-2 shadow-[0_14px_30px_rgba(17,37,63,0.08)] sm:p-3 sm:pr-2.5">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-(--border) bg-(--bg-soft) p-8 text-center">
              <p className="text-sm text-(--text-secondary)">
                No messages in this room yet.
              </p>
            </div>
          )}

          {messages.map((m, index) => {
            const senderName = m.sender?.username || "Unknown";
            const isMine = Boolean(user?.username && senderName === user.username);
            const createdAt = m.createdAt || m.time;
            const avatarLabel = senderName.slice(0, 1).toUpperCase();
            const avatarUrl = isMine ? user?.avatar : m.sender?.avatar;

            return (
              <div key={m._id || `${senderName}-${index}-${createdAt}`} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                {!isMine && (
                  <div className="mt-1 h-9 w-9 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={senderName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-full bg-(--bg-soft) text-xs font-bold text-(--brand)">
                        {avatarLabel}
                      </div>
                    )}
                  </div>
                )}

                <article className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-[0_8px_18px_rgba(17,37,63,0.08)] sm:max-w-[75%] ${isMine ? "bg-(--brand) text-white" : "bg-(--bg-soft) text-(--text-primary)"}`}>
                  <p className={`text-xs font-semibold ${isMine ? "text-white/85" : "text-(--text-muted)"}`}>
                    {senderName}
                  </p>

                  {m.content && <p className="mt-1 wrap-break-word text-sm">{m.content}</p>}

                  {!!m.attachments?.length && (
                    <div className="mt-2 grid gap-2">
                      {m.attachments.map((attachment) => {
                        if (attachment.type === "audio") {
                          return (
                            <audio key={attachment.url} controls className="w-full">
                              <source src={attachment.url} />
                            </audio>
                          );
                        }

                        if (attachment.type === "video") {
                          return (
                            <video key={attachment.url} controls className="max-h-72 w-full rounded-xl border border-white/20 bg-black object-contain">
                              <source src={attachment.url} />
                            </video>
                          );
                        }

                        return (
                          <img
                            key={attachment.url}
                            src={attachment.url}
                            alt="chat attachment"
                            className="max-h-64 w-full rounded-xl border border-white/20 object-cover"
                          />
                        );
                      })}
                    </div>
                  )}

                  {createdAt && (
                    <p className={`mt-2 text-[11px] ${isMine ? "text-white/70" : "text-(--text-muted)"}`}>
                      {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </article>

                {isMine && (
                  <div className="mt-1 h-9 w-9 shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={senderName} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-full bg-(--bg-soft) text-xs font-bold text-(--brand)">
                        {avatarLabel}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="mt-2 rounded-2xl border border-(--border) bg-white p-2.5 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
          <div className="flex items-center gap-2">
            <label className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-xl border border-(--border) bg-(--bg-soft) px-3 text-sm font-semibold text-(--text-primary) hover:bg-[#dde9f6]">
              Media
              <input type="file" accept="image/*,audio/*,video/*" multiple className="hidden" onChange={onMediaPick} disabled={isUploadingImages} />
            </label>

            <input
              type="text"
              placeholder="Message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              className="h-11 flex-1 rounded-xl border border-(--border) bg-(--bg-main) px-4 text-sm outline-none transition focus:border-(--brand) focus:ring-3 focus:ring-[#0b74de26]"
            />

            <Button onClick={() => void sendMessage()} loading={isSending} className="h-11 min-w-[110px] shrink-0">
              Send message
            </Button>
          </div>

          {isUploadingImages && <span className="mt-1.5 block text-[11px] text-(--text-muted)">Uploading media...</span>}

          {pendingMedia.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {pendingMedia.map((file) => {
                const preview = mediaPreviews.find((item) => item.name === file.name);
                const isImage = file.type.startsWith("image/");
                const isAudio = file.type.startsWith("audio/");
                return (
                  <div key={file.name} className="relative rounded-xl border border-(--border) bg-(--bg-main) p-2">
                    {isImage ? (
                      <img
                        src={preview?.url || ""}
                        alt={file.name}
                        className="h-20 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-20 w-full place-items-center rounded-lg bg-white text-xs font-semibold text-(--text-secondary)">
                        {isAudio ? "Audio" : "Video"}
                      </div>
                    )}
                    <p className="mt-1 truncate text-[10px] text-(--text-muted)">{file.name}</p>
                    <button
                      type="button"
                      onClick={() => removePendingMedia(file.name)}
                      className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};