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

type TypingUser = {
    userId: string;
    username: string;
}

type ChatState = {
    messages: Message[];
    typingUsers: TypingUser[];

    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    clearMessages: () => void;

    updateReaction: (messageId: string, reactions: Record<string, string[]>) => void;

    setTyping: (typingUser: TypingUser) => void;
    removeTyping: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    typingUsers: [],

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    updateReaction: (messageId, reactions) => set((state) => ({
        messages: state.messages.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
        ),
    })),

    clearMessages: () => set({ messages: [] }),

    setTyping: (typingUser) => set((state) => {
        if (state.typingUsers.some((u) => u.userId === typingUser.userId)) {
            return state; // already exists
        }
        return { typingUsers: [...state.typingUsers, typingUser] };
    }),

    removeTyping: (userId) => set((state) => ({
        typingUsers: state.typingUsers.filter((u) => u.userId !== userId),
    })),
}))