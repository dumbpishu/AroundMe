import { create } from "zustand";
import * as authApi from "../api/auth.api";

type User = {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;

  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const STORAGE_KEY = "geochat_user";

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const persistUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
    user: getStoredUser(),
    loading: true,

    // send otp
    sendOtp: async (email) => {
        try {
            await authApi.sendOtp(email);
        } catch (error) {
            console.error("Failed to send OTP:", error);
            throw error; 
        }
    },

    // verify otp
    verifyOtp: async (email, otp) => {
        try {
            const res = await authApi.verifyOtp(email, otp);
            const user = res.data.user;

            set({ user });
            persistUser(user);
        } catch (error) {
            console.error("Failed to verify OTP:", error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Failed to logout:", error);
        } finally {
            set({ user: null });
            persistUser(null);
        }
    },

    refreshUser: async () => {
        try {
            const res = await authApi.getCurrentUser();
            const user = res.data.user;
            
            set({ user });
            persistUser(user);
        } catch {
            set({ user: null });
            persistUser(null);
        } finally {
            set({ loading: false });
        }
    }
}))