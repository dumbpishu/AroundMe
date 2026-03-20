import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../lib/authStorage";
import { getCurrentUser } from "../api/auth";
import { logoutUser } from "../api/auth";
import { socket } from "../lib/socket";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (nextUser: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());
  const [isLoading, setIsLoading] = useState(true);

  const login = (nextUser: AuthUser) => {
    saveAuthUser(nextUser);
    setUser(nextUser);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      socket.disconnect();
      clearAuthUser();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await getCurrentUser();

      if (response.success) {
        login(response.data);
        return;
      }

      await logout();
    } catch {
      await logout();
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
