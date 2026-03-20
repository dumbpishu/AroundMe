import type { AuthUser } from "../types/auth";

const USER_KEY = "geochat.user";

export const saveAuthUser = (user: AuthUser) => {
  const safeUser: AuthUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar: user.avatar,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
};

export const getAuthUser = (): AuthUser | null => {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const clearAuthUser = () => {
  localStorage.removeItem(USER_KEY);
};
