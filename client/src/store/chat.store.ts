import { create } from "zustand";

type Message = {
  _id: string;
  content?: string;
  attachments?: any[];
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;

  reactions?: Record<string, string[]>;
};

type ChatState = {
    messages: Message[];

    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    clearMessages: () => void;

    updateReaction: (messageId: string, reactions: Record<string, string[]>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    updateReaction: (messageId, reactions) => set((state) => ({
        messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
        ),
    })),

    clearMessages: () => set({ messages: [] }),
}))